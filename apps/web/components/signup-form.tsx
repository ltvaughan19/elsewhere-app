"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { createDemoAccount, loadPlan } from "@/lib/plan-store";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    createDemoAccount(email, name);
    router.push("/app/onboarding");
  };

  const existing = typeof window !== "undefined" ? loadPlan() : null;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-jungle-600">
        Elsewhere
      </p>
      <h1 className="mt-2 font-display text-4xl text-navy-950">Create your account</h1>
      <p className="mt-4 text-navy-800/80">
        Save your plan, complete the readiness quiz, and track passport + budget steps.
      </p>
      <div className="mt-4 rounded-lg border border-gold-400/40 bg-gold-400/10 px-4 py-3 text-sm text-navy-900">
        Demo mode: accounts are stored on this device until Supabase is connected.
      </div>
      {existing?.onboardingCompleted ? (
        <p className="mt-4 text-sm">
          You already have a plan.{" "}
          <Link href="/app/dashboard" className="text-jungle-600 underline">
            Go to dashboard
          </Link>
        </p>
      ) : null}
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-navy-900">
            Display name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
            placeholder="Alex"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-navy-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-sand-200 px-4 py-3"
            placeholder="you@example.com"
          />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-jungle-600 py-3 font-medium text-white"
        >
          Continue to readiness quiz
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-navy-800/70">
        Already started?{" "}
        <Link href="/login" className="text-jungle-600">
          Log in
        </Link>
      </p>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
