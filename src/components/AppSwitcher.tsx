import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { authStorage } from "@/lib/auth";
import { apps } from "@/lib/apps-config";
import { usePermissions } from "@/hooks/usePermissions";
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
  const { canViewModule } = usePermissions();

  const filteredApps = apps.filter((app) => {
    if (!app.requiredModule) return true;
    return canViewModule(app.requiredModule);
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
          className="h-10 w-10 rounded-full text-white hover:bg-white/10 hover:scale-105 transition"
        >
          <LayoutGrid className="h-5 w-5 text-white" />
          <span className="sr-only">App switcher</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[340px] p-4 rounded-2xl border border-white/20 bg-[#04160e]/90 backdrop-blur-xl shadow-2xl text-white"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-2">
          <h3 className="text-sm font-semibold px-2 text-white/70">
            Slate AI Apps
          </h3>

          <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {filteredApps.map((app) => (
              <TooltipProvider key={app.route}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleAppClick(app.route)}
                      className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-white/10 hover:scale-[1.03] active:scale-95 transition-all group"
                    >
                      <div className="h-12 w-12 rounded-full bg-green-600/20 flex items-center justify-center mb-2 group-hover:bg-green-600/40 transition">
                        <app.icon className="h-6 w-6 text-green-400 group-hover:text-green-300 transition" />
                      </div>
                      <span className="text-xs text-center font-medium text-white line-clamp-2">
                        {app.name}
                      </span>
                    </button>
                  </TooltipTrigger>

                  <TooltipContent
                    side="bottom"
                    className="text-white bg-black/80 border border-white/20 backdrop-blur-md"
                  >
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
