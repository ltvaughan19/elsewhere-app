import type { MetadataRoute } from "next";
import { getPublishedCountrySlugs } from "@/lib/country-portals/queries";

const staticRoutes = [
  "",
  "/start",
  "/countries",
  "/compare",
  "/visa-compass",
  "/passport-checklist",
  "/budget-calculator",
  "/corridors",
  "/housing",
  "/property",
  "/insurance",
  "/community",
  "/blog",
  "/trust",
  "/pricing",
  "/about",
  "/partners",
  "/become-a-partner",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://elsewhereplan.com"
  ).replace(/\/$/, "");
  const publishedCountrySlugs = await getPublishedCountrySlugs();

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
    })),
    ...publishedCountrySlugs.map((slug) => ({
      url: `${base}/countries/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
