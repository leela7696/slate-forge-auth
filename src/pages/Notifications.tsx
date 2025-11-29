import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useNotifications } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, CircleDot } from "lucide-react";

export default function NotificationsPage() {
  return (
    <SidebarProvider>
      <NotificationsContent />
    </SidebarProvider>
  );
}

function NotificationsContent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground mt-2">Stay up to date with real-time updates</p>
              </div>
              <div className="text-sm text-muted-foreground">Unread: {unreadCount}</div>
            </div>

            <Card className="bg-card border border-border shadow-lg">
              <CardHeader>
                <CardTitle>Recent</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No notifications</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {notifications.map((n) => (
                      <li key={n.id} className="py-4 flex items-start gap-3">
                        {!n.is_read ? (
                          <CircleDot className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{n.title}</div>
                          <div className="text-sm text-muted-foreground">{n.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                        {!n.is_read && (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                            Mark read
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

