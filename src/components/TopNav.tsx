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

        {/* Right Section */}
        <div className="flex items-center gap-3">

          {/* Animated divider */}
          <div className="hidden md:block w-px h-6 bg-green-500/30" />

          {/* App Switcher */}
          <AppSwitcher />

          {/* Profile Menu */}
          <ProfileMenu />
        </div>
      </div>

      {/* Animated neon bottom glow */}
      <div
        className="
          absolute bottom-0 left-0 w-full h-[2px]
          bg-gradient-to-r from-transparent via-green-400 to-transparent
          opacity-60 animate-pulse
        "
      />
    </div>
  );
}
