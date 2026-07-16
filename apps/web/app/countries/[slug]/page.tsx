import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountryPortalShell } from "@/components/country-portal/CountryPortalShell";
import { getCountryPortal } from "@/lib/country-portals/queries";
import { COUNTRY_PORTAL_SLUGS } from "@/lib/country-portals/types";

interface CountryDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export function generateStaticParams() {
  return COUNTRY_PORTAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CountryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const portal = await getCountryPortal(slug);

  if (!portal) {
    return {
      title: "Country portal not found | Elsewhere",
      robots: { index: false, follow: false },
    };
  }

  const isPublished = portal.publicationState === "published";
  const title = `${portal.name} living-abroad portal | Elsewhere`;
  const canonicalUrl = `https://elsewhereplan.com/countries/${portal.slug}`;

  return {
    title,
    description: portal.summary,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: isPublished,
      follow: true,
      googleBot: {
        index: isPublished,
        follow: true,
      },
    },
    openGraph: {
      title,
      description: portal.summary,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function CountryDetailPage({
  params,
}: CountryDetailPageProps) {
  const { slug } = await params;
  const portal = await getCountryPortal(slug);
  if (!portal) notFound();

  return <CountryPortalShell portal={portal} />;
}
