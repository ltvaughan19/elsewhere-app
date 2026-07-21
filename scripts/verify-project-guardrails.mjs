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
const lockedEarthHash = "92a444e69083a8846d0c495f64e091dac3bd41e30db5c6478ee8cfbc7c1cbd79";
if (earthHash !== lockedEarthHash) {
  failures.push(`${earthPath}: locked Earth scene changed without an approved guardrail update`);
}

requireText(earthPath, 'SPLINE_SCENE_URL = "/earth/scene.splinecode"', "Earth must load the self-hosted scene binary");
requireText(earthPath, "CAMERA_WAYPOINTS", "Earth cinematic camera path is missing");
requireText(earthPath, "reduceGlobeGlare", "Earth illumination soften path is missing");

const sceneBinaryPath = "apps/web/public/earth/scene.splinecode";
const sceneBinaryFull = join(root, sceneBinaryPath);
try {
  const sceneBytes = readFileSync(sceneBinaryFull);
  const sceneHash = createHash("sha256").update(sceneBytes).digest("hex");
  const lockedSceneHash = "91d33734f263d0c3a0a5f7bdc5c7fa4a0f5936d7cafff51f938e23c4397ab779";
  if (sceneHash !== lockedSceneHash) {
    failures.push(`${sceneBinaryPath}: locked Earth binary changed without an approved guardrail update`);
  }
  const logoIdx = sceneBytes.indexOf(Buffer.from("logo"));
  if (logoIdx < 0 || sceneBytes[logoIdx + 4] !== 0xc2) {
    failures.push(`${sceneBinaryPath}: Spline logo flag must remain false (Logo=No)`);
  }
} catch {
  failures.push(`${sceneBinaryPath}: self-hosted Earth binary is missing`);
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
requireText(
  "apps/web/lib/auth/oauth.ts",
  '["google", "apple", "facebook"]',
  "expected social sign-in providers are missing",
);
requireText(
  "docs/plans/PRODUCT_CLARITY_MAP.md",
  "I’m actually going — and I know the one thing to do before Sunday.",
  "locked product north star is missing",
);
requireText(
  "CLAUDE.md",
  "Leaving is the metric.",
  "builder guidance no longer enforces the product north star",
);
requireText(
  ".cursor/rules/ceo-north-star.mdc",
  "CEO Message:",
  "persistent CEO response discipline is missing",
);
requireText(
  ".cursor/rules/ceo-north-star.mdc",
  "Veto duty",
  "persistent failure-shaped work veto is missing",
);

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
  "docs/CURRENT.md",
  "docs/operations/QUALITY_GATES.md",
  ".cursor/rules/ceo-north-star.mdc",
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

console.log("Elsewhere guardrails passed: north star, Earth, loader, auth continuity, trust controls, and project records are intact.");
