import {
  safeFetchOfficialSource,
  type SafeSourceFetchInput,
  type SafeSourceFetchResult,
} from "./safe-fetch";
import "server-only";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RpcError = { message: string };

export type SourceMonitorRpcClient = {
  rpc: (
    functionName: string,
    parameters?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: RpcError | null }>;
};

type ClaimedSourceMonitorJob = {
  jobId: string;
  leaseToken: string;
  sourceDocumentId: string;
  fetchInput: SafeSourceFetchInput;
};

export type SourceMonitorCompletionStatus =
  | "baseline"
  | "unchanged"
  | "changed"
  | "blocked"
  | "unavailable"
  | "failed";

export type SourceMonitorBatchSummary = {
  claimed: number;
  completed: number;
  completionErrors: number;
  fetchExceptions: number;
  invalidJobs: number;
  statuses: Record<SourceMonitorCompletionStatus, number>;
};

type ProcessResult = {
  completionError: boolean;
  fetchException: boolean;
  invalid: boolean;
  status: SourceMonitorCompletionStatus | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

function parseClaimedJob(value: unknown): ClaimedSourceMonitorJob | null {
  if (!isRecord(value)) return null;

  const jobId = value.job_id;
  const leaseToken = value.lease_token;
  const sourceDocumentId = value.source_document_id;
  const canonicalUrl = value.canonical_url;
  const approvedHostnames = value.approved_hostnames;
  const configurationVersion = value.configuration_version;
  const previousFinalUrl = nullableString(value.previous_final_url);
  const previousContentType = nullableString(value.previous_content_type);
  const previousRawHash = nullableString(value.previous_raw_hash);
  const previousSemanticHash = nullableString(value.previous_semantic_hash);
  const previousEtag = nullableString(value.previous_etag);
  const previousLastModified = nullableString(value.previous_last_modified);
  const previousNormalizationAlgorithmVersion = nullableString(
    value.previous_normalization_algorithm_version,
  );

  if (
    typeof jobId !== "string" ||
    !UUID.test(jobId) ||
    typeof leaseToken !== "string" ||
    !UUID.test(leaseToken) ||
    typeof sourceDocumentId !== "string" ||
    !UUID.test(sourceDocumentId) ||
    typeof canonicalUrl !== "string" ||
    canonicalUrl.length === 0 ||
    canonicalUrl.length > 4096 ||
    !Array.isArray(approvedHostnames) ||
    approvedHostnames.length === 0 ||
    approvedHostnames.length > 64 ||
    !approvedHostnames.every(
      (hostname) =>
        typeof hostname === "string" && hostname.length > 0 && hostname.length <= 253,
    ) ||
    !Number.isInteger(configurationVersion) ||
    Number(configurationVersion) < 1 ||
    previousFinalUrl === undefined ||
    previousContentType === undefined ||
    previousRawHash === undefined ||
    previousSemanticHash === undefined ||
    previousEtag === undefined ||
    previousLastModified === undefined ||
    previousNormalizationAlgorithmVersion === undefined
  ) {
    return null;
  }

  return {
    jobId,
    leaseToken,
    sourceDocumentId,
    fetchInput: {
      url: canonicalUrl,
      approvedHostnames,
      previousFinalUrl,
      previousContentType,
      previousRawHash,
      previousSemanticHash,
      previousEtag,
      previousLastModified,
      previousNormalizationAlgorithmVersion,
    },
  };
}

function deriveSuccessStatus(
  job: ClaimedSourceMonitorJob,
  result: Extract<SafeSourceFetchResult, { ok: true }>,
): SourceMonitorCompletionStatus {
  if (result.httpStatus === 304) return "unchanged";

  const previous = job.fetchInput;
  if (previous.previousSemanticHash === null) return "baseline";
  if (
    previous.previousFinalUrl !== result.finalUrl ||
    previous.previousContentType !== result.contentType ||
    previous.previousNormalizationAlgorithmVersion !==
      result.normalizationAlgorithmVersion ||
    previous.previousSemanticHash !== result.semanticHash
  ) {
    return "changed";
  }
  return "unchanged";
}

function createCompletionParameters(
  job: ClaimedSourceMonitorJob,
  result: SafeSourceFetchResult,
): { status: SourceMonitorCompletionStatus; parameters: Record<string, unknown> } {
  const shared = {
    target_job_id: job.jobId,
    target_lease_token: job.leaseToken,
    target_content_type: null,
    target_content_length_bytes: null,
    target_current_raw_hash: null,
    target_current_semantic_hash: null,
    target_normalization_algorithm_version: null,
    target_etag: null,
    target_last_modified_header: null,
    target_error_code: null,
    target_error_detail: null,
  };

  if (!result.ok) {
    return {
      status: result.status,
      parameters: {
        ...shared,
        target_status: result.status,
        target_http_status: result.httpStatus,
        target_final_url: result.finalUrl,
        target_validator_etag_sent: result.validatorEtagSent,
        target_validator_last_modified_sent: result.validatorLastModifiedSent,
        target_error_code: result.code,
        target_error_detail: result.detail,
      },
    };
  }

  const status = deriveSuccessStatus(job, result);
  if (result.httpStatus === 304) {
    return {
      status,
      parameters: {
        ...shared,
        target_status: status,
        target_http_status: 304,
        target_final_url: result.finalUrl,
        target_etag: result.etag,
        target_last_modified_header: result.lastModified,
        target_validator_etag_sent: result.validatorEtagSent,
        target_validator_last_modified_sent: result.validatorLastModifiedSent,
      },
    };
  }

  return {
    status,
    parameters: {
      ...shared,
      target_status: status,
      target_http_status: 200,
      target_final_url: result.finalUrl,
      target_content_type: result.contentType,
      target_content_length_bytes: result.contentLengthBytes,
      target_etag: result.etag,
      target_last_modified_header: result.lastModified,
      target_current_raw_hash: result.rawHash,
      target_current_semantic_hash: result.semanticHash,
      target_normalization_algorithm_version: result.normalizationAlgorithmVersion,
      target_validator_etag_sent: result.validatorEtagSent,
      target_validator_last_modified_sent: result.validatorLastModifiedSent,
    },
  };
}

async function processClaimedJob(
  client: SourceMonitorRpcClient,
  rawJob: unknown,
  fetchSource: (input: SafeSourceFetchInput) => Promise<SafeSourceFetchResult>,
): Promise<ProcessResult> {
  const job = parseClaimedJob(rawJob);
  if (!job) {
    console.error("[source-monitor] worker received an invalid claimed-job contract");
    return { completionError: false, fetchException: false, invalid: true, status: null };
  }

  let result: SafeSourceFetchResult;
  let fetchException = false;
  try {
    result = await fetchSource(job.fetchInput);
  } catch (error) {
    fetchException = true;
    console.error("[source-monitor] fetcher threw unexpectedly", job.jobId, error);
    result = {
      ok: false,
      status: "failed",
      code: "worker_exception",
      detail: "The source worker failed before producing a validated result.",
      httpStatus: null,
      finalUrl: null,
      validatorEtagSent: false,
      validatorLastModifiedSent: false,
    };
  }

  const completion = createCompletionParameters(job, result);
  const { error } = await client.rpc(
    "complete_source_monitor_job",
    completion.parameters,
  );
  if (error) {
    console.error("[source-monitor] completion RPC failed", job.jobId, error.message);
    return { completionError: true, fetchException, invalid: false, status: null };
  }

  return {
    completionError: false,
    fetchException,
    invalid: false,
    status: completion.status,
  };
}

export async function runSourceMonitorBatch({
  batchSize,
  client,
  fetchSource = safeFetchOfficialSource,
}: {
  batchSize: number;
  client: SourceMonitorRpcClient;
  fetchSource?: (input: SafeSourceFetchInput) => Promise<SafeSourceFetchResult>;
}): Promise<SourceMonitorBatchSummary> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10) {
    throw new Error("Source monitor batch size must be an integer from 1 through 10.");
  }

  const { data, error } = await client.rpc("claim_source_monitor_jobs", {
    target_batch_size: batchSize,
  });
  if (error) {
    console.error("[source-monitor] claim RPC failed", error.message);
    throw new Error("The source monitor could not claim work.");
  }
  if (!Array.isArray(data)) {
    console.error("[source-monitor] claim RPC returned an invalid response contract");
    throw new Error("The source monitor received an invalid work response.");
  }

  const results = await Promise.all(
    data.map((job) => processClaimedJob(client, job, fetchSource)),
  );
  const statuses: SourceMonitorBatchSummary["statuses"] = {
    baseline: 0,
    unchanged: 0,
    changed: 0,
    blocked: 0,
    unavailable: 0,
    failed: 0,
  };

  for (const result of results) {
    if (result.status) statuses[result.status] += 1;
  }

  return {
    claimed: data.length,
    completed: results.filter((result) => result.status !== null).length,
    completionErrors: results.filter((result) => result.completionError).length,
    fetchExceptions: results.filter((result) => result.fetchException).length,
    invalidJobs: results.filter((result) => result.invalid).length,
    statuses,
  };
}

