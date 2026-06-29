import type { MetadataRoute } from "next";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

const staticRoutes = [
  "",
  "/countries",
  "/compare",
  "/visa-compass",
  "/passport-checklist",
  "/budget-calculator",
  "/trust",
  "/pricing",
  "/about",
  "/partners",
  "/become-a-partner",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
    })),
    ...SEED_COUNTRIES.map((c) => ({
      url: `${base}/countries/${c.slug}`,
      lastModified: new Date(),
    })),
  ];
}
