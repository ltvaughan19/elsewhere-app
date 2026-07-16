import { createHash, timingSafeEqual } from "node:crypto";
import "server-only";

const MINIMUM_CRON_SECRET_LENGTH = 32;
const WORKER_ROLE = "source_monitor_worker";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function isCronSecretConfigured(secret: string | undefined): secret is string {
  return Boolean(secret && secret.length >= MINIMUM_CRON_SECRET_LENGTH);
}

export function hasValidCronAuthorization(request: Request, expectedSecret: string): boolean {
  const authorization = request.headers.get("authorization");
  const prefix = "Bearer ";
  if (!authorization?.startsWith(prefix)) return false;

  const suppliedSecret = authorization.slice(prefix.length);
  if (!suppliedSecret || suppliedSecret.trim() !== suppliedSecret) return false;

  return timingSafeEqual(digest(suppliedSecret), digest(expectedSecret));
}

type WorkerJwtPayload = {
  exp?: unknown;
  role?: unknown;
};

function readJwtPayload(token: string): WorkerJwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const parsed = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" ? (parsed as WorkerJwtPayload) : null;
  } catch {
    return null;
  }
}

/**
 * This is a configuration guard, not signature verification. Supabase verifies
 * the token. We additionally refuse to start with an accidentally supplied
 * service-role or ordinary user token.
 */
export function isNarrowSourceMonitorWorkerJwt(
  token: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): token is string {
  if (!token) return false;
  const payload = readJwtPayload(token);
  if (!payload || payload.role !== WORKER_ROLE) return false;
  return (
    typeof payload.exp === "number" &&
    Number.isSafeInteger(payload.exp) &&
    payload.exp > nowSeconds + 60
  );
}

