import type {
  OnboardingAnswers,
  PathPackSeed,
  ReadinessResult,
  SourceClaimDisplay,
} from "@expat-atlas/types";
import {
  LAUNCH_CORRIDORS,
  SEED_CLAIMS,
  SEED_PATH_PACKS,
} from "@/lib/seed-corridors";
import { computeReadiness } from "@/lib/readiness-score";

export function corridorSlugForDestination(destinationSlug: string): string {
  const hit = LAUNCH_CORRIDORS.find((c) => c.destinationSlug === destinationSlug);
  return hit?.slug ?? `us-${destinationSlug}`;
}

export function pathPackForDestination(
  destinationSlug: string,
): PathPackSeed | undefined {
  const corridorSlug = corridorSlugForDestination(destinationSlug);
  return SEED_PATH_PACKS.find((p) => p.corridorSlug === corridorSlug);
}

export function claimsForPathPack(pack: PathPackSeed): SourceClaimDisplay[] {
  return pack.claimIds
    .map((id) => SEED_CLAIMS.find((c) => c.id === id))
    .filter((c): c is SourceClaimDisplay => Boolean(c));
}

export function resolvePathFromAnswers(answers: OnboardingAnswers): {
  readiness: ReadinessResult;
  pack: PathPackSeed | undefined;
  claims: SourceClaimDisplay[];
  corridorSlug: string;
} {
  const readiness = computeReadiness(answers);
  const corridorSlug = corridorSlugForDestination(readiness.bestFitSlug);
  const pack = pathPackForDestination(readiness.bestFitSlug);
  const claims = pack ? claimsForPathPack(pack) : [];
  return { readiness, pack, claims, corridorSlug };
}
