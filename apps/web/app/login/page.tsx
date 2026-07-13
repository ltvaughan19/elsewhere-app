"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { loadPlan } from "@/lib/plan-store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const plan = loadPlan();
    if (plan && (!email || plan.email === email)) {
      router.push(plan.onboardingCompleted ? "/app/dashboard" : "/app/onboarding");
      return;
    }
    router.push("/signup");
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Log in</h1>
      <p className="mt-4 text-navy-800/80">
        Demo mode: use the email from this device&apos;s saved plan.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-sand-200 px-4 py-3"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-jungle-600 py-3 font-medium text-white"
        >
          Continue
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/signup" className="text-jungle-600">
          Create account
        </Link>
      </p>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
