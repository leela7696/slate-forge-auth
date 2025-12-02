import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings, HelpCircle } from "lucide-react";
import { authStorage, authHelpers } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function ProfileMenu() {
  const navigate = useNavigate();
  const user = authStorage.getUser();

  const handleLogout = () => {
    authHelpers.logout();
    toast({
      title: "Logged out successfully",
      description: "See you soon!",
    });
    navigate("/auth");
  };

  const getInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.name?.trim() || "Complete your profile";
  const isNameMissing = !user?.name?.trim();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="
            relative h-10 w-10 rounded-full 
            hover:bg-accent hover:ring-2 hover:ring-ring
            transition-all
          "
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profile_picture_url || ""} alt={user?.name || "User"} />
            <AvatarFallback
              className="
                bg-primary/15 text-primary font-semibold
              "
            >
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="
          w-80 p-4 rounded-2xl
          bg-popover text-popover-foreground backdrop-blur-xl
          border border-border
          shadow-[0_0_30px_rgba(34,197,94,0.08)]
        "
        align="end"
        sideOffset={8}
      >
        {/* Top Header Section */}
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-20 w-20 border-2 border-border shadow-md">
            <AvatarImage src={user?.profile_picture_url || ""} alt={user?.name || "User"} />
            <AvatarFallback className="bg-primary/15 text-primary text-2xl font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center space-y-1">
            <p
              className={`
                font-semibold text-lg 
                ${isNameMissing ? "text-muted-foreground italic" : "text-foreground"}
              `}
            >
              {displayName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>

            {user?.role && (
              <p className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full inline-block border border-primary/20">
                {user.role}
              </p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border" />

        {/* Menu Buttons */}
        <DropdownMenuItem
          onClick={() => navigate("/profile")}
          className="
            cursor-pointer py-3 rounded-md
            hover:bg-accent hover:text-accent-foreground
          "
        >
          <User className="mr-3 h-4 w-4 text-muted-foreground" />
          <span>Manage Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate("/settings")}
          className="
            cursor-pointer py-3 rounded-md
            hover:bg-accent hover:text-accent-foreground
          "
        >
          <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="
            cursor-pointer py-3 rounded-md
            hover:bg-accent hover:text-accent-foreground
          "
        >
          <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border my-1" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="
            cursor-pointer py-3 rounded-md
            text-destructive hover:text-destructive hover:bg-destructive/10
          "
        >
          <LogOut className="mr-3 h-4 w-4 text-destructive" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
