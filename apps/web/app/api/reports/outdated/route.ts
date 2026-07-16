import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ReportBody = {
  countrySlug?: unknown;
  details?: unknown;
  email?: unknown;
  sourceUrl?: unknown;
  pageUrl?: unknown;
  website?: unknown;
};

const rateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;

function normalizeOptionalEmail(value: unknown): string | null {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "invalid";
}

function normalizeHttpsUrl(value: unknown): string | null | "invalid" {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" && raw.length <= 2048
      ? parsed.toString()
      : "invalid";
  } catch {
    return "invalid";
  }
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function isRateLimited(request: Request): boolean {
  const key =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const now = Date.now();
  if (rateBuckets.size > 5_000) {
    for (const [bucketKey, timestamps] of rateBuckets) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) {
        rateBuckets.delete(bucketKey);
      }
    }
  }
  const recent = (rateBuckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  rateBuckets.set(key, recent);
  return false;
}

function normalizePagePath(value: unknown, request: Request): string {
  try {
    const page = new URL(String(value ?? ""), request.url);
    return `${page.pathname}${page.search}`.slice(0, 2048);
  } catch {
    return "/countries";
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: ReportBody;
  try {
    body = (await request.json()) as ReportBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: acknowledge automated submissions without writing them.
  if (String(body.website ?? "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const countrySlug = String(body.countrySlug ?? "").trim().toLowerCase();
  const details = String(body.details ?? "").trim();
  const email = normalizeOptionalEmail(body.email);
  const sourceUrl = normalizeHttpsUrl(body.sourceUrl);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(countrySlug)) {
    return NextResponse.json({ ok: false, error: "invalid_country" }, { status: 400 });
  }
  if (details.length < 10 || details.length > 5000) {
    return NextResponse.json({ ok: false, error: "invalid_details" }, { status: 400 });
  }
  if (email === "invalid") {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (sourceUrl === "invalid") {
    return NextResponse.json({ ok: false, error: "invalid_source_url" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: country, error: countryError } = await admin
      .from("countries")
      .select("id")
      .eq("slug", countrySlug)
      .maybeSingle();
    if (countryError || !country) {
      return NextResponse.json({ ok: false, error: "country_not_found" }, { status: 404 });
    }

    const { data: release } = await admin
      .from("country_releases")
      .select("id")
      .eq("country_id", country.id)
      .eq("state", "published")
      .eq("is_current", true)
      .maybeSingle();

    const { error } = await admin.from("outdated_information_reports").insert({
      country_id: country.id,
      release_id: release?.id ?? null,
      page_url: normalizePagePath(body.pageUrl, request),
      description: details,
      suggested_source_url: sourceUrl,
      reporter_email: email,
    });

    if (error) {
      console.error("[outdated-report] insert failed", error.message);
      return NextResponse.json({ ok: false, error: "storage_failed" }, { status: 502 });
    }
  } catch (error) {
    console.error("[outdated-report] exception", error);
    return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
