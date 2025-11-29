import { Bell, CheckCircle, CircleDot } from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, bumpBell, flashNewId, setDropdownOpen, markAsRead } = useNotifications();

  const onOpenChange = (open: boolean) => setDropdownOpen(open);

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-all",
            bumpBell && "ring-2 ring-green-400",
            "hover:bg-accent hover:text-accent-foreground"
          )}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[20px] px-1 rounded-full bg-green-500 text-white text-xs font-semibold flex items-center justify-center shadow"
            >
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[360px] max-h-[70vh] overflow-auto bg-background" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Button variant="ghost" size="sm" onClick={() => navigate("/notifications")}>View all</Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">No notifications yet</div>
        )}
        {notifications.map((n) => (
          <DropdownMenuItem
            key={n.id}
            onClick={() => markAsRead(n.id)}
            className={cn(
              "flex items-start gap-3 py-3 cursor-pointer",
              flashNewId === n.id && "bg-green-500/10",
              !n.is_read ? "font-medium" : ""
            )}
          >
            {!n.is_read ? (
              <CircleDot className="h-4 w-4 text-green-500 mt-0.5" />
            ) : (
              <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            )}
            <div className="grid gap-1">
              <div className="text-sm">{n.title}</div>
              <div className="text-xs text-muted-foreground">{n.message}</div>
              <div className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

