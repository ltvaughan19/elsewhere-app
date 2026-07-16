import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void">
      <SiteHeader />
      <AppSidebar />
      <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 sm:px-6 sm:pt-12 md:pb-16">
        {children}
      </main>
    </div>
  );
}
