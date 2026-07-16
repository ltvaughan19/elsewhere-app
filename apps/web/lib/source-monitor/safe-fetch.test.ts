import {
  SOURCE_MONITOR_MAX_RESPONSE_BYTES,
  SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
  sha256Hex,
} from "@expat-atlas/source-engine";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface MockResponse {
  statusCode: number;
  headers?: Record<string, string | string[]>;
  body?: Buffer;
  chunks?: Buffer[];
  requestError?: Error;
  stall?: boolean;
}

interface CapturedRequest {
  url: string;
  options: Record<string, unknown>;
}

const transport = vi.hoisted(() => ({
  responses: [] as MockResponse[],
  requests: [] as CapturedRequest[],
  pinnedLookupResults: [] as unknown[][],
  pinnedSingleLookupResults: [] as unknown[][],
  dnsAnswers: [{ address: "93.184.216.34", family: 4 }] as Array<{
    address: string;
    family: number;
  }>,
}));

vi.mock("server-only", () => ({}));

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => transport.dnsAnswers),
}));

vi.mock("node:https", () => ({
  request: vi.fn(
    (
      url: string | URL,
      options: Record<string, unknown>,
      onResponse: (response: Readable) => void,
    ) => {
      transport.requests.push({ url: String(url), options });
      const request = new EventEmitter() as EventEmitter & {
        destroy: () => typeof request;
        end: () => typeof request;
      };
      request.destroy = () => request;
      request.end = () => {
        const pinnedLookup = options.lookup as (
          hostname: string,
          options: { all?: boolean },
          callback: (...args: unknown[]) => void,
        ) => void;
        pinnedLookup("ignored.example", { all: true }, (...args) => {
          transport.pinnedLookupResults.push(args);
        });
        pinnedLookup("ignored.example", { all: false }, (...args) => {
          transport.pinnedSingleLookupResults.push(args);
        });

        const next = transport.responses.shift();
        if (!next) throw new Error("Missing mocked HTTPS response.");
        if (next.stall) return request;
        if (next.requestError) {
          queueMicrotask(() => request.emit("error", next.requestError));
          return request;
        }
        const incoming = Readable.from(
          next.chunks ?? (next.body ? [next.body] : []),
        );
        Object.assign(incoming, {
          statusCode: next.statusCode,
          headers: next.headers ?? {},
        });
        queueMicrotask(() => onResponse(incoming));
        return request;
      };
      return request;
    },
  ),
}));

import {
  safeFetchOfficialSource,
  type SafeSourceFetch200Result,
  type SafeSourceFetchInput,
  type SafeSourceFetchResult,
} from "./safe-fetch";

const VALID_ETAG = 'W/"visa-rules-v2"';
const VALID_LAST_MODIFIED = "Tue, 01 Jul 2025 00:00:00 GMT";
const BASELINE_HASH = "a".repeat(64);

function input(
  overrides: Partial<SafeSourceFetchInput> = {},
): SafeSourceFetchInput {
  return {
    url: "https://immigration.gov.ph/rules",
    approvedHostnames: ["immigration.gov.ph", "dfa.gov.ph"],
    previousRawHash: null,
    previousSemanticHash: null,
    previousContentType: null,
    previousNormalizationAlgorithmVersion: null,
    previousFinalUrl: null,
    previousEtag: null,
    previousLastModified: null,
    ...overrides,
  };
}

function responseHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return { "content-type": "text/plain; charset=utf-8", ...extra };
}

function expectSuccessful200(
  result: SafeSourceFetchResult,
): asserts result is SafeSourceFetch200Result {
  expect(result).toMatchObject({
    ok: true,
    httpStatus: 200,
    notModified: false,
  });
  if (!result.ok || result.httpStatus !== 200) {
    throw new Error("Expected a successful HTTP 200 monitor result.");
  }
}

beforeEach(() => {
  transport.responses.length = 0;
  transport.requests.length = 0;
  transport.pinnedLookupResults.length = 0;
  transport.pinnedSingleLookupResults.length = 0;
  transport.dnsAnswers = [{ address: "93.184.216.34", family: 4 }];
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("safe official-source transport", () => {
  it("honors Node's all-address lookup callback without breaking the DNS pin", async () => {
    transport.responses.push({
      statusCode: 200,
      headers: responseHeaders(),
      body: Buffer.from("Official rule", "utf8"),
    });

    const result = await safeFetchOfficialSource(
      input({
        previousFinalUrl: "https://immigration.gov.ph/rules",
        previousRawHash: BASELINE_HASH,
        previousSemanticHash: BASELINE_HASH,
        previousContentType: "text/plain",
        previousNormalizationAlgorithmVersion:
          SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
        previousEtag: VALID_ETAG,
      }),
    );

    expectSuccessful200(result);
    expect(result.validatorEtagSent).toBe(true);
    expect(transport.requests[0]!.options.autoSelectFamily).toBe(false);
    expect(transport.pinnedLookupResults).toEqual([
      [null, [{ address: "93.184.216.34", family: 4 }]],
    ]);
    expect(transport.pinnedSingleLookupResults).toEqual([
      [null, "93.184.216.34", 4],
    ]);
  });

  it("rejects every request when DNS includes a non-public answer", async () => {
    transport.dnsAnswers = [
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ];

    const result = await safeFetchOfficialSource(
      input({
        previousFinalUrl: "https://immigration.gov.ph/rules",
        previousRawHash: BASELINE_HASH,
        previousSemanticHash: BASELINE_HASH,
        previousContentType: "text/plain",
        previousNormalizationAlgorithmVersion:
          SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
        previousEtag: VALID_ETAG,
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      code: "unsafe_dns_address",
      validatorEtagSent: false,
      validatorLastModifiedSent: false,
    });
    expect(transport.requests).toHaveLength(0);
  });

  it("retries each validated public address within the same deadline", async () => {
    transport.dnsAnswers = [
      { address: "93.184.216.34", family: 4 },
      { address: "93.184.216.35", family: 4 },
    ];
    transport.responses.push(
      {
        statusCode: 0,
        requestError: new Error("first address refused the connection"),
      },
      {
        statusCode: 200,
        headers: responseHeaders(),
        body: Buffer.from("Official rule", "utf8"),
      },
    );

    const result = await safeFetchOfficialSource(input());

    expectSuccessful200(result);
    expect(transport.requests).toHaveLength(2);
    expect(transport.pinnedLookupResults).toEqual([
      [null, [{ address: "93.184.216.34", family: 4 }]],
      [null, [{ address: "93.184.216.35", family: 4 }]],
    ]);
  });

  it("enforces one deadline across stalled transport attempts", async () => {
    vi.useFakeTimers();
    transport.responses.push({ statusCode: 0, stall: true });

    const pending = safeFetchOfficialSource(input());
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(12_000);
    const result = await pending;

    expect(result).toMatchObject({
      ok: false,
      status: "unavailable",
      code: "fetch_timeout",
      finalUrl: "https://immigration.gov.ph/rules",
    });
  });

  it("sends validators only to the exact prior final URL across redirects", async () => {
    transport.responses.push(
      {
        statusCode: 302,
        headers: { location: "https://dfa.gov.ph/final-rules" },
      },
      {
        statusCode: 200,
        headers: responseHeaders(),
        body: Buffer.from("Official rule", "utf8"),
      },
    );

    const result = await safeFetchOfficialSource(
      input({
        url: "https://immigration.gov.ph/start",
        previousFinalUrl: "https://dfa.gov.ph/final-rules",
        previousRawHash: BASELINE_HASH,
        previousSemanticHash: BASELINE_HASH,
        previousContentType: "text/plain",
        previousNormalizationAlgorithmVersion:
          SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
        previousEtag: VALID_ETAG,
        previousLastModified: VALID_LAST_MODIFIED,
      }),
    );

    expectSuccessful200(result);
    expect(result.validatorEtagSent).toBe(true);
    expect(result.validatorLastModifiedSent).toBe(true);
    const firstHeaders = transport.requests[0]!.options.headers as Record<
      string,
      string
    >;
    const finalHeaders = transport.requests[1]!.options.headers as Record<
      string,
      string
    >;
    expect(firstHeaders["if-none-match"]).toBeUndefined();
    expect(firstHeaders["if-modified-since"]).toBeUndefined();
    expect(finalHeaders["if-none-match"]).toBe(VALID_ETAG);
    expect(finalHeaders["if-modified-since"]).toBe(VALID_LAST_MODIFIED);
  });

  it("fails closed after the bounded redirect count", async () => {
    transport.responses.push(
      { statusCode: 302, headers: { location: "/rules-1" } },
      { statusCode: 302, headers: { location: "/rules-2" } },
      { statusCode: 302, headers: { location: "/rules-3" } },
      { statusCode: 302, headers: { location: "/rules-4" } },
    );

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      code: "redirect_limit_exceeded",
      httpStatus: 302,
      finalUrl: "https://immigration.gov.ph/rules-3",
    });
    expect(transport.requests).toHaveLength(4);
  });

  it("does not leak old validators after the prior URL redirects elsewhere", async () => {
    transport.responses.push(
      {
        statusCode: 302,
        headers: { location: "https://dfa.gov.ph/replacement" },
      },
      {
        statusCode: 200,
        headers: responseHeaders(),
        body: Buffer.from("Replacement", "utf8"),
      },
    );

    const result = await safeFetchOfficialSource(
      input({
        url: "https://immigration.gov.ph/old-final",
        previousFinalUrl: "https://immigration.gov.ph/old-final",
        previousRawHash: BASELINE_HASH,
        previousSemanticHash: BASELINE_HASH,
        previousContentType: "text/plain",
        previousNormalizationAlgorithmVersion:
          SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
        previousEtag: VALID_ETAG,
      }),
    );

    const oldHeaders = transport.requests[0]!.options.headers as Record<
      string,
      string
    >;
    const replacementHeaders = transport.requests[1]!.options.headers as Record<
      string,
      string
    >;
    expect(oldHeaders["if-none-match"]).toBe(VALID_ETAG);
    expect(replacementHeaders["if-none-match"]).toBeUndefined();
    expectSuccessful200(result);
    expect(result.validatorEtagSent).toBe(true);
    expect(result.validatorLastModifiedSent).toBe(false);
  });

  it("preserves sent-validator provenance when a later redirect hop fails", async () => {
    transport.responses.push(
      {
        statusCode: 302,
        headers: { location: "https://dfa.gov.ph/replacement" },
      },
      {
        statusCode: 200,
        headers: responseHeaders({ "content-encoding": "gzip" }),
        body: Buffer.from("compressed-looking response", "utf8"),
      },
    );

    const result = await safeFetchOfficialSource(
      input({
        url: "https://immigration.gov.ph/rules",
        previousFinalUrl: "https://immigration.gov.ph/rules",
        previousRawHash: BASELINE_HASH,
        previousSemanticHash: BASELINE_HASH,
        previousContentType: "text/plain",
        previousNormalizationAlgorithmVersion:
          SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
        previousEtag: VALID_ETAG,
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      code: "unsupported_content_encoding",
      finalUrl: "https://dfa.gov.ph/replacement",
      validatorEtagSent: true,
      validatorLastModifiedSent: false,
    });
  });

  it("rejects 304 unless a valid validator was sent to that exact URL", async () => {
    transport.responses.push({ statusCode: 304 });

    const result = await safeFetchOfficialSource(
      input({
        previousRawHash: BASELINE_HASH,
        previousSemanticHash: BASELINE_HASH,
        previousContentType: "text/html",
        previousNormalizationAlgorithmVersion:
          SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
        previousFinalUrl: "https://dfa.gov.ph/different-page",
        previousEtag: VALID_ETAG,
      }),
    );

    expect(result).toMatchObject({
      ok: false,
      code: "invalid_not_modified_response",
      httpStatus: 304,
      finalUrl: "https://immigration.gov.ph/rules",
      validatorEtagSent: false,
      validatorLastModifiedSent: false,
    });
  });

  it("accepts a complete, exact-URL 304 baseline and validated metadata", async () => {
    transport.responses.push({
      statusCode: 304,
      headers: { etag: VALID_ETAG, "last-modified": VALID_LAST_MODIFIED },
    });

    const result = await safeFetchOfficialSource(
      input({
        previousRawHash: BASELINE_HASH,
        previousSemanticHash: BASELINE_HASH,
        previousContentType: "text/html",
        previousNormalizationAlgorithmVersion:
          SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
        previousFinalUrl: "https://immigration.gov.ph/rules",
        previousEtag: VALID_ETAG,
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      httpStatus: 304,
      notModified: true,
      finalUrlChanged: false,
      validatorEtagSent: true,
      validatorLastModifiedSent: false,
    });
    expect(result.ok && "rawHash" in result).toBe(false);
    expect(result.ok && "contentLengthBytes" in result).toBe(false);
  });

  it("hashes received bytes exactly and scopes semantics to final-URL provenance", async () => {
    const body = Buffer.from("Same official rule", "utf8");
    transport.responses.push(
      { statusCode: 200, headers: responseHeaders(), body },
      { statusCode: 200, headers: responseHeaders(), body },
    );

    const first = await safeFetchOfficialSource(
      input({ url: "https://immigration.gov.ph/rules-v1" }),
    );
    const second = await safeFetchOfficialSource(
      input({
        url: "https://immigration.gov.ph/rules-v2",
        previousFinalUrl: "https://immigration.gov.ph/rules-v1",
      }),
    );

    expectSuccessful200(first);
    expectSuccessful200(second);
    expect(first.rawHash).toBe(sha256Hex(body));
    expect(second.rawHash).toBe(sha256Hex(body));
    expect(first.semanticHash).not.toBe(second.semanticHash);
    expect(second.finalUrlChanged).toBe(true);
    expect(second.normalizationAlgorithmVersion).toBe(
      SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
    );
  });

  it("uses an HTML meta charset and preserves the exact encoded-byte hash", async () => {
    const body = Buffer.concat([
      Buffer.from('<meta charset="windows-1252"><p>Fee: ', "ascii"),
      Buffer.from([0x80]),
      Buffer.from("100</p>", "ascii"),
    ]);
    transport.responses.push({
      statusCode: 200,
      headers: { "content-type": "text/html" },
      body,
    });

    const result = await safeFetchOfficialSource(input());

    expectSuccessful200(result);
    expect(result.rawHash).toBe(sha256Hex(body));
  });

  it("honors a Unicode byte-order mark when no charset header exists", async () => {
    const body = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from("Official guidance: ₱1,000", "utf16le"),
    ]);
    transport.responses.push({
      statusCode: 200,
      headers: { "content-type": "text/plain" },
      body,
    });

    const result = await safeFetchOfficialSource(input());

    expectSuccessful200(result);
    expect(result.rawHash).toBe(sha256Hex(body));
  });

  it("stops a streamed response when it exceeds the byte limit", async () => {
    transport.responses.push({
      statusCode: 200,
      headers: responseHeaders(),
      chunks: [
        Buffer.alloc(SOURCE_MONITOR_MAX_RESPONSE_BYTES, 0x41),
        Buffer.from([0x42]),
      ],
    });

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      code: "response_too_large",
      httpStatus: 200,
    });
  });

  it.each([
    ["zero declared length", { "content-length": "0" }],
    ["missing length with an empty stream", {}],
  ])("rejects an empty response with %s", async (_label, extraHeaders) => {
    transport.responses.push({
      statusCode: 200,
      headers: responseHeaders(extraHeaders),
      body: Buffer.alloc(0),
    });

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      code: "empty_response",
      httpStatus: 200,
      finalUrl: "https://immigration.gov.ph/rules",
    });
  });

  it("rejects a truncated response whose measured length disagrees", async () => {
    transport.responses.push({
      statusCode: 200,
      headers: responseHeaders({ "content-length": "20" }),
      body: Buffer.from("short", "utf8"),
    });

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "unavailable",
      code: "content_length_mismatch",
      httpStatus: 200,
    });
  });

  it("rejects malformed declared response lengths", async () => {
    transport.responses.push({
      statusCode: 200,
      headers: responseHeaders({ "content-length": "+10" }),
      body: Buffer.from("Official", "utf8"),
    });

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      code: "malformed_content_length",
      httpStatus: 200,
    });
  });

  it("rejects unsupported content types before interpretation", async () => {
    transport.responses.push({
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: Buffer.from('{"fee":1000}', "utf8"),
    });

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      code: "content_type_unsupported",
      httpStatus: 200,
    });
  });

  it("rejects a mislabeled PDF before hashing it as evidence", async () => {
    transport.responses.push({
      statusCode: 200,
      headers: { "content-type": "application/pdf" },
      body: Buffer.from("not a PDF", "utf8"),
    });

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      code: "invalid_pdf_signature",
      httpStatus: null,
      finalUrl: "https://immigration.gov.ph/rules",
    });
  });

  it("fails lossless decoding and retains the final URL for audit", async () => {
    transport.responses.push({
      statusCode: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: Buffer.from([0xff]),
    });

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      code: "text_decode_failed",
      finalUrl: "https://immigration.gov.ph/rules",
    });
  });

  it("rejects malformed response validators instead of persisting them", async () => {
    transport.responses.push({
      statusCode: 200,
      headers: responseHeaders({ etag: "not-an-entity-tag" }),
      body: Buffer.from("Official rule", "utf8"),
    });

    const result = await safeFetchOfficialSource(input());

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      code: "malformed_response_header",
      finalUrl: "https://immigration.gov.ph/rules",
      validatorEtagSent: false,
      validatorLastModifiedSent: false,
    });
  });
});
