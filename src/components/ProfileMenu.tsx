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
            hover:bg-green-600/10 hover:ring-2 hover:ring-green-500/30
            transition-all
          "
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profile_picture_url || ""} alt={user?.name || "User"} />
            <AvatarFallback
              className="
                bg-green-500/20 text-green-300 font-semibold
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
          bg-[#04160e]/85 backdrop-blur-xl
          border border-green-500/20
          shadow-lg shadow-green-500/20
          text-white
        "
        align="end"
        sideOffset={8}
      >
        {/* Top Header Section */}
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-20 w-20 border-2 border-green-500/30 shadow-green-500/20 shadow-md">
            <AvatarImage src={user?.profile_picture_url || ""} alt={user?.name || "User"} />
            <AvatarFallback className="bg-green-500/20 text-green-300 text-2xl font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center space-y-1">
            <p
              className={`
                font-semibold text-lg 
                ${isNameMissing ? "text-white/60 italic" : "text-white"}
              `}
            >
              {displayName}
            </p>
            <p className="text-sm text-white/60">{user?.email}</p>

            {user?.role && (
              <p className="text-xs font-medium bg-green-500/15 text-green-300 px-3 py-1 rounded-full inline-block border border-green-500/20">
                {user.role}
              </p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-green-500/20" />

        {/* Menu Buttons */}
        <DropdownMenuItem
          onClick={() => navigate("/profile")}
          className="
            cursor-pointer py-3 rounded-md
            hover:bg-green-600/20 hover:text-green-300
          "
        >
          <User className="mr-3 h-4 w-4 text-green-300" />
          <span>Manage Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="
            cursor-pointer py-3 rounded-md
            hover:bg-green-600/20 hover:text-green-300
          "
        >
          <Settings className="mr-3 h-4 w-4 text-green-300" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="
            cursor-pointer py-3 rounded-md
            hover:bg-green-600/20 hover:text-green-300
          "
        >
          <HelpCircle className="mr-3 h-4 w-4 text-green-300" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-green-500/20 my-1" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="
            cursor-pointer py-3 rounded-md
            text-red-400 hover:text-red-500 hover:bg-red-500/10
          "
        >
          <LogOut className="mr-3 h-4 w-4 text-red-500" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
