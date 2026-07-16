"use client";

import { useEffect, useMemo, useState } from "react";
import type { CountryPortalSection } from "@/lib/country-portals/types";

function statusLabel(status: CountryPortalSection["status"]): string {
  if (status === "published") return "Reviewed content available";
  if (status === "partial") return "Partial reviewed coverage";
  return "In review";
}

function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function PortalSectionNav({
  sections,
}: {
  sections: CountryPortalSection[];
}) {
  const [activeSlug, setActiveSlug] = useState(sections[0]?.slug ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.slug === activeSlug),
  );
  const activeSection = sections[activeIndex];
  const sectionSlugs = useMemo(
    () => sections.map((section) => section.slug),
    [sections],
  );

  useEffect(() => {
    const nodes = sectionSlugs
      .map((slug) => document.getElementById(slug))
      .filter((node): node is HTMLElement => node !== null);
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSlug(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.1, 0.5] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionSlugs]);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  const selectSection = (slug: string) => {
    setActiveSlug(slug);
    setMobileOpen(false);
  };

  return (
    <>
      <nav
        aria-label="Country portal sections"
        className="sticky top-[65px] z-40 -mx-5 border-y border-sand-200 bg-void/95 backdrop-blur-xl lg:hidden"
      >
        <button
          type="button"
          className="flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left"
          aria-expanded={mobileOpen}
          aria-controls="country-portal-mobile-contents"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="min-w-0">
            <span className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-soft">
              Contents · {sectionNumber(activeIndex)} of {sections.length}
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium text-cream">
              {activeSection?.title ?? "Country guide"}
            </span>
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className={`h-5 w-5 flex-none text-accent-cool transition-transform duration-180 ${
              mobileOpen ? "rotate-180" : ""
            }`}
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {mobileOpen ? (
          <div
            id="country-portal-mobile-contents"
            className="absolute inset-x-0 top-full max-h-[min(68vh,38rem)] overflow-y-auto border-b border-sand-200 bg-void-elevated px-5 py-3 shadow-ea"
          >
            <ol className="divide-y divide-sand-200">
              {sections.map((section, index) => {
                const isActive = section.slug === activeSlug;
                return (
                  <li key={section.slug}>
                    <a
                      href={`#${section.slug}`}
                      aria-current={isActive ? "location" : undefined}
                      className="grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-2 text-sm"
                      onClick={() => selectSection(section.slug)}
                    >
                      <span className="field-guide-index text-xs text-soft">
                        {sectionNumber(index)}
                      </span>
                      <span
                        className={
                          isActive ? "font-medium text-cream" : "text-navy-800"
                        }
                      >
                        {section.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${
                          section.status === "published"
                            ? "bg-success"
                            : "border border-sand-300"
                        }`}
                      />
                      <span className="sr-only">{statusLabel(section.status)}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </nav>

      <aside className="hidden lg:block">
        <nav
          aria-label="Country portal sections"
          className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-5"
        >
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <p className="elsewhere-eyebrow">Contents</p>
            <p className="field-guide-index text-[0.68rem] text-soft">
              {sectionNumber(activeIndex)} / {sections.length}
            </p>
          </div>
          <ol className="border-l border-sand-200">
            {sections.map((section, index) => {
              const isActive = section.slug === activeSlug;
              return (
                <li key={section.slug}>
                  <a
                    href={`#${section.slug}`}
                    aria-current={isActive ? "location" : undefined}
                    onClick={() => selectSection(section.slug)}
                    className={`group grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)] items-start border-l py-2 pl-3 text-sm transition-colors duration-180 ${
                      isActive
                        ? "-ml-px border-accent-cool text-cream"
                        : "border-transparent text-navy-800 hover:border-sand-300 hover:text-cream"
                    }`}
                  >
                    <span className="field-guide-index pt-0.5 text-[0.68rem] text-soft">
                      {sectionNumber(index)}
                    </span>
                    <span>{section.title}</span>
                    <span className="sr-only">
                      {`. ${statusLabel(section.status)}`}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>
    </>
  );
}
