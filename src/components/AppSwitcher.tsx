import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid3x3 } from "lucide-react";
import { authStorage } from "@/lib/auth";
import { apps } from "@/lib/apps-config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSwitcher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = authStorage.getUser();

  const filteredApps = apps.filter((app) => {
    if (!app.requiredRoles) return true;
    return user?.role && app.requiredRoles.includes(user.role);
  });

  const handleAppClick = (route: string) => {
    navigate(route);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-accent transition-colors"
        >
          <Grid3x3 className="h-5 w-5" />
          <span className="sr-only">App switcher</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-4 bg-card" 
        align="end"
        sideOffset={8}
      >
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-2">
            Slate AI Apps
          </h3>
          <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {filteredApps.map((app) => (
              <TooltipProvider key={app.route}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleAppClick(app.route)}
                      className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-accent transition-all duration-200 hover:scale-105 group"
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                        <app.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-center font-medium text-foreground line-clamp-2">
                        {app.name}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">{app.description || app.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
