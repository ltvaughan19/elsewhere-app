import {
  SOURCE_MONITOR_FETCH_TIMEOUT_MS,
  SOURCE_MONITOR_MAX_RESPONSE_BYTES,
  SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
  canFollowSourceRedirect,
  classifyLiteralIpAddress,
  prepareSourceContent,
  sha256Hex,
  validateDeclaredContentLength,
  validateOfficialSourceRedirect,
  validateOfficialSourceUrl,
  validateSourceContentType,
  type SupportedSourceContentType,
} from "@expat-atlas/source-engine";
import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { request as httpsRequest } from "node:https";
import type { RequestOptions as HttpsRequestOptions } from "node:https";
import type {
  ClientRequest,
  IncomingHttpHeaders,
  IncomingMessage,
} from "node:http";
import "server-only";

const MAX_URL_LENGTH = 4096;
const MAX_METADATA_HEADER_LENGTH = 1000;
const SOURCE_MONITOR_USER_AGENT =
  "Elsewhere-Official-Source-Monitor/1.0 (+https://elsewhereplan.com)";
const REDIRECT_STATUSES = new Set([300, 301, 302, 303, 307, 308]);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const SHA_256_HEX = /^[a-f0-9]{64}$/;
const NORMALIZATION_VERSION = /^[a-z0-9]+(?:[._-][a-z0-9]+){0,7}$/;
const RETRYABLE_ADDRESS_FAILURE_CODES = new Set([
  "content_length_mismatch",
  "response_aborted",
]);

export type SourceMonitorFailureStatus = "blocked" | "unavailable" | "failed";

interface SafeSourceFetchSuccessBase {
  ok: true;
  finalUrl: string;
  etag: string | null;
  lastModified: string | null;
  validatorEtagSent: boolean;
  validatorLastModifiedSent: boolean;
  finalUrlChanged: boolean;
}

export type SafeSourceFetch200Result = SafeSourceFetchSuccessBase & {
  httpStatus: 200;
  contentType: SupportedSourceContentType;
  contentLengthBytes: number;
  rawHash: string;
  semanticHash: string;
  normalizationAlgorithmVersion: typeof SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION;
  notModified: false;
};

export type SafeSourceFetch304Result = SafeSourceFetchSuccessBase & {
  httpStatus: 304;
  notModified: true;
};

export type SafeSourceFetchResult =
  | SafeSourceFetch200Result
  | SafeSourceFetch304Result
  | {
      ok: false;
      status: SourceMonitorFailureStatus;
      code: string;
      detail: string;
      httpStatus: number | null;
      finalUrl: string | null;
      validatorEtagSent: boolean;
      validatorLastModifiedSent: boolean;
    };

export interface SafeSourceFetchInput {
  url: string;
  approvedHostnames: readonly string[];
  previousRawHash: string | null;
  previousSemanticHash: string | null;
  previousContentType: string | null;
  previousNormalizationAlgorithmVersion: string | null;
  previousFinalUrl: string | null;
  previousEtag: string | null;
  previousLastModified: string | null;
}

interface RawPinnedResponse {
  statusCode: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
}

class SourceFetchError extends Error {
  constructor(
    readonly status: SourceMonitorFailureStatus,
    readonly code: string,
    message: string,
    readonly httpStatus: number | null = null,
    readonly finalUrl: string | null = null,
  ) {
    super(message);
    this.name = "SourceFetchError";
  }
}

function firstHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function boundedDetail(value: string): string {
  const cleaned = value.replace(CONTROL_CHARACTERS, " ").trim();
  return (cleaned || "Official source monitoring failed.").slice(0, 2000);
}

type ValidatorHeaderKind = "etag" | "last-modified";

function isValidEntityTag(value: string): boolean {
  return /^(?:W\/)?"[\x21\x23-\x7e\x80-\xff]*"$/.test(value);
}

function isValidHttpDate(value: string): boolean {
  if (
    !/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(
      value,
    )
  ) {
    return false;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toUTCString() === value;
}

function isValidValidatorHeader(
  value: string,
  kind: ValidatorHeaderKind,
): boolean {
  return kind === "etag" ? isValidEntityTag(value) : isValidHttpDate(value);
}

function responseValidatorHeader(
  value: string | string[] | undefined,
  headerName: string,
  kind: ValidatorHeaderKind,
): string | null {
  if (Array.isArray(value) && value.length !== 1) {
    throw new SourceFetchError(
      "blocked",
      "malformed_response_header",
      `The official source returned an ambiguous ${headerName} header.`,
    );
  }
  const header = firstHeader(value);
  if (header === null) return null;
  if (
    !header ||
    header.length > MAX_METADATA_HEADER_LENGTH ||
    CONTROL_CHARACTERS.test(header) ||
    !isValidValidatorHeader(header, kind)
  ) {
    throw new SourceFetchError(
      "blocked",
      "malformed_response_header",
      `The official source returned an unsafe ${headerName} header.`,
    );
  }
  return header;
}

function requestValidatorHeader(
  value: string | null,
  kind: ValidatorHeaderKind,
): string | null {
  if (
    value === null ||
    !value ||
    value.length > MAX_METADATA_HEADER_LENGTH ||
    CONTROL_CHARACTERS.test(value) ||
    !isValidValidatorHeader(value, kind)
  ) {
    return null;
  }
  return value;
}

function failForHttpStatus(statusCode: number, finalUrl: string): never {
  if (statusCode === 401 || statusCode === 403) {
    throw new SourceFetchError(
      "blocked",
      "http_access_blocked",
      `The official source refused the monitor request with HTTP ${statusCode}.`,
      statusCode,
      finalUrl,
    );
  }
  if (statusCode === 404 || statusCode === 410 || statusCode === 429) {
    throw new SourceFetchError(
      "unavailable",
      "http_unavailable",
      `The official source is currently unavailable to the monitor (HTTP ${statusCode}).`,
      statusCode,
      finalUrl,
    );
  }
  throw new SourceFetchError(
    statusCode >= 500 ? "unavailable" : "failed",
    "unexpected_http_status",
    `The official source returned unexpected HTTP ${statusCode}.`,
    statusCode,
    finalUrl,
  );
}

async function lookupPinnedPublicAddresses(
  hostname: string,
  deadline: number,
): Promise<LookupAddress[]> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    throw new SourceFetchError(
      "unavailable",
      "fetch_timeout",
      "The official source monitor reached its time limit.",
    );
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let addresses: LookupAddress[];
  try {
    addresses = await Promise.race([
      lookup(hostname, { all: true, verbatim: true }),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new SourceFetchError(
                "unavailable",
                "dns_timeout",
                "The official source hostname did not resolve in time.",
              ),
            ),
          remaining,
        );
      }),
    ]);
  } catch (error) {
    if (error instanceof SourceFetchError) throw error;
    throw new SourceFetchError(
      "unavailable",
      "dns_unavailable",
      "The official source hostname could not be resolved.",
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  if (addresses.length === 0) {
    throw new SourceFetchError(
      "unavailable",
      "dns_unavailable",
      "The official source hostname did not return an address.",
    );
  }

  for (const address of addresses) {
    if (classifyLiteralIpAddress(address.address) !== "public") {
      throw new SourceFetchError(
        "blocked",
        "unsafe_dns_address",
        "The official source hostname resolved to a non-public address.",
      );
    }
  }

  const unique = new Map<string, LookupAddress>();
  for (const address of addresses) {
    unique.set(`${address.family}:${address.address}`, address);
  }
  return [...unique.values()].sort((left, right) => {
    const familyOrder = left.family - right.family;
    return familyOrder || left.address.localeCompare(right.address);
  });
}

async function requestPinnedAddress(
  url: string,
  hostname: string,
  address: LookupAddress,
  deadline: number,
  conditionalHeaders: Readonly<Record<string, string>>,
  onRequestIssued: () => void,
): Promise<RawPinnedResponse> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    throw new SourceFetchError(
      "unavailable",
      "fetch_timeout",
      "The official source monitor reached its time limit.",
    );
  }

  return new Promise<RawPinnedResponse>((resolve, reject) => {
    let settled = false;
    let response: IncomingMessage | null = null;
    let request: ClientRequest | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (
      result:
        | { ok: true; value: RawPinnedResponse }
        | { ok: false; error: Error },
    ) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (result.ok) resolve(result.value);
      else reject(result.error);
    };

    timer = setTimeout(() => {
      const error = new SourceFetchError(
        "unavailable",
        "fetch_timeout",
        "The official source monitor reached its time limit.",
        null,
        url,
      );
      response?.destroy(error);
      request?.destroy(error);
      finish({ ok: false, error });
    }, remaining);

    try {
      const requestOptions: HttpsRequestOptions & {
        autoSelectFamily: false;
      } = {
        method: "GET",
        agent: false,
        autoSelectFamily: false,
        servername: hostname,
        headers: {
          accept:
            "text/html, application/xhtml+xml, text/plain;q=0.9, application/pdf;q=0.8",
          "accept-encoding": "identity",
          "user-agent": SOURCE_MONITOR_USER_AGENT,
          ...conditionalHeaders,
        },
        lookup: (_lookupHostname, options, callback) => {
          // Pin the connection to one address that was resolved and validated
          // immediately before this attempt. The array branch remains correct
          // on Node versions that request the all-address callback contract.
          if (typeof options === "object" && options.all) {
            callback(null, [address]);
            return;
          }
          callback(null, address.address, address.family);
        },
      };
      request = httpsRequest(url, requestOptions, (incoming) => {
        response = incoming;
        const statusCode = incoming.statusCode ?? 0;
        incoming.once("error", (error) => finish({ ok: false, error }));

        if (
          statusCode === 304 ||
          REDIRECT_STATUSES.has(statusCode) ||
          statusCode !== 200
        ) {
          incoming.destroy();
          finish({
            ok: true,
            value: {
              statusCode,
              headers: incoming.headers,
              body: Buffer.alloc(0),
            },
          });
          return;
        }

        const contentEncoding = firstHeader(
          incoming.headers["content-encoding"],
        );
        if (contentEncoding && contentEncoding.toLowerCase() !== "identity") {
          const error = new SourceFetchError(
            "blocked",
            "unsupported_content_encoding",
            "The official source ignored the monitor's identity-encoding requirement.",
            statusCode,
            url,
          );
          incoming.destroy(error);
          request?.destroy(error);
          finish({ ok: false, error });
          return;
        }

        const declaredLength = validateDeclaredContentLength(
          firstHeader(incoming.headers["content-length"]),
        );
        if (!declaredLength.ok) {
          const empty = declaredLength.reason === "empty";
          const error = new SourceFetchError(
            empty ? "failed" : "blocked",
            declaredLength.reason === "too_large"
              ? "response_too_large"
              : empty
                ? "empty_response"
                : "malformed_content_length",
            empty
              ? "The official source returned an empty response."
              : "The official source returned an unsafe response size.",
            statusCode,
            url,
          );
          incoming.destroy(error);
          request?.destroy(error);
          finish({ ok: false, error });
          return;
        }

        const chunks: Buffer[] = [];
        let byteLength = 0;

        incoming.on("data", (chunk: Buffer | Uint8Array) => {
          if (settled) return;
          const buffer = Buffer.from(chunk);
          byteLength += buffer.byteLength;
          if (byteLength > SOURCE_MONITOR_MAX_RESPONSE_BYTES) {
            const error = new SourceFetchError(
              "blocked",
              "response_too_large",
              "The official source exceeded the monitor's five-megabyte response limit.",
              statusCode,
              url,
            );
            incoming.destroy(error);
            request?.destroy(error);
            finish({ ok: false, error });
            return;
          }
          chunks.push(buffer);
        });
        incoming.once("aborted", () => {
          finish({
            ok: false,
            error: new SourceFetchError(
              "unavailable",
              "response_aborted",
              "The official source ended its response unexpectedly.",
              statusCode,
              url,
            ),
          });
        });
        incoming.once("end", () => {
          if (
            declaredLength.byteLength !== null &&
            declaredLength.byteLength !== byteLength
          ) {
            finish({
              ok: false,
              error: new SourceFetchError(
                "unavailable",
                "content_length_mismatch",
                "The official source response ended at an unexpected size.",
                statusCode,
                url,
              ),
            });
            return;
          }
          if (byteLength === 0) {
            finish({
              ok: false,
              error: new SourceFetchError(
                "failed",
                "empty_response",
                "The official source returned an empty response.",
                statusCode,
                url,
              ),
            });
            return;
          }
          finish({
            ok: true,
            value: {
              statusCode,
              headers: incoming.headers,
              body: Buffer.concat(chunks, byteLength),
            },
          });
        });
      });

      request.once("error", (error) => finish({ ok: false, error }));
      onRequestIssued();
      request.end();
    } catch (error) {
      finish({
        ok: false,
        error:
          error instanceof Error ? error : new Error("HTTPS request failed."),
      });
    }
  });
}

async function requestPinned(
  url: string,
  hostname: string,
  deadline: number,
  conditionalHeaders: Readonly<Record<string, string>>,
  onRequestIssued: () => void,
): Promise<RawPinnedResponse> {
  const addresses = await lookupPinnedPublicAddresses(hostname, deadline);
  let lastError: unknown;

  for (const [index, address] of addresses.entries()) {
    try {
      return await requestPinnedAddress(
        url,
        hostname,
        address,
        deadline,
        conditionalHeaders,
        onRequestIssued,
      );
    } catch (error) {
      lastError = error;
      const hasAnotherAddress = index < addresses.length - 1;
      const retryable =
        !(error instanceof SourceFetchError) ||
        RETRYABLE_ADDRESS_FAILURE_CODES.has(error.code);
      if (!hasAnotherAddress || !retryable || Date.now() >= deadline)
        throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new SourceFetchError(
        "unavailable",
        "transport_failure",
        "The official source could not be reached securely.",
        null,
        url,
      );
}

function validateCharsetLabel(value: string): string {
  const charset = value.trim().toLowerCase();
  if (!/^[a-z0-9._-]{1,40}$/.test(charset)) {
    throw new SourceFetchError(
      "blocked",
      "malformed_charset",
      "The official source returned an unsafe text encoding label.",
    );
  }
  return charset;
}

function charsetFromBom(body: Buffer): string | null {
  if (
    body.byteLength >= 3 &&
    body[0] === 0xef &&
    body[1] === 0xbb &&
    body[2] === 0xbf
  ) {
    return "utf-8";
  }
  if (body.byteLength >= 2 && body[0] === 0xff && body[1] === 0xfe) {
    return "utf-16le";
  }
  if (body.byteLength >= 2 && body[0] === 0xfe && body[1] === 0xff) {
    return "utf-16be";
  }
  return null;
}

function attributeFromTag(tag: string, attributeName: string): string | null {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(
    new RegExp(
      `\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\u0060]+))`,
      "i",
    ),
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? null) : null;
}

function charsetFromDocument(body: Buffer, mediaType: string): string | null {
  const preview = body.subarray(0, 1024).toString("latin1");

  if (mediaType === "application/xhtml+xml") {
    const declaration = preview.match(/^\s*<\?xml\b[^>]*\?>/i)?.[0];
    const xmlEncoding = declaration
      ? attributeFromTag(declaration, "encoding")
      : null;
    if (xmlEncoding) return validateCharsetLabel(xmlEncoding);
  }

  if (mediaType !== "text/html" && mediaType !== "application/xhtml+xml") {
    return null;
  }

  for (const match of preview.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const direct = attributeFromTag(tag, "charset");
    if (direct) return validateCharsetLabel(direct);

    const httpEquiv = attributeFromTag(tag, "http-equiv")?.toLowerCase();
    const content = attributeFromTag(tag, "content");
    if (httpEquiv === "content-type" && content) {
      const contentCharset = content.match(
        /(?:^|;)\s*charset\s*=\s*(?:"([^"]+)"|'([^']+)'|([^;\s]+))/i,
      );
      const value =
        contentCharset?.[1] ?? contentCharset?.[2] ?? contentCharset?.[3];
      if (value) return validateCharsetLabel(value);
    }
  }
  return null;
}

function decodeSourceText(body: Buffer, contentTypeHeader: string): string {
  const hasCharsetParameter = /;\s*charset\s*=/i.test(contentTypeHeader);
  const charsetMatch = contentTypeHeader.match(
    /;\s*charset\s*=\s*(?:"([^"]+)"|([^;\s]+))/i,
  );
  if (hasCharsetParameter && !charsetMatch) {
    throw new SourceFetchError(
      "blocked",
      "malformed_charset",
      "The official source returned a malformed text encoding label.",
    );
  }
  const declaredCharset = charsetMatch
    ? validateCharsetLabel(charsetMatch[1] ?? charsetMatch[2] ?? "")
    : null;
  const mediaType = contentTypeHeader.split(";", 1)[0]!.trim().toLowerCase();
  const charset =
    charsetFromBom(body) ??
    declaredCharset ??
    charsetFromDocument(body, mediaType) ??
    "utf-8";
  try {
    return new TextDecoder(charset, { fatal: true }).decode(body);
  } catch {
    throw new SourceFetchError(
      "failed",
      "text_decode_failed",
      "The official source response could not be decoded without data loss.",
    );
  }
}

function validatePdfSignature(body: Buffer) {
  if (
    body.byteLength < 5 ||
    body.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new SourceFetchError(
      "blocked",
      "invalid_pdf_signature",
      "The official source labeled a response as PDF, but its file signature did not match.",
    );
  }
}

function failureResult(
  error: unknown,
  currentUrl: string,
  validatorEtagSent: boolean,
  validatorLastModifiedSent: boolean,
): SafeSourceFetchResult {
  if (error instanceof SourceFetchError) {
    return {
      ok: false,
      status: error.status,
      code: error.code,
      detail: boundedDetail(error.message),
      httpStatus: error.httpStatus,
      finalUrl: error.finalUrl ?? currentUrl,
      validatorEtagSent,
      validatorLastModifiedSent,
    };
  }
  return {
    ok: false,
    status: "unavailable",
    code: "transport_failure",
    detail: "The official source could not be reached securely.",
    httpStatus: null,
    finalUrl: currentUrl,
    validatorEtagSent,
    validatorLastModifiedSent,
  };
}

export async function safeFetchOfficialSource(
  input: SafeSourceFetchInput,
): Promise<SafeSourceFetchResult> {
  const deadline = Date.now() + SOURCE_MONITOR_FETCH_TIMEOUT_MS;
  let currentUrl = input.url;
  let completedRedirects = 0;
  let validatorEtagEverSent = false;
  let validatorLastModifiedEverSent = false;

  const previousFinalValidation = input.previousFinalUrl
    ? validateOfficialSourceUrl(input.previousFinalUrl, input.approvedHostnames)
    : null;
  const previousFinalUrl =
    previousFinalValidation?.ok &&
    previousFinalValidation.normalizedUrl.length <= MAX_URL_LENGTH
      ? previousFinalValidation.normalizedUrl
      : null;
  const etag = requestValidatorHeader(input.previousEtag, "etag");
  const lastModified = requestValidatorHeader(
    input.previousLastModified,
    "last-modified",
  );
  const previousType = validateSourceContentType(input.previousContentType);
  const hasCompletePreviousBaseline =
    previousType.ok &&
    input.previousRawHash !== null &&
    SHA_256_HEX.test(input.previousRawHash) &&
    input.previousSemanticHash !== null &&
    SHA_256_HEX.test(input.previousSemanticHash) &&
    input.previousNormalizationAlgorithmVersion !== null &&
    NORMALIZATION_VERSION.test(input.previousNormalizationAlgorithmVersion);

  try {
    while (true) {
      const validated = validateOfficialSourceUrl(
        currentUrl,
        input.approvedHostnames,
      );
      if (!validated.ok || validated.normalizedUrl.length > MAX_URL_LENGTH) {
        throw new SourceFetchError(
          "blocked",
          validated.ok ? "url_too_long" : `url_${validated.reason}`,
          validated.ok
            ? "The official source URL exceeds the monitor's safe length."
            : validated.message,
          null,
          currentUrl,
        );
      }
      currentUrl = validated.normalizedUrl;

      // Cache validators describe one exact representation. Never send them to
      // an earlier redirect hop, a new path, or a different approved host.
      const conditionalHeaders: Record<string, string> = {};
      if (currentUrl === previousFinalUrl && hasCompletePreviousBaseline) {
        if (etag) conditionalHeaders["if-none-match"] = etag;
        if (lastModified)
          conditionalHeaders["if-modified-since"] = lastModified;
      }
      const sentConditionalValidator =
        Object.keys(conditionalHeaders).length > 0;
      const validatorEtagSent =
        conditionalHeaders["if-none-match"] !== undefined;
      const validatorLastModifiedSent =
        conditionalHeaders["if-modified-since"] !== undefined;

      const response = await requestPinned(
        currentUrl,
        validated.hostname,
        deadline,
        conditionalHeaders,
        () => {
          validatorEtagEverSent ||= validatorEtagSent;
          validatorLastModifiedEverSent ||= validatorLastModifiedSent;
        },
      );

      if (REDIRECT_STATUSES.has(response.statusCode)) {
        if (!canFollowSourceRedirect(completedRedirects)) {
          throw new SourceFetchError(
            "blocked",
            "redirect_limit_exceeded",
            "The official source exceeded the monitor's redirect limit.",
            response.statusCode,
            currentUrl,
          );
        }
        const location = firstHeader(response.headers.location);
        if (!location || location.length > MAX_URL_LENGTH) {
          throw new SourceFetchError(
            "blocked",
            "invalid_redirect_location",
            "The official source returned a missing or unsafe redirect location.",
            response.statusCode,
            currentUrl,
          );
        }
        const redirect = validateOfficialSourceRedirect(
          location,
          currentUrl,
          input.approvedHostnames,
        );
        if (!redirect.ok || redirect.normalizedUrl.length > MAX_URL_LENGTH) {
          throw new SourceFetchError(
            "blocked",
            redirect.ok
              ? "redirect_url_too_long"
              : `redirect_${redirect.reason}`,
            redirect.ok
              ? "The official source redirect exceeds the monitor's safe length."
              : redirect.message,
            response.statusCode,
            currentUrl,
          );
        }
        currentUrl = redirect.normalizedUrl;
        completedRedirects += 1;
        continue;
      }

      if (response.statusCode === 304) {
        if (
          !sentConditionalValidator ||
          currentUrl !== previousFinalUrl ||
          !previousType.ok ||
          !input.previousRawHash ||
          !input.previousSemanticHash ||
          !input.previousNormalizationAlgorithmVersion
        ) {
          throw new SourceFetchError(
            "failed",
            "invalid_not_modified_response",
            "The official source returned not-modified without a complete prior baseline.",
            304,
            currentUrl,
          );
        }
        return {
          ok: true,
          httpStatus: 304,
          finalUrl: currentUrl,
          etag:
            responseValidatorHeader(response.headers.etag, "ETag", "etag") ??
            etag,
          lastModified:
            responseValidatorHeader(
              response.headers["last-modified"],
              "Last-Modified",
              "last-modified",
            ) ?? lastModified,
          validatorEtagSent: validatorEtagEverSent,
          validatorLastModifiedSent: validatorLastModifiedEverSent,
          notModified: true,
          finalUrlChanged: false,
        };
      }

      if (response.statusCode !== 200) {
        failForHttpStatus(response.statusCode, currentUrl);
      }

      const rawContentType = firstHeader(response.headers["content-type"]);
      if (rawContentType === null) {
        throw new SourceFetchError(
          "blocked",
          "content_type_missing",
          "The official source did not identify a supported content type.",
          200,
          currentUrl,
        );
      }
      const contentType = validateSourceContentType(rawContentType);
      if (!contentType.ok) {
        throw new SourceFetchError(
          "blocked",
          `content_type_${contentType.reason}`,
          "The official source returned a content type the monitor cannot safely process.",
          200,
          currentUrl,
        );
      }

      let prepared;
      if (contentType.kind === "pdf") {
        validatePdfSignature(response.body);
        prepared = prepareSourceContent(
          Uint8Array.from(response.body),
          contentType.contentType,
        );
      } else {
        prepared = prepareSourceContent(
          decodeSourceText(response.body, rawContentType),
          contentType.contentType,
        );
      }
      if (!prepared.ok) {
        throw new SourceFetchError(
          "failed",
          prepared.reason,
          "The official source response could not be prepared for change detection.",
          200,
          currentUrl,
        );
      }

      const rawHash = sha256Hex(response.body);
      const semanticHash = sha256Hex(
        `elsewhere-official-source:${SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION}\nfinal-url:${currentUrl}\ncontent-type:${prepared.contentType}\ncontent-sha256:${prepared.semanticHash}`,
      );

      return {
        ok: true,
        httpStatus: 200,
        finalUrl: currentUrl,
        contentType: prepared.contentType,
        contentLengthBytes: response.body.byteLength,
        etag: responseValidatorHeader(response.headers.etag, "ETag", "etag"),
        lastModified: responseValidatorHeader(
          response.headers["last-modified"],
          "Last-Modified",
          "last-modified",
        ),
        rawHash,
        semanticHash,
        normalizationAlgorithmVersion:
          SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
        validatorEtagSent: validatorEtagEverSent,
        validatorLastModifiedSent: validatorLastModifiedEverSent,
        notModified: false,
        finalUrlChanged:
          input.previousFinalUrl !== null && previousFinalUrl !== currentUrl,
      };
    }
  } catch (error) {
    return failureResult(
      error,
      currentUrl,
      validatorEtagEverSent,
      validatorLastModifiedEverSent,
    );
  }
}
