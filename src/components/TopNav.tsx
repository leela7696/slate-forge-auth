import { ProfileMenu } from "./ProfileMenu";
import { AppSwitcher } from "./AppSwitcher";

export function TopNav() {
  return (
    <div
      className="
        h-16 sticky top-0 z-50
        bg-[#04160e]/85 backdrop-blur-xl 
        border-b border-green-500/20
        shadow-[0_0_20px_rgba(0,255,150,0.08)]
        flex items-center
      "
    >
      <div className="flex h-full items-center justify-between w-full px-6">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/slateai-logo.png"
            alt="Slate AI"
            className="
              h-10 w-auto select-none
              transition-all duration-300
              hover:scale-110 hover:drop-shadow-[0_0_10px_rgba(0,255,150,0.5)]
              cursor-pointer
            "
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
