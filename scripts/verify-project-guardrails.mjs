import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function requireText(path, text, reason) {
  if (!read(path).includes(text)) failures.push(`${path}: ${reason}`);
}

const earthPath = "apps/web/lib/marketing/splineScene.js";
const earthHash = createHash("sha256").update(readFileSync(join(root, earthPath))).digest("hex");
const lockedEarthHash = "a73625b8953b3ecb18b599faa38f6e38399e2a3aeab0616bbcd75123a3e2f951";
if (earthHash !== lockedEarthHash) {
  failures.push(`${earthPath}: locked Earth scene changed without an approved guardrail update`);
}

requireText("apps/web/components/marketing-landing.tsx", 'id="loader"', "loading screen container is missing");
requireText("apps/web/components/marketing-landing.tsx", "loader-mark", "loading screen mark is missing");
requireText("apps/web/lib/marketing/bootMarketing.ts", 'querySelector<HTMLElement>("#loader")', "loading screen lookup is missing");
requireText("apps/web/lib/marketing/bootMarketing.ts", 'classList.add("is-done")', "loading completion behavior is missing");
requireText("apps/web/app/layout.tsx", "AuthSessionProvider", "global auth continuity provider is missing");
requireText("apps/web/components/site-header.tsx", "useAuthSession", "product header is not session aware");
requireText("apps/web/components/marketing-landing.tsx", "useAuthSession", "marketing header is not session aware");
requireText("apps/web/lib/supabase/client.ts", "browserAuthCookies", "trusted-device cookie policy is not applied in the browser");
requireText("apps/web/lib/supabase/middleware.ts", "applyTrustedDeviceLifetime", "trusted-device cookie policy is not applied during refresh");
requireText("apps/web/app/auth/callback/route.ts", "safeNextPath", "auth callback redirect is not fail-closed");
requireText("apps/web/lib/auth/oauth.ts", '["google", "apple"]', "expected social sign-in providers are missing");

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (
      entry.isDirectory() &&
      [".next", "node_modules", "playwright-report", "test-results"].includes(entry.name)
    ) {
      return [];
    }
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const clientFiles = filesUnder(join(root, "apps/web"))
  .filter((path) => /\.(?:ts|tsx|js|jsx)$/.test(path))
  .filter((path) => {
    const source = readFileSync(path, "utf8");
    return source.startsWith('"use client"') || source.startsWith("'use client'");
  });

for (const path of clientFiles) {
  const source = readFileSync(path, "utf8");
  if (/SUPABASE_(?:SERVICE_ROLE|SECRET)_KEY/.test(source)) {
    failures.push(`${relative(root, path)}: privileged Supabase key referenced by client code`);
  }
}

for (const required of [
  "docs/operations/QUALITY_GATES.md",
  "docs/notes/2026-07-16-cursor-builder-handoff.md",
]) {
  try {
    if (!statSync(join(root, required)).isFile()) failures.push(`${required}: required project record is missing`);
  } catch {
    failures.push(`${required}: required project record is missing`);
  }
}

if (failures.length) {
  console.error("Elsewhere guardrails failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Elsewhere guardrails passed: Earth, loader, auth continuity, trust controls, and project records are intact.");
