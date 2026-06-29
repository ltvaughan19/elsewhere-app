"use client";

import { useEffect, useState } from "react";
import { Badge, TrustDisclaimer } from "@expat-atlas/ui";

type ItemStatus = "not_started" | "in_progress" | "done" | "blocked";

interface ChecklistItem {
  id: string;
  title: string;
  status: ItemStatus;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "eligibility", title: "Confirm you need a first-time passport", status: "not_started" },
  { id: "citizenship", title: "Gather proof of U.S. citizenship", status: "not_started" },
  { id: "id", title: "Gather government-issued photo ID", status: "not_started" },
  { id: "form", title: "Complete DS-11 application form", status: "not_started" },
  { id: "photo", title: "Get compliant passport photo", status: "not_started" },
  { id: "fees", title: "Calculate fees (check official State Dept site)", status: "not_started" },
  { id: "facility", title: "Find acceptance facility or passport agency", status: "not_started" },
  { id: "appointment", title: "Schedule appointment if required", status: "not_started" },
  { id: "submit", title: "Submit application in person (first-time)", status: "not_started" },
  { id: "track", title: "Track application status online", status: "not_started" },
];

const STORAGE_KEY = "expat-atlas-passport-checklist";

export function PassportChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw) as ChecklistItem[]);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const cycleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const order: ItemStatus[] = [
          "not_started",
          "in_progress",
          "done",
          "blocked",
        ];
        const idx = order.indexOf(item.status);
        return { ...item, status: order[(idx + 1) % order.length] };
      }),
    );
  };

  const done = items.filter((i) => i.status === "done").length;
  const progress = Math.round((done / items.length) * 100);

  const statusLabel: Record<ItemStatus, string> = {
    not_started: "Not started",
    in_progress: "In progress",
    done: "Done",
    blocked: "Blocked",
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Badge variant="demo">Planning checklist</Badge>
          <p className="mt-2 text-3xl font-semibold text-jungle-600">{progress}%</p>
          <p className="text-sm text-navy-800/70">
            {done} of {items.length} steps complete
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setItems(DEFAULT_ITEMS);
            localStorage.removeItem(STORAGE_KEY);
          }}
          className="text-sm text-navy-800/70 underline"
        >
          Reset checklist
        </button>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => cycleStatus(item.id)}
              className="flex w-full items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3 text-left transition hover:border-jungle-600/30"
            >
              <span className="text-navy-950">{item.title}</span>
              <span className="text-xs font-medium text-navy-800/70">
                {statusLabel[item.status]}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-navy-800/70">
        Tap each step to update status. Verify current fees and requirements at{" "}
        <a
          href="https://travel.state.gov/content/travel/en/passports.html"
          className="text-jungle-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          travel.state.gov
        </a>
        .
      </p>
      <TrustDisclaimer className="mt-4" />
    </div>
  );
}
