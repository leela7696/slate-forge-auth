import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/lib/notifications";

export default function Settings() {
  return (
    <SidebarProvider>
      <SettingsContent />
    </SidebarProvider>
  );
}

function SettingsContent() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { soundEnabled, setSoundEnabled } = useNotifications();

  useEffect(() => setMounted(true), []);

  const effectiveTheme = mounted ? resolvedTheme : theme;

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />

        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-2">Configure your preferences and appearance</p>
            </div>

            {/* Appearance / Theme */}
            <Card className="bg-card border border-border shadow-lg">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme Mode</Label>
                  <RadioGroup
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    value={theme || "system"}
                    onValueChange={(value) => setTheme(value)}
                  >
                    <ThemeOption value="light" label="Light" Icon={Sun} active={effectiveTheme === "light"} />
                    <ThemeOption value="dark" label="Dark" Icon={Moon} active={effectiveTheme === "dark"} />
                    <ThemeOption value="system" label="System" Icon={Monitor} active={theme === "system"} />
                  </RadioGroup>
                  <p className="text-muted-foreground text-sm">
                    Your selection is saved and applies across all pages.
                    {mounted && theme === "system" && systemTheme && (
                      <> Currently detected system theme: <span className="font-medium">{systemTheme}</span>.</>
                    )}
                  </p>
                </div>

                {/* Optional: Dropdown selector for users who prefer selects */}
                <div className="space-y-2">
                  <Label>Theme (Dropdown)</Label>
                  <Select value={theme || "system"} onValueChange={(value) => setTheme(value)}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-card border border-border shadow-lg">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notification Sound</Label>
                    <p className="text-muted-foreground text-sm">Play a sound for new notifications (default: ON)</p>
                  </div>
                  <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled as any} />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

function ThemeOption({
  value,
  label,
  Icon,
  active,
}: {
  value: "light" | "dark" | "system";
  label: string;
  Icon: (props: { className?: string }) => JSX.Element;
  active?: boolean;
}) {
  return (
    <label
      className="
        flex items-center gap-3 rounded-xl border border-border bg-background p-3 cursor-pointer
        hover:bg-accent hover:text-accent-foreground transition-colors
      "
    >
      <RadioGroupItem value={value} className="mt-0.5" />
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
      {active && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
    </label>
  );
}
