import { describe, expect, it } from "vitest";
import {
  SOURCE_MONITOR_ALLOWED_CONTENT_TYPES,
  SOURCE_MONITOR_FETCH_TIMEOUT_MS,
  SOURCE_MONITOR_MAX_REDIRECTS,
  SOURCE_MONITOR_MAX_RESPONSE_BYTES,
  SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION,
  canFollowSourceRedirect,
  classifyLiteralIpAddress,
  classifySourceContentChange,
  normalizeApprovedHostname,
  normalizeSemanticSourceText,
  prepareSourceContent,
  sha256Hex,
  validateDeclaredContentLength,
  validateOfficialSourceRedirect,
  validateOfficialSourceUrl,
  validateSourceContentType,
} from "./monitoring";

const GOVERNMENT_HOST = "immigration.gov.ph";

describe("source monitor limits", () => {
  it("uses bounded production defaults", () => {
    expect(SOURCE_MONITOR_FETCH_TIMEOUT_MS).toBe(12_000);
    expect(SOURCE_MONITOR_MAX_REDIRECTS).toBe(3);
    expect(SOURCE_MONITOR_MAX_RESPONSE_BYTES).toBe(5 * 1024 * 1024);
    expect(SOURCE_MONITOR_NORMALIZATION_ALGORITHM_VERSION).toBe(
      "ordered-dom-v3",
    );
    expect(SOURCE_MONITOR_ALLOWED_CONTENT_TYPES).toEqual([
      "text/html",
      "application/xhtml+xml",
      "text/plain",
      "application/pdf",
    ]);
  });

  it("counts only a bounded, non-negative number of completed redirects", () => {
    expect(canFollowSourceRedirect(0)).toBe(true);
    expect(canFollowSourceRedirect(2)).toBe(true);
    expect(canFollowSourceRedirect(3)).toBe(false);
    expect(canFollowSourceRedirect(-1)).toBe(false);
    expect(canFollowSourceRedirect(1.5)).toBe(false);
  });
});

describe("official source URL validation", () => {
  it("accepts and canonicalizes an exact approved HTTPS hostname", () => {
    const result = validateOfficialSourceUrl(
      "https://IMMIGRATION.GOV.PH:443/visas?q=long#fees",
      [GOVERNMENT_HOST],
    );
    expect(result).toEqual({
      ok: true,
      normalizedUrl: "https://immigration.gov.ph/visas?q=long",
      hostname: GOVERNMENT_HOST,
      isLiteralIp: false,
      requiresDnsSafetyCheck: true,
    });
  });

  it.each([
    ["http://immigration.gov.ph", "https_required"],
    ["ftp://immigration.gov.ph/file", "https_required"],
    ["https://user@immigration.gov.ph", "credentials_not_allowed"],
    ["https://user:secret@immigration.gov.ph", "credentials_not_allowed"],
    ["https://immigration.gov.ph:8443", "non_default_port"],
    [" https://immigration.gov.ph", "ambiguous_input"],
    ["https://immigration.gov.ph\n/path", "ambiguous_input"],
    ["https:\\immigration.gov.ph", "ambiguous_input"],
    ["not a URL", "invalid_url"],
  ])("rejects unsafe URL form %s", (url, reason) => {
    const result = validateOfficialSourceUrl(url, [GOVERNMENT_HOST]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe(reason);
  });

  it.each([
    "evilimmigration.gov.ph",
    "immigration.gov.ph.attacker.example.net",
    "www.immigration.gov.ph",
    "attacker.example.net",
  ])(
    "requires exact approval and rejects suffix-confusable host %s",
    (host) => {
      const result = validateOfficialSourceUrl(`https://${host}/`, [
        GOVERNMENT_HOST,
      ]);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("hostname_not_approved");
    },
  );

  it.each([
    "localhost",
    "api.localhost",
    "printer.local",
    "metadata.google.internal",
    "service.home.arpa",
    "private.test",
  ])("rejects local or reserved hostname %s even when approved", (host) => {
    const result = validateOfficialSourceUrl(`https://${host}/`, [host]);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(["invalid_hostname", "local_hostname"]).toContain(result.reason);
  });

  it.each([
    ["https://127.0.0.1", "loopback"],
    ["https://127.1", "loopback"],
    ["https://2130706433", "loopback"],
    ["https://0x7f000001", "loopback"],
    ["https://10.12.0.1", "private"],
    ["https://172.16.0.1", "private"],
    ["https://172.31.255.255", "private"],
    ["https://192.168.1.1", "private"],
    ["https://169.254.10.2", "link_local"],
    ["https://169.254.169.254", "metadata"],
    ["https://100.100.100.200", "metadata"],
    ["https://0.0.0.0", "reserved"],
    ["https://100.64.0.1", "reserved"],
    ["https://192.0.2.1", "reserved"],
    ["https://198.18.0.1", "reserved"],
    ["https://198.51.100.1", "reserved"],
    ["https://203.0.113.1", "reserved"],
    ["https://224.0.0.1", "reserved"],
    ["https://255.255.255.255", "reserved"],
    ["https://[::1]", "loopback"],
    ["https://[::]", "reserved"],
    ["https://[fc00::1]", "private"],
    ["https://[fd00:ec2::254]", "metadata"],
    ["https://[fe80::1]", "link_local"],
    ["https://[ff02::1]", "reserved"],
    ["https://[64:ff9b::1]", "reserved"],
    ["https://[2001:db8::1]", "reserved"],
    ["https://[::ffff:127.0.0.1]", "reserved"],
    ["https://[::ffff:192.168.1.1]", "reserved"],
    ["https://[::ffff:8.8.8.8]", "reserved"],
  ])("rejects non-public literal %s as %s", (url, classification) => {
    const hostname = new URL(url).hostname;
    expect(classifyLiteralIpAddress(hostname)).toBe(classification);
    const result = validateOfficialSourceUrl(url, [hostname]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unsafe_ip_address");
  });

  it.each([
    ["https://8.8.8.8/dns", "8.8.8.8"],
    ["https://[2606:4700:4700::1111]/dns", "[2606:4700:4700::1111]"],
  ])(
    "allows a public IP literal only when exactly approved",
    (url, approved) => {
      const result = validateOfficialSourceUrl(url, [approved]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.isLiteralIp).toBe(true);
        expect(result.requiresDnsSafetyCheck).toBe(false);
        expect(result.normalizedUrl).toBe(url);
      }
    },
  );

  it.each([
    "*.gov.ph",
    ".gov.ph",
    "https://gov.ph",
    "gov.ph/path",
    "gov.ph:443",
    "gov_ph",
  ])("fails closed on malformed approved hostname %s", (approved) => {
    expect(normalizeApprovedHostname(approved)).toBeNull();
    const result = validateOfficialSourceUrl("https://immigration.gov.ph", [
      GOVERNMENT_HOST,
      approved,
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_approved_hostname");
  });

  it.each(["https://@immigration.gov.ph", "https://:@immigration.gov.ph"])(
    "rejects even empty userinfo in %s",
    (url) => {
      const result = validateOfficialSourceUrl(url, [GOVERNMENT_HOST]);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("credentials_not_allowed");
    },
  );

  it.each(["https:////@immigration.gov.ph", "https:///@immigration.gov.ph"])(
    "rejects parser-recovered empty userinfo in %s",
    (url) => {
      expect(validateOfficialSourceUrl(url, [GOVERNMENT_HOST]).ok).toBe(false);
    },
  );
});

describe("redirect validation", () => {
  it("resolves a relative redirect and revalidates it", () => {
    const result = validateOfficialSourceRedirect(
      "/new-rules#details",
      "https://immigration.gov.ph/old-rules",
      [GOVERNMENT_HOST],
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedUrl).toBe("https://immigration.gov.ph/new-rules");
    }
  });

  it("blocks a redirect to a host that was not independently approved", () => {
    const result = validateOfficialSourceRedirect(
      "https://attacker.example.net/collect",
      "https://immigration.gov.ph/rules",
      [GOVERNMENT_HOST],
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("hostname_not_approved");
  });

  it("allows a cross-host redirect only when both exact hosts are approved", () => {
    const result = validateOfficialSourceRedirect(
      "https://dfa.gov.ph/rules",
      "https://immigration.gov.ph/rules",
      [GOVERNMENT_HOST, "dfa.gov.ph"],
    );
    expect(result.ok).toBe(true);
  });

  it("still blocks a redirect to an approved private literal", () => {
    const result = validateOfficialSourceRedirect(
      "https://127.0.0.1/metadata",
      "https://immigration.gov.ph/rules",
      [GOVERNMENT_HOST, "127.0.0.1"],
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unsafe_ip_address");
  });
});

describe("response metadata validation", () => {
  it.each([
    ["text/html; charset=utf-8", "text/html", "html"],
    ["APPLICATION/XHTML+XML", "application/xhtml+xml", "html"],
    ["text/plain; charset=UTF-8", "text/plain", "plain_text"],
    ["application/pdf", "application/pdf", "pdf"],
  ])("allows %s", (header, contentType, kind) => {
    expect(validateSourceContentType(header)).toEqual({
      ok: true,
      contentType,
      kind,
    });
  });

  it.each([
    null,
    undefined,
    "",
    "application/json",
    "application/octet-stream",
    "image/svg+xml",
  ])("rejects unsupported or absent content type %s", (header) => {
    expect(validateSourceContentType(header).ok).toBe(false);
  });

  it("rejects a header containing response-splitting controls", () => {
    expect(validateSourceContentType("text/html\r\nx-unsafe: yes")).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("rejects a combined or ambiguous content-type header", () => {
    expect(
      validateSourceContentType("text/html; charset=utf-8, application/json"),
    ).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("validates known lengths but leaves missing lengths for stream enforcement", () => {
    expect(validateDeclaredContentLength(null)).toEqual({
      ok: true,
      byteLength: null,
    });
    expect(validateDeclaredContentLength("0")).toEqual({
      ok: false,
      reason: "empty",
    });
    expect(
      validateDeclaredContentLength(String(SOURCE_MONITOR_MAX_RESPONSE_BYTES)),
    ).toEqual({
      ok: true,
      byteLength: SOURCE_MONITOR_MAX_RESPONSE_BYTES,
    });
    expect(
      validateDeclaredContentLength(
        String(SOURCE_MONITOR_MAX_RESPONSE_BYTES + 1),
      ),
    ).toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it.each(["-1", "+1", "1.5", "5,6", " 12", "01", "999999999999999999999"])(
    "rejects malformed content length %s",
    (header) => {
      expect(validateDeclaredContentLength(header)).toEqual({
        ok: false,
        reason: "malformed",
      });
    },
  );
});

describe("semantic normalization and change classification", () => {
  it("retains the complete ordered DOM, including executable and fallback surfaces", () => {
    const html = `
      <!doctype html>
      <html><head><title>Visa&nbsp;Rules</title><style>.x { color: red }</style></head>
      <body><!-- build 123 --><h1>Long&#x2011;stay rules</h1>
      <script>window.fee = 1000</script><template>Draft fee</template>
      <canvas>Fee chart fallback</canvas><svg><path d="M0 0 L1 1" /></svg>
      <p>Fee: &#8369; 1,000</p></body></html>
    `;
    const normalized = normalizeSemanticSourceText(html, "text/html");

    expect(normalized).toContain("Visa\u00a0Rules");
    expect(normalized).toContain("window.fee = 1000");
    expect(normalized).toContain("Draft fee");
    expect(normalized).toContain("Fee chart fallback");
    expect(normalized).toContain(":path");
    expect(normalized).toContain('"d","M0 0 L1 1"');
    expect(normalized).toContain("build 123");
  });

  it("normalizes only line-ending spelling for plain text", () => {
    expect(
      normalizeSemanticSourceText(
        "  Office\r\n\u200bＡ\t\tRules  ",
        "text/plain",
      ),
    ).toBe("  Office\n\u200bＡ\t\tRules  ");
  });

  it("preserves compatibility characters, full-width text and Unicode joiners", () => {
    expect(normalizeSemanticSourceText("x²", "text/plain")).not.toBe(
      normalizeSemanticSourceText("x2", "text/plain"),
    );
    expect(normalizeSemanticSourceText("Ａ", "text/plain")).not.toBe(
      normalizeSemanticSourceText("A", "text/plain"),
    );
    expect(normalizeSemanticSourceText("क्‍ष", "text/plain")).not.toBe(
      normalizeSemanticSourceText("क्ष", "text/plain"),
    );
    expect(normalizeSemanticSourceText("é", "text/plain")).not.toBe(
      normalizeSemanticSourceText("e\u0301", "text/plain"),
    );
  });

  it("implements SHA-256 deterministically for text and bytes", () => {
    const expected =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    expect(sha256Hex("abc")).toBe(expected);
    expect(sha256Hex(Uint8Array.from([0x61, 0x62, 0x63]))).toBe(expected);
    expect(sha256Hex("\ud800")).toBe(
      sha256Hex(Uint8Array.from([0xef, 0xbf, 0xbd])),
    );
  });

  it("treats ownership and structural changes as semantic", () => {
    const result = classifySourceContentChange(
      "<main><p>Official rule</p></main>",
      '<div class="new">  <span>Official rule</span> </div>',
      "text/html; charset=utf-8",
    );
    expect(result.ok && result.classification).toBe("semantic");
  });

  it("retains link destinations and the text each destination owns", () => {
    const destinationChanged = classifySourceContentChange(
      '<a href="/fees-2025">Official fee schedule</a>',
      '<a href="/fees-2026">Official fee schedule</a>',
      "text/html",
    );
    const ownershipChanged = classifySourceContentChange(
      '<a href="/visa-a">Visa A</a><span>Visa B</span>',
      '<span>Visa A</span><a href="/visa-a">Visa B</a>',
      "text/html",
    );

    expect(destinationChanged.ok && destinationChanged.classification).toBe(
      "semantic",
    );
    expect(ownershipChanged.ok && ownershipChanged.classification).toBe(
      "semantic",
    );
  });

  it.each([
    [
      "script-rendered values",
      "<div id=app></div><script>render({fee:1000})</script>",
      "<div id=app></div><script>render({fee:1500})</script>",
    ],
    [
      "generated CSS content",
      "<style>.fee::after { content: '1000'; }</style>",
      "<style>.fee::after { content: '1500'; }</style>",
    ],
    [
      "template content",
      "<template><p>Fee: 1000</p></template>",
      "<template><p>Fee: 1500</p></template>",
    ],
    [
      "canvas fallback content",
      "<canvas>Fee: 1000</canvas>",
      "<canvas>Fee: 1500</canvas>",
    ],
    [
      "SVG geometry",
      '<svg aria-label="Fee chart"><path d="M0 0 L1 1" /></svg>',
      '<svg aria-label="Fee chart"><path d="M0 0 L2 2" /></svg>',
    ],
    [
      "visible form state",
      '<input aria-label="Minimum income" value="1000" min="1000">',
      '<input aria-label="Minimum income" value="1500" min="1500" checked>',
    ],
    [
      "comments that may carry build or hydration state",
      "<!-- rules-version:1 --><p>Rules</p>",
      "<!-- rules-version:2 --><p>Rules</p>",
    ],
  ])("treats %s changes as semantic", (_label, previous, current) => {
    const result = classifySourceContentChange(previous, current, "text/html");
    expect(result.ok && result.classification).toBe("semantic");
  });

  it("treats visible SVG text changes as semantic", () => {
    const result = classifySourceContentChange(
      '<svg role="img"><text>Application fee: ₱1,000</text></svg>',
      '<svg role="img"><text>Application fee: ₱1,500</text></svg>',
      "text/html",
    );

    expect(result.ok && result.classification).toBe("semantic");
  });

  it("treats image notice source and alternative-text changes as semantic", () => {
    const sourceChanged = classifySourceContentChange(
      '<img src="/notices/visa-2025.png" alt="Visa rules for 2025">',
      '<img src="/notices/visa-2026.png" alt="Visa rules for 2025">',
      "text/html",
    );
    const alternativeTextChanged = classifySourceContentChange(
      '<img src="/notices/visa.png" alt="Applications close June 1">',
      '<img src="/notices/visa.png" alt="Applications close July 1">',
      "text/html",
    );

    expect(sourceChanged.ok && sourceChanged.classification).toBe("semantic");
    expect(
      alternativeTextChanged.ok && alternativeTextChanged.classification,
    ).toBe("semantic");
  });

  it("uses parsed attributes so quoting and attribute order are non-semantic", () => {
    const result = classifySourceContentChange(
      '<a title="Official schedule" href="/fees?a=1&amp;b=2">Fees</a>',
      "<a href='/fees?a=1&amp;b=2' title='Official schedule'>Fees</a>",
      "text/html",
    );

    expect(result.ok && result.classification).toBe("non_semantic");
  });

  it("uses iterative traversal for deeply nested but bounded HTML", () => {
    const depth = 12_000;
    const html = `${"<div>".repeat(depth)}Official rule${"</div>".repeat(depth)}`;

    expect(() => normalizeSemanticSourceText(html, "text/html")).not.toThrow();
  });

  it("classifies exact and meaningful changes separately", () => {
    const unchanged = classifySourceContentChange(
      "Fee: 1,000",
      "Fee: 1,000",
      "text/plain",
    );
    const semantic = classifySourceContentChange(
      "Fee: 1,000",
      "Fee: 2,000",
      "text/plain",
    );
    expect(unchanged.ok && unchanged.classification).toBe("unchanged");
    expect(semantic.ok && semantic.classification).toBe("semantic");
  });

  it("classifies a MIME kind transition as semantic even when text is identical", () => {
    const result = classifySourceContentChange(
      "Official rule",
      "Official rule",
      "text/plain",
      "text/html",
    );
    expect(result.ok && result.classification).toBe("semantic");
  });

  it("classifies an HTML to XHTML MIME transition as semantic", () => {
    const result = classifySourceContentChange(
      "<p>Official rule</p>",
      "<p>Official rule</p>",
      "text/html",
      "application/xhtml+xml",
    );
    expect(result.ok && result.classification).toBe("semantic");
  });

  it("preserves XML-sensitive XHTML spelling instead of HTML-normalizing it", () => {
    const result = classifySourceContentChange(
      '<Rule Eligible="Yes" />',
      '<rule eligible="Yes" />',
      "application/xhtml+xml",
    );

    expect(result.ok && result.classification).toBe("semantic");
  });

  it("supports an HTML to PDF transition with separate body representations", () => {
    const result = classifySourceContentChange(
      "<p>Official rule</p>",
      Uint8Array.from([0x25, 0x50, 0x44, 0x46]),
      "text/html",
      "application/pdf",
    );
    expect(result.ok && result.classification).toBe("semantic");
  });

  it("preserves meaningful text spacing but canonicalizes line-ending spelling", () => {
    const spacing = classifySourceContentChange(
      "Eligibility:\r\nAdults only",
      "Eligibility:   Adults only",
      "text/plain",
    );
    const lineEndings = classifySourceContentChange(
      "Eligibility:\r\nAdults only",
      "Eligibility:\nAdults only",
      "text/plain",
    );
    expect(spacing.ok && spacing.classification).toBe("semantic");
    expect(lineEndings.ok && lineEndings.classification).toBe("non_semantic");
  });

  it("treats PDFs as immutable binary evidence", () => {
    const first = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x01]);
    const same = Uint8Array.from(first);
    const changed = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x02]);
    const unchanged = classifySourceContentChange(
      first,
      same,
      "application/pdf",
    );
    const semantic = classifySourceContentChange(
      first,
      changed,
      "application/pdf",
    );
    expect(unchanged.ok && unchanged.classification).toBe("unchanged");
    expect(semantic.ok && semantic.classification).toBe("semantic");
  });

  it("rejects empty bodies, body/content-type mismatches and unsupported types", () => {
    expect(prepareSourceContent("", "text/plain")).toEqual({
      ok: false,
      reason: "empty_body",
    });
    expect(prepareSourceContent(new Uint8Array(), "application/pdf")).toEqual({
      ok: false,
      reason: "empty_body",
    });
    expect(prepareSourceContent("%PDF", "application/pdf")).toEqual({
      ok: false,
      reason: "body_type_mismatch",
    });
    expect(prepareSourceContent(Uint8Array.from([1]), "text/html")).toEqual({
      ok: false,
      reason: "body_type_mismatch",
    });
    expect(prepareSourceContent("{}", "application/json")).toEqual({
      ok: false,
      reason: "unsupported_content_type",
    });
  });
});
