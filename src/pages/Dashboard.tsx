import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { authStorage, callEdgeFunction } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, FileText, TrendingUp, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ProfileCompletionModal } from "@/components/ProfileCompletionModal";
import { ProfileCompletionReminder } from "@/components/ProfileCompletionReminder";
import { calculateProfileCompletion, shouldShowProfileCompletionPopup } from "@/lib/profile-completion";
import { formatDistanceToNow } from "date-fns";
import { CookieConsentDialog } from "@/components/CookieConsentDialog";

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

  // Dashboard metrics state
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeSessionsToday, setActiveSessionsToday] = useState<number>(0);
  const [auditEvents30d, setAuditEvents30d] = useState<number>(0);
  const [growthPercent, setGrowthPercent] = useState<number>(0);

  // Recent activity
  type AuditLog = {
    id: string;
    actor_email: string | null;
    action: string;
    module: string;
    success: boolean;
    created_at: string;
    target_summary?: string | null;
  };
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  // Quick stats
  const [adminUsersCount, setAdminUsersCount] = useState<number>(0);
  const [standardUsersCount, setStandardUsersCount] = useState<number>(0);
  const [failedLoginsToday, setFailedLoginsToday] = useState<number>(0);

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

  useEffect(() => {
    // Fetch dashboard metrics and activity
    const fetchAll = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        // Helpers for date ranges
        const now = new Date();
        const isoNow = now.toISOString();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const isoStartOfToday = startOfToday.toISOString();
        const start30DaysAgo = new Date();
        start30DaysAgo.setDate(start30DaysAgo.getDate() - 30);
        const isoStart30DaysAgo = start30DaysAgo.toISOString();
        const start7DaysAgo = new Date();
        start7DaysAgo.setDate(start7DaysAgo.getDate() - 7);
        const isoStart7DaysAgo = start7DaysAgo.toISOString();
        const start14DaysAgo = new Date();
        start14DaysAgo.setDate(start14DaysAgo.getDate() - 14);
        const isoStart14DaysAgo = start14DaysAgo.toISOString();

        // Total users (use get-users count)
        const usersParams = new URLSearchParams({ page: "1", limit: "1" });
        const usersData = await callEdgeFunction(`get-users?${usersParams.toString()}`);
        setTotalUsers(usersData?.total || 0);

        // Active sessions today = count of USER_LOGIN logs today
        const loginParams = new URLSearchParams({
          page: "1",
          pageSize: "1",
          action: "USER_LOGIN",
          startDate: isoStartOfToday,
          endDate: isoNow,
        });
        const loginData = await callEdgeFunction(`get-audit-logs?${loginParams.toString()}`);
        setActiveSessionsToday(loginData?.total || 0);

        // Audit events (last 30 days)
        const audits30Params = new URLSearchParams({
          page: "1",
          pageSize: "1",
          startDate: isoStart30DaysAgo,
          endDate: isoNow,
        });
        const audits30Data = await callEdgeFunction(`get-audit-logs?${audits30Params.toString()}`);
        setAuditEvents30d(audits30Data?.total || 0);

        // Growth = new users last 7d vs previous 7d
        const createdPrevParams = new URLSearchParams({
          page: "1",
          pageSize: "1",
          action: "USER_CREATED",
          startDate: isoStart14DaysAgo,
          endDate: isoStart7DaysAgo,
        });
        const createdPrevData = await callEdgeFunction(`get-audit-logs?${createdPrevParams.toString()}`);
        const prevCount = createdPrevData?.total || 0;

        const createdCurParams = new URLSearchParams({
          page: "1",
          pageSize: "1",
          action: "USER_CREATED",
          startDate: isoStart7DaysAgo,
          endDate: isoNow,
        });
        const createdCurData = await callEdgeFunction(`get-audit-logs?${createdCurParams.toString()}`);
        const curCount = createdCurData?.total || 0;
        const growth = prevCount === 0 ? (curCount > 0 ? 100 : 0) : ((curCount - prevCount) / prevCount) * 100;
        setGrowthPercent(Number.isFinite(growth) ? Math.round(growth * 10) / 10 : 0);

        // Recent activity (latest 5 logs)
        const recentParams = new URLSearchParams({ page: "1", pageSize: "5" });
        const recentData = await callEdgeFunction(`get-audit-logs?${recentParams.toString()}`);
        setRecentActivity(recentData?.logs || []);

        // Quick stats
        // Admin users (Admin + System Admin)
        const adminParams = new URLSearchParams({ page: "1", limit: "1", role: "Admin" });
        const sysAdminParams = new URLSearchParams({ page: "1", limit: "1", role: "System Admin" });
        const [adminData, sysAdminData] = await Promise.all([
          callEdgeFunction(`get-users?${adminParams.toString()}`),
          callEdgeFunction(`get-users?${sysAdminParams.toString()}`),
        ]);
        setAdminUsersCount((adminData?.total || 0) + (sysAdminData?.total || 0));

        // Standard users (role: User)
        const userRoleParams = new URLSearchParams({ page: "1", limit: "1", role: "User" });
        const stdUsersData = await callEdgeFunction(`get-users?${userRoleParams.toString()}`);
        setStandardUsersCount(stdUsersData?.total || 0);

        // Failed logins today
        const failedParams = new URLSearchParams({
          page: "1",
          pageSize: "1",
          action: "USER_LOGIN_FAILED",
          startDate: isoStartOfToday,
          endDate: isoNow,
        });
        const failedData = await callEdgeFunction(`get-audit-logs?${failedParams.toString()}`);
        setFailedLoginsToday(failedData?.total || 0);
      } catch (err: any) {
        console.error("Failed to load dashboard data", err);
        setStatsError(err?.message || "Failed to load dashboard data");
      } finally {
        setStatsLoading(false);
      }
    };
    fetchAll();
  }, []);

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
                { title: "Total Users", value: statsLoading ? "—" : totalUsers.toLocaleString(), change: statsLoading ? "Loading…" : "Organization total", icon: Users },
                { title: "Active Sessions", value: statsLoading ? "—" : activeSessionsToday.toLocaleString(), change: statsLoading ? "Loading…" : "Logins today", icon: Activity },
                { title: "Audit Events", value: statsLoading ? "—" : auditEvents30d.toLocaleString(), change: statsLoading ? "Loading…" : "Last 30 days", icon: FileText },
                { title: "Growth", value: statsLoading ? "—" : `${growthPercent}%`, change: statsLoading ? "Loading…" : "New users vs prev 7d", icon: TrendingUp },
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
                    {recentActivity.length === 0 && (
                      <p className="text-sm text-muted-foreground">{statsLoading ? "Loading activity…" : "No recent activity"}</p>
                    )}
                    {recentActivity.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition">
                        <div className={`w-2 h-2 rounded-full mt-2 ${log.success ? "bg-green-400" : "bg-destructive"}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {log.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.actor_email || "system"} • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
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
                      ["Admin Users", statsLoading ? "—" : adminUsersCount.toLocaleString()],
                      ["Standard Users", statsLoading ? "—" : standardUsersCount.toLocaleString()],
                      ["Active Today", statsLoading ? "—" : activeSessionsToday.toLocaleString()],
                      ["Failed Logins", statsLoading ? "—" : failedLoginsToday.toLocaleString()],
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
      {/* Cookie Consent Dialog mount on dashboard (shows if no choice yet) */}
      <CookieConsentDialog />
    </div>
  );
}
