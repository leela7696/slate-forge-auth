import { useEffect, useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { callEdgeFunction } from "@/lib/auth";
import { toast } from "sonner";

type TargetType = "all" | "role" | "user";

interface ListedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function NotificationsBroadcast() {
  return (
    <SidebarProvider>
      <BroadcastContent />
    </SidebarProvider>
  );
}

function BroadcastContent() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [userSearch, setUserSearch] = useState<string>("");
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await callEdgeFunction("get-roles");
        setRoles((data.roles || []).map((r: any) => r.name));
      } catch (err) {
        // Fallback
        setRoles(["System Admin", "Admin", "Manager", "User"]);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      if (targetType !== "user") return;
      const qp = new URLSearchParams();
      if (userSearch) qp.set("search", userSearch);
      qp.set("status", "active");
      qp.set("limit", "20");
      try {
        const data = await callEdgeFunction("get-users", qp);
        const list: ListedUser[] = (data.users || []).map((u: any) => ({
          id: String(u.id),
          name: String(u.name || u.email || "Unknown"),
          email: String(u.email || ""),
          role: String(u.role || "")
        }));
        setUsers(list);
      } catch (err) {
        // Silent fail; selection optional
      }
    };
    loadUsers();
    return () => controller.abort();
  }, [targetType, userSearch]);

  const canSend = useMemo(() => {
    if (!title.trim() || !message.trim()) return false;
    if (targetType === "role" && !selectedRole) return false;
    if (targetType === "user" && !selectedUserId) return false;
    return true;
  }, [title, message, targetType, selectedRole, selectedUserId]);

  const handlePreview = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide a title and message");
      return;
    }
    if (targetType === "role" && !selectedRole) {
      toast.error("Please select a role");
      return;
    }
    if (targetType === "user" && !selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    setLoadingPreview(true);
    setPreviewCount(null);
    try {
      const data = await callEdgeFunction("broadcast-notifications", {
        method: "PREVIEW",
        title: title.trim(),
        message: message.trim(),
        targetType,
        roleName: targetType === "role" ? selectedRole : undefined,
        userId: targetType === "user" ? selectedUserId : undefined,
      });
      setPreviewCount(Number(data?.recipientsCount ?? 0));
    } catch (err: any) {
      toast.error(err?.error || err?.message || "Failed to preview recipients");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const data = await callEdgeFunction("broadcast-notifications", {
        method: "SEND",
        title: title.trim(),
        message: message.trim(),
        targetType,
        roleName: targetType === "role" ? selectedRole : undefined,
        userId: targetType === "user" ? selectedUserId : undefined,
      });
      const count = Number(data?.recipientsCount ?? 0);
      toast.success("Broadcast sent successfully");
      setPreviewCount(count);
      // Reset form minimally
      setTitle("");
      setMessage("");
      setTargetType("all");
      setSelectedRole("");
      setSelectedUserId("");
      setUserSearch("");
    } catch (err: any) {
      toast.error(err?.error || err?.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Broadcast</h1>
              <p className="text-muted-foreground mt-2">Send announcements to all users or specific groups</p>
            </div>

            <Card className="bg-card border border-border shadow-lg">
              <CardHeader>
                <CardTitle>Compose Broadcast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Announcement title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Write your announcement"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Target audience</label>
                  <RadioGroup value={targetType} onValueChange={(v) => setTargetType(v as TargetType)} className="gap-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem id="target-all" value="all" />
                      <label htmlFor="target-all" className="text-sm">All users</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem id="target-role" value="role" />
                      <label htmlFor="target-role" className="text-sm">Select role</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem id="target-user" value="user" />
                      <label htmlFor="target-user" className="text-sm">Select specific user</label>
                    </div>
                  </RadioGroup>

                  {targetType === "role" && (
                    <div className="mt-2 space-y-2">
                      <label className="text-sm">Role</label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {targetType === "user" && (
                    <div className="mt-2 space-y-2">
                      <label className="text-sm">Search user</label>
                      <Input
                        placeholder="Search by name or email"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} - {u.email} ({u.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="outline" onClick={handlePreview} disabled={loadingPreview}>
                    {loadingPreview ? "Previewing..." : "Preview recipients"}
                  </Button>
                  <Button onClick={handleSend} disabled={!canSend || sending}>
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>

                {previewCount !== null && (
                  <div className="text-sm text-muted-foreground pt-2">
                    Recipients preview: <span className="font-medium text-foreground">{previewCount}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

