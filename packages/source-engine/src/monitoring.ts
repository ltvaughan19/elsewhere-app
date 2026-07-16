import { parse } from "parse5";

export const SOURCE_MONITOR_FETCH_TIMEOUT_MS = 12_000;
export const SOURCE_MONITOR_MAX_REDIRECTS = 3;
export const SOURCE_MONITOR_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
export const SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION = "ordered-dom-v3";

export const SOURCE_MONITOR_ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
  "text/plain",
  "application/pdf",
] as const;

export type SupportedSourceContentType =
  (typeof SOURCE_MONITOR_ALLOWED_CONTENT_TYPES)[number];
export type TextSourceContentType = Exclude<
  SupportedSourceContentType,
  "application/pdf"
>;

export type LiteralIpClassification =
  | "public"
  | "private"
  | "loopback"
  | "link_local"
  | "metadata"
  | "reserved";

export type OfficialSourceUrlFailureReason =
  | "invalid_url"
  | "ambiguous_input"
  | "https_required"
  | "credentials_not_allowed"
  | "non_default_port"
  | "invalid_hostname"
  | "local_hostname"
  | "unsafe_ip_address"
  | "invalid_approved_hostname"
  | "hostname_not_approved";

export type OfficialSourceUrlValidation =
  | {
      ok: true;
      normalizedUrl: string;
      hostname: string;
      isLiteralIp: boolean;
      /** DNS must still be resolved and checked immediately before each request. */
      requiresDnsSafetyCheck: boolean;
    }
  | {
      ok: false;
      reason: OfficialSourceUrlFailureReason;
      message: string;
    };

export type SourceContentTypeValidation =
  | {
      ok: true;
      contentType: SupportedSourceContentType;
      kind: "html" | "plain_text" | "pdf";
    }
  | {
      ok: false;
      reason: "missing" | "malformed" | "unsupported";
    };

export type DeclaredContentLengthValidation =
  | { ok: true; byteLength: number | null }
  | { ok: false; reason: "empty" | "malformed" | "too_large" };

export type SourcePreparationFailureReason =
  | "unsupported_content_type"
  | "body_type_mismatch"
  | "empty_body";

export type PreparedSourceContent =
  | {
      ok: true;
      contentType: TextSourceContentType;
      kind: "html" | "plain_text";
      normalization: "semantic_text";
      normalizedBody: string;
      rawHash: string;
      semanticHash: string;
    }
  | {
      ok: true;
      contentType: "application/pdf";
      kind: "pdf";
      normalization: "binary";
      normalizedBody: Uint8Array;
      rawHash: string;
      semanticHash: string;
    }
  | {
      ok: false;
      reason: SourcePreparationFailureReason;
    };

export type SourceContentChangeResult =
  | {
      ok: true;
      classification: "unchanged" | "non_semantic" | "semantic";
      previousRawHash: string;
      currentRawHash: string;
      previousSemanticHash: string;
      currentSemanticHash: string;
    }
  | {
      ok: false;
      reason: SourcePreparationFailureReason;
    };

const AMBIGUOUS_URL_CHARACTERS = /[\u0000-\u001f\u007f\\]/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const BLOCKED_HOSTNAME_SUFFIXES = [
  "localhost",
  "local",
  "localdomain",
  "internal",
  "home.arpa",
  "test",
  "invalid",
  "example",
  "onion",
] as const;

const IPV4_METADATA_ADDRESSES = new Set([
  ipv4ToNumber("100.100.100.200"),
  ipv4ToNumber("169.254.169.254"),
  ipv4ToNumber("169.254.170.2"),
  ipv4ToNumber("192.0.0.192"),
]);

const IPV4_NON_PUBLIC_RANGES: ReadonlyArray<{
  base: number;
  prefix: number;
  classification: Exclude<LiteralIpClassification, "public" | "metadata">;
}> = [
  { base: ipv4ToNumber("127.0.0.0"), prefix: 8, classification: "loopback" },
  { base: ipv4ToNumber("10.0.0.0"), prefix: 8, classification: "private" },
  { base: ipv4ToNumber("172.16.0.0"), prefix: 12, classification: "private" },
  { base: ipv4ToNumber("192.168.0.0"), prefix: 16, classification: "private" },
  {
    base: ipv4ToNumber("169.254.0.0"),
    prefix: 16,
    classification: "link_local",
  },
  { base: ipv4ToNumber("0.0.0.0"), prefix: 8, classification: "reserved" },
  { base: ipv4ToNumber("100.64.0.0"), prefix: 10, classification: "reserved" },
  { base: ipv4ToNumber("192.0.0.0"), prefix: 24, classification: "reserved" },
  { base: ipv4ToNumber("192.0.2.0"), prefix: 24, classification: "reserved" },
  { base: ipv4ToNumber("192.88.99.0"), prefix: 24, classification: "reserved" },
  { base: ipv4ToNumber("198.18.0.0"), prefix: 15, classification: "reserved" },
  {
    base: ipv4ToNumber("198.51.100.0"),
    prefix: 24,
    classification: "reserved",
  },
  { base: ipv4ToNumber("203.0.113.0"), prefix: 24, classification: "reserved" },
  { base: ipv4ToNumber("224.0.0.0"), prefix: 4, classification: "reserved" },
  { base: ipv4ToNumber("240.0.0.0"), prefix: 4, classification: "reserved" },
];

const IPV6_METADATA_ADDRESSES = new Set([
  requiredIpv6("fd00:ec2::254"),
  requiredIpv6("fd00:db8:deca:deed::1"),
  requiredIpv6("fe80::a9fe:a9fe"),
]);

const IPV6_RESERVED_RANGES: ReadonlyArray<{ base: bigint; prefix: number }> = [
  { base: requiredIpv6("64:ff9b::"), prefix: 96 },
  { base: requiredIpv6("64:ff9b:1::"), prefix: 48 },
  { base: requiredIpv6("100::"), prefix: 64 },
  { base: requiredIpv6("2001::"), prefix: 23 },
  { base: requiredIpv6("2001:db8::"), prefix: 32 },
  { base: requiredIpv6("2002::"), prefix: 16 },
  { base: requiredIpv6("3fff::"), prefix: 20 },
  { base: requiredIpv6("5f00::"), prefix: 16 },
  { base: requiredIpv6("fec0::"), prefix: 10 },
  { base: requiredIpv6("ff00::"), prefix: 8 },
];

function failure(
  reason: OfficialSourceUrlFailureReason,
  message: string,
): OfficialSourceUrlValidation {
  return { ok: false, reason, message };
}

function ipv4ToNumber(address: string): number {
  const octets = address.split(".").map(Number);
  return (
    octets[0]! * 2 ** 24 +
    octets[1]! * 2 ** 16 +
    octets[2]! * 2 ** 8 +
    octets[3]!
  );
}

function parseIpv4(address: string): number | null {
  if (!/^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(address)) {
    return null;
  }
  const octets = address.split(".").map(Number);
  if (octets.some((octet) => octet > 255)) return null;
  return ipv4ToNumber(address);
}

function isInIpv4Range(address: number, base: number, prefix: number): boolean {
  const divisor = 2 ** (32 - prefix);
  return Math.floor(address / divisor) === Math.floor(base / divisor);
}

function parseIpv6Side(side: string): number[] | null {
  if (!side) return [];
  const pieces = side.split(":");
  const words: number[] = [];

  for (const [index, piece] of pieces.entries()) {
    if (!piece) return null;
    if (piece.includes(".")) {
      if (index !== pieces.length - 1) return null;
      const ipv4 = parseIpv4(piece);
      if (ipv4 === null) return null;
      words.push(Math.floor(ipv4 / 2 ** 16), ipv4 % 2 ** 16);
      continue;
    }
    if (!/^[\da-f]{1,4}$/i.test(piece)) return null;
    words.push(Number.parseInt(piece, 16));
  }
  return words;
}

function parseIpv6(address: string): bigint | null {
  const unwrapped =
    address.startsWith("[") && address.endsWith("]")
      ? address.slice(1, -1)
      : address;
  if (!unwrapped.includes(":")) return null;
  if (unwrapped.includes("%")) return null;

  const compressedParts = unwrapped.split("::");
  if (compressedParts.length > 2) return null;

  const left = parseIpv6Side(compressedParts[0] ?? "");
  const right = parseIpv6Side(compressedParts[1] ?? "");
  if (!left || !right) return null;

  let words: number[];
  if (compressedParts.length === 1) {
    if (left.length !== 8) return null;
    words = left;
  } else {
    const zeroCount = 8 - left.length - right.length;
    if (zeroCount < 1) return null;
    words = [...left, ...Array<number>(zeroCount).fill(0), ...right];
  }

  if (words.length !== 8) return null;
  return words.reduce((value, word) => (value << 16n) | BigInt(word), 0n);
}

function requiredIpv6(address: string): bigint {
  const parsed = parseIpv6(address);
  if (parsed === null)
    throw new Error(`Invalid internal IPv6 constant: ${address}`);
  return parsed;
}

function isInIpv6Range(address: bigint, base: bigint, prefix: number): boolean {
  const shift = BigInt(128 - prefix);
  return address >> shift === base >> shift;
}

function classifyIpv4Number(address: number): LiteralIpClassification {
  if (IPV4_METADATA_ADDRESSES.has(address)) return "metadata";
  for (const range of IPV4_NON_PUBLIC_RANGES) {
    if (isInIpv4Range(address, range.base, range.prefix)) {
      return range.classification;
    }
  }
  return "public";
}

/** Returns null when the value is a hostname rather than an IP literal. */
export function classifyLiteralIpAddress(
  value: string,
): LiteralIpClassification | null {
  const unwrapped =
    value.startsWith("[") && value.endsWith("]") ? value.slice(1, -1) : value;
  const ipv4 = parseIpv4(unwrapped);
  if (ipv4 !== null) return classifyIpv4Number(ipv4);

  const ipv6 = parseIpv6(unwrapped);
  if (ipv6 === null) return null;
  if (IPV6_METADATA_ADDRESSES.has(ipv6)) return "metadata";
  if (ipv6 === 1n) return "loopback";

  // IPv4-mapped IPv6 is a special-purpose prefix, not a public literal source
  // address. Reject the entire range even when the embedded IPv4 is routable.
  if (ipv6 >> 32n === 0xffffn) {
    return "reserved";
  }
  if (isInIpv6Range(ipv6, requiredIpv6("fc00::"), 7)) return "private";
  if (isInIpv6Range(ipv6, requiredIpv6("fe80::"), 10)) return "link_local";
  if (ipv6 === 0n) return "reserved";
  if (
    IPV6_RESERVED_RANGES.some((range) =>
      isInIpv6Range(ipv6, range.base, range.prefix),
    )
  ) {
    return "reserved";
  }

  // Globally routable IPv6 unicast space currently lives inside 2000::/3.
  return isInIpv6Range(ipv6, requiredIpv6("2000::"), 3) ? "public" : "reserved";
}

function normalizeParsedHostname(hostname: string): string {
  const unwrapped =
    hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;
  return unwrapped.toLowerCase().replace(/\.$/, "");
}

function isValidDnsHostname(hostname: string): boolean {
  if (hostname.length < 1 || hostname.length > 253 || !hostname.includes(".")) {
    return false;
  }
  return hostname.split(".").every((label) => DNS_LABEL.test(label));
}

function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAME_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

/**
 * Canonicalizes one exact hostname entry. Wildcards, URLs, ports and paths fail
 * closed so an allowlist cannot silently become broader than its operator meant.
 */
export function normalizeApprovedHostname(value: string): string | null {
  if (
    value !== value.trim() ||
    !value ||
    AMBIGUOUS_URL_CHARACTERS.test(value) ||
    /[*\/@?#]/.test(value)
  ) {
    return null;
  }

  let parsed: URL;
  try {
    if (value.startsWith("[") && value.endsWith("]")) {
      parsed = new URL(`https://${value}/`);
    } else if (value.includes(":")) {
      parsed = new URL(`https://[${value}]/`);
    } else {
      parsed = new URL(`https://${value}/`);
    }
  } catch {
    return null;
  }

  const hostname = normalizeParsedHostname(parsed.hostname);
  const ipClassification = classifyLiteralIpAddress(hostname);
  if (ipClassification) return hostname;
  return isValidDnsHostname(hostname) ? hostname : null;
}

/**
 * Validates only URL syntax and literal-address safety. A fetching caller must
 * also resolve DNS and reject non-public answers immediately before every
 * request, then call this function again for every redirect target.
 */
export function validateOfficialSourceUrl(
  value: string,
  approvedHostnames: Iterable<string>,
): OfficialSourceUrlValidation {
  if (
    value !== value.trim() ||
    !value ||
    AMBIGUOUS_URL_CHARACTERS.test(value)
  ) {
    return failure(
      "ambiguous_input",
      "Source URL contains whitespace, control characters, or backslashes.",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return failure("invalid_url", "Source URL is not a valid absolute URL.");
  }

  if (url.protocol !== "https:") {
    return failure("https_required", "Source URL must use HTTPS.");
  }
  if (!/^https:\/\/[^/?#]+(?:[/?#]|$)/i.test(value)) {
    return failure(
      "invalid_url",
      "Source URL must use a canonical HTTPS authority.",
    );
  }
  const authorityStart = value.indexOf("://") + 3;
  const authorityEndMatch = value.slice(authorityStart).search(/[/?#]/);
  const authorityEnd =
    authorityEndMatch === -1
      ? value.length
      : authorityStart + authorityEndMatch;
  const rawAuthority = value.slice(authorityStart, authorityEnd);
  if (rawAuthority.includes("@") || url.username || url.password) {
    return failure(
      "credentials_not_allowed",
      "Source URL cannot contain embedded credentials.",
    );
  }
  if (url.port && url.port !== "443") {
    return failure(
      "non_default_port",
      "Source URL cannot use a non-default port.",
    );
  }

  const hostname = normalizeParsedHostname(url.hostname);
  const ipClassification = classifyLiteralIpAddress(hostname);
  if (!ipClassification && !isValidDnsHostname(hostname)) {
    return failure("invalid_hostname", "Source URL hostname is not valid.");
  }
  if (!ipClassification && isBlockedHostname(hostname)) {
    return failure(
      "local_hostname",
      "Source URL cannot target a local hostname.",
    );
  }
  if (ipClassification && ipClassification !== "public") {
    return failure(
      "unsafe_ip_address",
      `Source URL targets a ${ipClassification.replace("_", " ")} IP address.`,
    );
  }

  const approved = new Set<string>();
  for (const entry of approvedHostnames) {
    const normalized = normalizeApprovedHostname(entry);
    if (!normalized) {
      return failure(
        "invalid_approved_hostname",
        "Approved hostname entries must be exact hostnames without wildcards, ports, or paths.",
      );
    }
    approved.add(normalized);
  }
  if (!approved.has(hostname)) {
    return failure(
      "hostname_not_approved",
      "Source URL hostname is not explicitly approved.",
    );
  }

  url.hash = "";
  url.hostname = hostname.includes(":") ? `[${hostname}]` : hostname;
  return {
    ok: true,
    normalizedUrl: url.toString(),
    hostname,
    isLiteralIp: Boolean(ipClassification),
    requiresDnsSafetyCheck: !ipClassification,
  };
}

/** Resolves a relative redirect and re-runs the complete URL policy. */
export function validateOfficialSourceRedirect(
  location: string,
  currentUrl: string,
  approvedHostnames: Iterable<string>,
): OfficialSourceUrlValidation {
  if (
    location !== location.trim() ||
    !location ||
    AMBIGUOUS_URL_CHARACTERS.test(location)
  ) {
    return failure("ambiguous_input", "Redirect location is ambiguous.");
  }

  let resolved: string;
  try {
    resolved = new URL(location, currentUrl).toString();
  } catch {
    return failure("invalid_url", "Redirect location is not a valid URL.");
  }
  return validateOfficialSourceUrl(resolved, approvedHostnames);
}

export function canFollowSourceRedirect(completedRedirects: number): boolean {
  return (
    Number.isInteger(completedRedirects) &&
    completedRedirects >= 0 &&
    completedRedirects < SOURCE_MONITOR_MAX_REDIRECTS
  );
}

export function validateSourceContentType(
  headerValue: string | null | undefined,
): SourceContentTypeValidation {
  if (
    headerValue === null ||
    headerValue === undefined ||
    !headerValue.trim()
  ) {
    return { ok: false, reason: "missing" };
  }
  if (CONTROL_CHARACTERS.test(headerValue) || headerValue.includes(",")) {
    return { ok: false, reason: "malformed" };
  }

  const contentType = headerValue.split(";", 1)[0]!.trim().toLowerCase();
  if (
    !SOURCE_MONITOR_ALLOWED_CONTENT_TYPES.includes(
      contentType as SupportedSourceContentType,
    )
  ) {
    return { ok: false, reason: "unsupported" };
  }

  const typedContentType = contentType as SupportedSourceContentType;
  return {
    ok: true,
    contentType: typedContentType,
    kind:
      typedContentType === "application/pdf"
        ? "pdf"
        : typedContentType === "text/plain"
          ? "plain_text"
          : "html",
  };
}

/**
 * Header validation is only an early rejection. The caller must independently
 * stop its response stream once SOURCE_MONITOR_MAX_RESPONSE_BYTES is reached.
 */
export function validateDeclaredContentLength(
  headerValue: string | null | undefined,
): DeclaredContentLengthValidation {
  if (
    headerValue === null ||
    headerValue === undefined ||
    !headerValue.trim()
  ) {
    return { ok: true, byteLength: null };
  }
  if (!/^(?:0|[1-9]\d*)$/.test(headerValue)) {
    return { ok: false, reason: "malformed" };
  }
  const byteLength = Number(headerValue);
  if (!Number.isSafeInteger(byteLength)) {
    return { ok: false, reason: "malformed" };
  }
  if (byteLength === 0) {
    return { ok: false, reason: "empty" };
  }
  if (byteLength > SOURCE_MONITOR_MAX_RESPONSE_BYTES) {
    return { ok: false, reason: "too_large" };
  }
  return { ok: true, byteLength };
}

function normalizeCanonicalText(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

interface ParsedHtmlAttribute {
  name: string;
  value: string;
  namespace?: string;
  prefix?: string;
}

interface ParsedHtmlNode {
  nodeName: string;
  tagName?: string;
  value?: string;
  data?: string;
  name?: string;
  publicId?: string;
  systemId?: string;
  namespaceURI?: string;
  attrs?: ParsedHtmlAttribute[];
  childNodes?: ParsedHtmlNode[];
  content?: ParsedHtmlNode;
}

function canonicalAttributes(node: ParsedHtmlNode): string[][] {
  return (node.attrs ?? [])
    .map((attribute) => [
      attribute.namespace ?? "",
      attribute.prefix ?? "",
      attribute.name.toLowerCase(),
      normalizeCanonicalText(attribute.value),
    ])
    .sort((left, right) => {
      for (let index = 0; index < left.length; index += 1) {
        if (left[index]! < right[index]!) return -1;
        if (left[index]! > right[index]!) return 1;
      }
      return 0;
    });
}

/**
 * Produces a deterministic, ordered representation of the complete browser DOM.
 * Nothing that may affect rendered meaning is deliberately discarded: element
 * ownership, all attributes, comments, script/style raw text, template content,
 * canvas fallbacks and SVG geometry are retained. Only parser-equivalent syntax
 * such as attribute order, quote style and character-reference spelling can
 * collapse to the same representation.
 */
export function normalizeSemanticSourceText(
  body: string,
  contentType: TextSourceContentType,
): string {
  if (contentType === "text/plain" || contentType === "application/xhtml+xml") {
    // XHTML is XML, not error-tolerant HTML. Retaining its complete source is
    // safer than allowing an HTML parser to collapse case or self-closing forms
    // that an XML user agent treats differently.
    return normalizeCanonicalText(body);
  }

  const document = parse(body) as unknown as ParsedHtmlNode;
  const tokens: string[] = [];
  type TraversalFrame =
    | { kind: "enter"; node: ParsedHtmlNode }
    | { kind: "exit"; identity: string };
  const stack: TraversalFrame[] = [{ kind: "enter", node: document }];

  while (stack.length > 0) {
    const frame = stack.pop()!;
    if (frame.kind === "exit") {
      tokens.push(JSON.stringify(["close", frame.identity]));
      continue;
    }

    const node = frame.node;
    if (node.nodeName === "#text") {
      tokens.push(
        JSON.stringify(["text", normalizeCanonicalText(node.value ?? "")]),
      );
      continue;
    }
    if (node.nodeName === "#comment") {
      tokens.push(
        JSON.stringify(["comment", normalizeCanonicalText(node.data ?? "")]),
      );
      continue;
    }
    if (node.nodeName === "#documentType") {
      tokens.push(
        JSON.stringify([
          "doctype",
          node.name ?? "",
          node.publicId ?? "",
          node.systemId ?? "",
        ]),
      );
      continue;
    }

    const tagName = node.tagName?.toLowerCase();
    const identity = tagName
      ? `element:${node.namespaceURI ?? ""}:${tagName}`
      : `node:${node.nodeName}`;
    tokens.push(
      JSON.stringify([
        "open",
        identity,
        tagName ? canonicalAttributes(node) : [],
      ]),
    );
    stack.push({ kind: "exit", identity });

    const children = [...(node.childNodes ?? [])];
    if (node.content) children.push(node.content);
    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push({ kind: "enter", node: children[index]! });
    }
  }

  return tokens.join("\n");
}

function utf8Bytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const character of value) {
    const rawCodePoint = character.codePointAt(0)!;
    const codePoint =
      rawCodePoint >= 0xd800 && rawCodePoint <= 0xdfff ? 0xfffd : rawCodePoint;
    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return Uint8Array.from(bytes);
}

const SHA_256_CONSTANTS = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

/** A dependency-free SHA-256 helper so this pure package remains portable. */
export function sha256Hex(value: string | Uint8Array): string {
  const input = typeof value === "string" ? utf8Bytes(value) : value;
  const bitLength = BigInt(input.length) * 8n;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  for (let index = 0; index < 8; index += 1) {
    padded[padded.length - 1 - index] = Number(
      (bitLength >> BigInt(index * 8)) & 0xffn,
    );
  }

  const hash = Uint32Array.from([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const wordOffset = offset + index * 4;
      words[index] =
        (padded[wordOffset]! << 24) |
        (padded[wordOffset + 1]! << 16) |
        (padded[wordOffset + 2]! << 8) |
        padded[wordOffset + 3]!;
    }
    for (let index = 16; index < 64; index += 1) {
      const first = words[index - 15]!;
      const second = words[index - 2]!;
      const sigma0 =
        rotateRight(first, 7) ^ rotateRight(first, 18) ^ (first >>> 3);
      const sigma1 =
        rotateRight(second, 17) ^ rotateRight(second, 19) ^ (second >>> 10);
      words[index] =
        (words[index - 16]! + sigma0 + words[index - 7]! + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sum1 =
        rotateRight(e!, 6) ^ rotateRight(e!, 11) ^ rotateRight(e!, 25);
      const choice = (e! & f!) ^ (~e! & g!);
      const temporary1 =
        (h! + sum1 + choice + SHA_256_CONSTANTS[index]! + words[index]!) >>> 0;
      const sum0 =
        rotateRight(a!, 2) ^ rotateRight(a!, 13) ^ rotateRight(a!, 22);
      const majority = (a! & b!) ^ (a! & c!) ^ (b! & c!);
      const temporary2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d! + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }

    hash[0] = (hash[0]! + a!) >>> 0;
    hash[1] = (hash[1]! + b!) >>> 0;
    hash[2] = (hash[2]! + c!) >>> 0;
    hash[3] = (hash[3]! + d!) >>> 0;
    hash[4] = (hash[4]! + e!) >>> 0;
    hash[5] = (hash[5]! + f!) >>> 0;
    hash[6] = (hash[6]! + g!) >>> 0;
    hash[7] = (hash[7]! + h!) >>> 0;
  }

  return [...hash].map((word) => word.toString(16).padStart(8, "0")).join("");
}

export function prepareSourceContent(
  body: string | Uint8Array,
  contentTypeHeader: string,
): PreparedSourceContent {
  const contentType = validateSourceContentType(contentTypeHeader);
  if (!contentType.ok) return { ok: false, reason: "unsupported_content_type" };

  if (contentType.kind === "pdf") {
    if (!(body instanceof Uint8Array)) {
      return { ok: false, reason: "body_type_mismatch" };
    }
    if (body.byteLength === 0) {
      return { ok: false, reason: "empty_body" };
    }
    const immutableCopy = body.slice();
    const hash = sha256Hex(immutableCopy);
    return {
      ok: true,
      contentType: "application/pdf",
      kind: "pdf",
      normalization: "binary",
      normalizedBody: immutableCopy,
      rawHash: hash,
      semanticHash: hash,
    };
  }

  if (typeof body !== "string") {
    return { ok: false, reason: "body_type_mismatch" };
  }
  if (body.length === 0) {
    return { ok: false, reason: "empty_body" };
  }
  const normalizedBody = normalizeSemanticSourceText(
    body,
    contentType.contentType as TextSourceContentType,
  );
  return {
    ok: true,
    contentType: contentType.contentType as TextSourceContentType,
    kind: contentType.kind,
    normalization: "semantic_text",
    normalizedBody,
    rawHash: sha256Hex(body),
    semanticHash: sha256Hex(normalizedBody),
  };
}

export function classifySourceContentChange(
  previousBody: string | Uint8Array,
  currentBody: string | Uint8Array,
  previousContentTypeHeader: string,
  currentContentTypeHeader: string = previousContentTypeHeader,
): SourceContentChangeResult {
  const previous = prepareSourceContent(
    previousBody,
    previousContentTypeHeader,
  );
  if (!previous.ok) return previous;
  const current = prepareSourceContent(currentBody, currentContentTypeHeader);
  if (!current.ok) return current;

  const classification =
    previous.contentType !== current.contentType
      ? "semantic"
      : previous.rawHash === current.rawHash
        ? "unchanged"
        : previous.semanticHash === current.semanticHash
          ? "non_semantic"
          : "semantic";
  return {
    ok: true,
    classification,
    previousRawHash: previous.rawHash,
    currentRawHash: current.rawHash,
    previousSemanticHash: previous.semanticHash,
    currentSemanticHash: current.semanticHash,
  };
}
