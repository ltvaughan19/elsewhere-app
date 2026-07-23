import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { Enums } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = Enums<"staff_role">;

export type StaffSession = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  role: StaffRole;
  aal: "aal1" | "aal2";
};

const ALL_STAFF_ROLES: readonly StaffRole[] = [
  "editor",
  "reviewer",
  "publisher",
  "admin",
];

type StaffLookup =
  | { kind: "anonymous" }
  | { kind: "signed_in_not_staff"; userId: string }
  | { kind: "staff"; session: StaffSession };

const getCachedStaffLookup = cache(async (): Promise<StaffLookup> => {
  if (!isSupabaseConfigured()) return { kind: "anonymous" };

  const supabase = await createClient();
  // Prefer getUser() for identity — after MFA step-up, client cookies can be
  // valid while getClaims()-only checks briefly fail and cause /admin↔/login loops.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { kind: "anonymous" };

  const { data: membership, error: membershipError } = await supabase
    .from("staff_memberships")
    .select("role, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (membershipError || !membership) {
    return { kind: "signed_in_not_staff", userId: user.id };
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const aal = claimsData?.claims?.aal === "aal2" ? "aal2" : "aal1";

  return {
    kind: "staff",
    session: {
      supabase,
      userId: user.id,
      role: membership.role,
      aal,
    },
  };
});

export async function getStaffSession(): Promise<StaffSession | null> {
  const lookup = await getCachedStaffLookup();
  return lookup.kind === "staff" ? lookup.session : null;
}

export async function requireStaffSession(
  allowedRoles: readonly StaffRole[] = ALL_STAFF_ROLES,
): Promise<StaffSession> {
  const lookup = await getCachedStaffLookup();

  if (lookup.kind === "anonymous") {
    redirect("/login?next=%2Fadmin");
  }

  if (lookup.kind === "signed_in_not_staff") {
    redirect("/app/dashboard?notice=staff-access-required");
  }

  if (!allowedRoles.includes(lookup.session.role)) {
    redirect("/app/dashboard?notice=staff-access-required");
  }

  return lookup.session;
}
