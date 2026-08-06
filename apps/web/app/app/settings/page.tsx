import { getStaffSession } from "@/lib/auth/staff";
import { SettingsPageClient } from "@/components/settings-page-client";

export default async function SettingsPage() {
  const staff = await getStaffSession();
  return <SettingsPageClient isStaff={Boolean(staff)} />;
}
