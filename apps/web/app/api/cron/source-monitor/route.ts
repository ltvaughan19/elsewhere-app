import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  hasValidCronAuthorization,
  isCronSecretConfigured,
  isNarrowSourceMonitorWorkerJwt,
} from "@/lib/source-monitor/cron-auth";
import {
  runSourceMonitorBatch,
  type SourceMonitorRpcClient,
} from "@/lib/source-monitor/runner";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function configuredBatchSize(): number {
  const raw = process.env.SOURCE_MONITOR_BATCH_SIZE?.trim();
  if (!raw) return 5;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : 5;
}

function response(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!isCronSecretConfigured(cronSecret)) {
    console.error("[source-monitor] CRON_SECRET is missing or too short");
    return response({ ok: false, error: "worker_not_configured" }, 503);
  }
  if (!hasValidCronAuthorization(request, cronSecret)) {
    return response({ ok: false, error: "unauthorized" }, 401);
  }

  const workerJwt = process.env.SUPABASE_SOURCE_MONITOR_WORKER_JWT;
  if (!isNarrowSourceMonitorWorkerJwt(workerJwt)) {
    console.error("[source-monitor] dedicated worker JWT is missing, expired, or over-privileged");
    return response({ ok: false, error: "worker_not_configured" }, 503);
  }

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      accessToken: async () => workerJwt,
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const summary = await runSourceMonitorBatch({
      batchSize: configuredBatchSize(),
      client: supabase as unknown as SourceMonitorRpcClient,
    });
    return response({ ok: true, ...summary }, 200);
  } catch (error) {
    console.error("[source-monitor] scheduled run failed", error);
    return response({ ok: false, error: "worker_failed" }, 502);
  }
}

