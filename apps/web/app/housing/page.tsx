import { EducationPage } from "@/components/education-page";

export default function HousingPage() {
  return (
    <EducationPage
      title="Housing strategy"
      intro="Rent first. Buy later — if ever. This guide helps you research neighborhoods and avoid common rental scams without booking through us."
      sections={[
        {
          heading: "Rent before you commit",
          body: "Plan your first 3–6 months in temporary housing while you learn the area, internet quality, and commute patterns. Avoid large deposits to strangers on social media.",
        },
        {
          heading: "Verify listings",
          body: "Use reputable platforms where possible, video-walk properties live, and never wire money before a signed lease reviewed by someone you trust. Local laws vary — verify tenant rights with official sources.",
        },
        {
          heading: "Neighborhood fit",
          body: "Match budget, safety research, healthcare access, and expat community density to your priorities. Our country compare tool uses planning estimates only.",
        },
      ]}
    />
  );
}
