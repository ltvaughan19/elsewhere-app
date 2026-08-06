import { AppDashboard } from "@/components/app-dashboard";
import { getPublishedPhilippinesSundayAction } from "@/lib/sunday-action";

export default async function DashboardPage() {
  const sundayAction = await getPublishedPhilippinesSundayAction();
  return <AppDashboard sundayAction={sundayAction} />;
}
