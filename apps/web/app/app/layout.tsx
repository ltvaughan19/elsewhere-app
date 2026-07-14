import { AppSidebar } from "@/components/app-sidebar";
import { TrustDisclaimer } from "@expat-atlas/ui";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-void md:flex-row">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <div className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</div>
        <div className="border-t border-sand-200 px-4 py-4 md:px-8">
          <TrustDisclaimer className="text-xs" />
        </div>
      </div>
    </div>
  );
}
