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

const getCachedStaffSession = cache(async (): Promise<StaffSession | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string" || !userId) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("staff_memberships")
    .select("role, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (membershipError || !membership) return null;

  return {
    supabase,
    userId,
    role: membership.role,
    aal: data.claims.aal === "aal2" ? "aal2" : "aal1",
  };
});

export async function getStaffSession(): Promise<StaffSession | null> {
  return getCachedStaffSession();
}

export async function requireStaffSession(
  allowedRoles: readonly StaffRole[] = ALL_STAFF_ROLES,
): Promise<StaffSession> {
  const session = await getCachedStaffSession();

  if (!session) {
    redirect("/login?next=%2Fadmin");
  }

  if (!allowedRoles.includes(session.role)) {
    redirect("/app/dashboard?notice=staff-access-required");
  }

  return session;
}
