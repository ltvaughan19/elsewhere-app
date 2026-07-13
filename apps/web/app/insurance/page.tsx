import { EducationPage } from "@/components/education-page";

export default function InsurancePage() {
  return (
    <EducationPage
      title="Health insurance guide"
      intro="Long-stay expats need a coverage strategy — local plans, international policies, or travel insurance with limits. We outline categories to research, not which policy to buy."
      sections={[
        {
          heading: "Coverage categories",
          body: "International health plans, local private insurance, and country-specific public options each have tradeoffs for residency length, pre-existing conditions, and evacuation.",
        },
        {
          heading: "Questions to ask",
          body: "What is covered in your target country? Are pre-existing conditions excluded? Does the policy require you to maintain a home-country residence? What is the claims process abroad?",
        },
        {
          heading: "Planning estimate",
          body: "Budget a monthly insurance line item in our calculator. Verify policy terms with licensed brokers or insurers — not blog summaries.",
        },
      ]}
    />
  );
}
