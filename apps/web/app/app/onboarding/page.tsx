import { OnboardingQuiz } from "@/components/onboarding-quiz";

const supportedDestinations = new Set(["philippines", "thailand", "mexico"]);

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  const initialDestination =
    destination && supportedDestinations.has(destination) ? destination : undefined;
  return <OnboardingQuiz initialDestination={initialDestination} />;
}
