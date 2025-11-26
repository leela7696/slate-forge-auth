import { TopNav } from "@/components/TopNav";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AuditLogs() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground mt-2">
                  View system activity and security events
                </p>
              </div>

              <div className="border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Audit logs viewer coming soon...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
