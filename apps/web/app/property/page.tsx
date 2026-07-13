import { EducationPage } from "@/components/education-page";

export default function PropertyPage() {
  return (
    <EducationPage
      title="Property caution hub"
      intro="Buying property abroad can affect visas, taxes, inheritance, and residency. We explain what to research — we do not sell listings or guarantee titles."
      sections={[
        {
          heading: "Foreign ownership rules",
          body: "Some countries restrict land ownership by non-citizens or require corporate structures. Rules change — verify with official land registry and licensed counsel before any deposit.",
        },
        {
          heading: "Due diligence checklist",
          body: "Title search, liens, developer reputation, escrow practices, and currency risk belong on your list. Treat social-media 'deals' as high risk until independently verified.",
        },
        {
          heading: "Rent-first principle",
          body: "Most first-time expats should rent for at least one full season before purchasing. Elsewhere does not facilitate property transactions in MVP.",
        },
      ]}
    />
  );
}
