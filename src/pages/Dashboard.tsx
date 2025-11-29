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
      className: "shadow-xl border border-primary/10 bg-background/95",
    });

    window.localStorage.removeItem("justLoggedIn");
    
    // Show profile completion modal if needed
    if (!profileCompletion.isComplete && shouldShowProfileCompletionPopup()) {
      setTimeout(() => setShowProfileModal(true), 500);
    }
  }, [displayName]);

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1 w-full">
        <TopNav />
        <main className="flex-1 p-8 bg-gradient-to-br from-background via-secondary/10 to-background">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-primary/20 shadow-sm"
                onClick={toggleSidebar}
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ToggleIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {displayName}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here's what's happening with your account today.
                </p>
              </div>
            </div>
          </div>

          {!profileCompletion.isComplete && shouldShowProfileCompletionPopup() === false && (
            <ProfileCompletionReminder completion={profileCompletion} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Sessions
                  </CardTitle>
                  <Activity className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently online
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Audit Events
                  </CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3,456</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Growth
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+24.5%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs last quarter
                  </p>
                </CardContent>
              </Card>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">New user registered</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Profile updated</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Security settings changed</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Admin Users</span>
                      <span className="text-sm font-medium">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Standard Users</span>
                      <span className="text-sm font-medium">1,222</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Today</span>
                      <span className="text-sm font-medium">342</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Failed Logins</span>
                      <span className="text-sm font-medium">7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
        </main>
      </div>
      
      <ProfileCompletionModal 
        open={showProfileModal} 
        onOpenChange={setShowProfileModal} 
      />
    </div>
  );
}