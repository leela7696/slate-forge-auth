import { ProfileMenu } from "./ProfileMenu";
import { AppSwitcher } from "./AppSwitcher";

export function TopNav() {
  return (
    <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img 
            src="/slateai-logo.png" 
            alt="Slate AI" 
            className="h-10 w-auto transition-transform duration-200 hover:scale-110 cursor-pointer"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <AppSwitcher />
          <ProfileMenu />
        </div>
      </div>
    </div>
  );
}
