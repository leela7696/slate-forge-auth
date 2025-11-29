import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { authStorage } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, FileText, TrendingUp, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ProfileCompletionModal } from "@/components/ProfileCompletionModal";
import { ProfileCompletionReminder } from "@/components/ProfileCompletionReminder";
import { calculateProfileCompletion, shouldShowProfileCompletionPopup } from "@/lib/profile-completion";

export default function Dashboard() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}

function DashboardContent() {
  const user = authStorage.getUser();
  const fallbackName = user?.email ? user.email.split("@")[0] : undefined;
  const displayName = user?.name?.trim() || fallbackName || "there";
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === "expanded";
  const ToggleIcon = isExpanded ? PanelLeftClose : PanelLeftOpen;
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileCompletion = calculateProfileCompletion(user);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("justLoggedIn") !== "true") return;

    toast({
      title: `Welcome back, ${displayName}!`,
      duration: 4000,
      className: "shadow-xl border border-green-500/20 bg-black/40 text-white",
    });

    window.localStorage.removeItem("justLoggedIn");
    
    if (!profileCompletion.isComplete && shouldShowProfileCompletionPopup()) {
      setTimeout(() => setShowProfileModal(true), 500);
    }
  }, [displayName]);

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground relative overflow-hidden">

      {/* glowing background like auth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-green-500/20 rounded-full blur-[200px] animate-pulse -top-44 -left-40" />
        <div className="absolute w-[850px] h-[850px] bg-green-700/20 rounded-full blur-[200px] animate-pulse-slow bottom-0 -right-32" />
      </div>

      <AppSidebar />
      <div className="flex flex-col flex-1 w-full">
        <TopNav />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={toggleSidebar}
                >
                  <ToggleIcon className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Welcome back, {displayName}</h1>
                  <p className="text-muted-foreground mt-1">Here’s what’s happening with your account today</p>
                </div>
              </div>
            </div>

            {!profileCompletion.isComplete && shouldShowProfileCompletionPopup() === false && (
              <ProfileCompletionReminder completion={profileCompletion} />
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Total Users", value: "1,234", change: "+12% from last month", icon: Users },
                { title: "Active Sessions", value: "89", change: "Currently online", icon: Activity },
                { title: "Audit Events", value: "3,456", change: "Last 30 days", icon: FileText },
                { title: "Growth", value: "+24.5%", change: "vs last quarter", icon: TrendingUp },
              ].map((stat, i) => (
                <Card key={i} className="bg-card border border-border shadow-xl hover:shadow-green-500/20 transition">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-5 w-5 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-sm text-muted-foreground mt-1">{stat.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Dual Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <Card className="bg-card border border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "New user registered", time: "2 minutes ago" },
                      { label: "Profile updated", time: "15 minutes ago" },
                      { label: "Security settings changed", time: "1 hour ago" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-foreground">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      ["Admin Users", "12"],
                      ["Standard Users", "1,222"],
                      ["Active Today", "342"],
                      ["Failed Logins", "7"],
                    ].map(([k, v], idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{k}</span>
                        <span className="text-sm font-medium text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <ProfileCompletionModal open={showProfileModal} onOpenChange={setShowProfileModal} />
    </div>
  );
}
