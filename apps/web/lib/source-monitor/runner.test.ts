import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let runner: typeof import("./runner");

const job = {
  job_id: "11111111-1111-4111-8111-111111111111",
  lease_token: "22222222-2222-4222-8222-222222222222",
  source_document_id: "33333333-3333-4333-8333-333333333333",
  canonical_url: "https://immigration.gov.example/rules",
  approved_hostnames: ["immigration.gov.example"],
  configuration_version: 1,
  previous_final_url: null,
  previous_content_type: null,
  previous_content_length_bytes: null,
  previous_raw_hash: null,
  previous_semantic_hash: null,
  previous_etag: null,
  previous_last_modified: null,
  previous_normalization_algorithm_version: null,
};

function fakeClient(claimedJobs: unknown[]) {
  const rpc = vi.fn(async (name: string, _parameters?: Record<string, unknown>) => {
    if (name === "claim_source_monitor_jobs") {
      return { data: claimedJobs, error: null };
    }
    return { data: {}, error: null };
  });
  return { rpc };
}

beforeAll(async () => {
  runner = await import("./runner");
});

describe("source monitor worker runner", () => {
  it("records a first successful fetch as a baseline without storing a body", async () => {
    const client = fakeClient([job]);
    const fetchSource = vi.fn(async () => ({
      ok: true as const,
      httpStatus: 200 as const,
      finalUrl: job.canonical_url,
      contentType: "text/html" as const,
      contentLengthBytes: 512,
      rawHash: "a".repeat(64),
      semanticHash: "b".repeat(64),
      normalizationAlgorithmVersion: "ordered-dom-v3" as const,
      etag: '"v1"',
      lastModified: null,
      validatorEtagSent: false,
      validatorLastModifiedSent: false,
      finalUrlChanged: false,
      notModified: false as const,
    }));

    const summary = await runner.runSourceMonitorBatch({
      batchSize: 5,
      client,
      fetchSource,
    });

    expect(summary.statuses.baseline).toBe(1);
    const completion = client.rpc.mock.calls.find(
      ([name]) => name === "complete_source_monitor_job",
    );
    expect(completion?.[1]).toMatchObject({
      target_status: "baseline",
      target_current_semantic_hash: "b".repeat(64),
      target_normalization_algorithm_version: "ordered-dom-v3",
    });
    expect(completion?.[1]).not.toHaveProperty("body");
  });

  it("sends a strict 304 completion without invented current hashes", async () => {
    const priorJob = {
      ...job,
      previous_final_url: job.canonical_url,
      previous_content_type: "text/html",
      previous_content_length_bytes: 512,
      previous_raw_hash: "a".repeat(64),
      previous_semantic_hash: "b".repeat(64),
      previous_etag: '"v1"',
      previous_normalization_algorithm_version: "ordered-dom-v3",
    };
    const client = fakeClient([priorJob]);
    await runner.runSourceMonitorBatch({
      batchSize: 1,
      client,
      fetchSource: async () => ({
        ok: true,
        httpStatus: 304,
        notModified: true,
        finalUrl: job.canonical_url,
        etag: '"v1"',
        lastModified: null,
        validatorEtagSent: true,
        validatorLastModifiedSent: false,
        finalUrlChanged: false,
      }),
    });

    const parameters = client.rpc.mock.calls.find(
      ([name]) => name === "complete_source_monitor_job",
    )?.[1];
    expect(parameters).toMatchObject({
      target_status: "unchanged",
      target_http_status: 304,
      target_current_raw_hash: null,
      target_current_semantic_hash: null,
      target_normalization_algorithm_version: null,
      target_validator_etag_sent: true,
    });
  });

  it("preserves validator provenance for a failed conditional fetch", async () => {
    const client = fakeClient([{ ...job, previous_etag: '"v1"' }]);
    const summary = await runner.runSourceMonitorBatch({
      batchSize: 1,
      client,
      fetchSource: async () => ({
        ok: false,
        status: "blocked",
        code: "redirect_not_approved",
        detail: "Redirect left the approved government hostname set.",
        httpStatus: 302,
        finalUrl: job.canonical_url,
        validatorEtagSent: true,
        validatorLastModifiedSent: false,
      }),
    });

    expect(summary.statuses.blocked).toBe(1);
    expect(
      client.rpc.mock.calls.find(([name]) => name === "complete_source_monitor_job")?.[1],
    ).toMatchObject({
      target_status: "blocked",
      target_validator_etag_sent: true,
      target_error_code: "redirect_not_approved",
    });
  });

  it("fails closed on an invalid claimed-job response", async () => {
    const client = fakeClient([{ ...job, lease_token: "not-a-uuid" }]);
    const fetchSource = vi.fn();
    const summary = await runner.runSourceMonitorBatch({
      batchSize: 1,
      client,
      fetchSource,
    });

    expect(summary.invalidJobs).toBe(1);
    expect(summary.completed).toBe(0);
    expect(fetchSource).not.toHaveBeenCalled();
  });
});
