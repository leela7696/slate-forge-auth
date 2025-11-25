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
          className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={user?.name || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 p-4 bg-card" 
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src="" alt={user?.name || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center space-y-1">
            <p className={`font-semibold text-lg ${isNameMissing ? "text-muted-foreground italic" : "text-foreground"}`}>
              {displayName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.role && (
              <p className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full inline-block">
                {user.role}
              </p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/profile")}
          className="cursor-pointer py-3"
        >
          <User className="mr-3 h-4 w-4" />
          <span>Manage Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer py-3">
          <Settings className="mr-3 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer py-3">
          <HelpCircle className="mr-3 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer py-3 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
