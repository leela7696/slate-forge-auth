import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/auth";
import { format } from "date-fns";
import { Pencil, Trash2, Plus } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  department: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string;
  profile_picture_url: string | null;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<string[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const apiRole = roleFilter && roleFilter !== "__all__" ? roleFilter : "";
      const apiStatus = statusFilter && statusFilter !== "__all__" ? statusFilter : "";
      const data = await callEdgeFunction("get-users", {
        search,
        role: apiRole,
        status: apiStatus,
        page,
        limit,
      });
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await callEdgeFunction("get-roles");
      const names = Array.isArray(data?.roles) ? data.roles.map((r: any) => r?.name).filter(Boolean) : [];
      setRoles(names);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await callEdgeFunction("assign-user-role", { userId, role: newRole });
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update user role");
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await callEdgeFunction("update-user-status", { userId, status: newStatus });
      toast.success(`User status set to ${newStatus}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const handleAddUser = async (form: { name: string; email: string; password: string; role: string; status: string; }) => {
    try {
      await callEdgeFunction("create-user", form);
      toast.success("User created successfully");
      setAddOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create user");
    }
  };

  const handleEditUser = async (updates: { name?: string; email?: string; role?: string; status?: string; }) => {
    if (!editingUser) return;
    try {
      await callEdgeFunction("update-user", { userId: editingUser.id, ...updates });
      toast.success("User updated successfully");
      setEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await callEdgeFunction("delete-user", { userId: deletingUser.id });
      toast.success("User deleted successfully");
      setDeleteOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete user");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    // Custom color mapping via className for clarity
    switch (role) {
      case "System Admin":
        return "bg-purple-600 text-white";
      case "Admin":
        return "bg-red-600 text-white";
      case "Manager":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const safeFormatDate = (value: string | null | undefined, fmt: string) => {
    try {
      if (!value) return "—";
      const d = new Date(value);
      if (isNaN(d.getTime())) return "—";
      return format(d, fmt);
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <TopNav />
            <main className="flex-1 flex items-center justify-center">
              <p>Loading users...</p>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <ErrorBoundary>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <TopNav />
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground mt-2">
                  Manage users and assign roles across your organization
                </p>
              </div>
              {/* Controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                  />
                  <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Roles</SelectItem>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" onClick={() => { setPage(1); fetchUsers(); }}>Apply</Button>
                </div>
                <div className="flex gap-2">
                  <Select value={String(limit)} onValueChange={(v) => { setLimit(parseInt(v, 10)); setPage(1); fetchUsers(); }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(users) ? users : []).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profile_picture_url || undefined} />
                              <AvatarFallback>
                                {(user.name || user.email || "U")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Array.isArray(roles) ? roles : []).map((r) => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.department || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Badge variant={getStatusBadgeVariant(user.status)}>
                              {user.status}
                            </Badge>
                            <Switch
                              checked={user.status === "active"}
                              onCheckedChange={() => handleStatusToggle(user.id, user.status)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.last_login_at ? safeFormatDate(user.last_login_at, "MMM d, yyyy") : "Never"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {safeFormatDate(user.created_at, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setEditingUser(user); setEditOpen(true); }}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => { setDeletingUser(user); setDeleteOpen(true); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(users.length > 0) ? ( (page - 1) * limit + 1 ) : 0}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); fetchUsers(); }}>Previous</Button>
                  <Button variant="outline" disabled={(page * limit) >= total} onClick={() => { setPage((p) => p + 1); fetchUsers(); }}>Next</Button>
                </div>
              </div>

              {/* Add User Dialog */}
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>Fill in details to create a new user</DialogDescription>
                  </DialogHeader>
                  <AddEditForm roles={roles} onSubmit={handleAddUser} onCancel={() => setAddOpen(false)} />
                </DialogContent>
              </Dialog>

              {/* Edit User Dialog */}
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>Update user details</DialogDescription>
                  </DialogHeader>
                  {editingUser && (
                    <AddEditForm
                      roles={roles}
                      initial={{ name: editingUser.name, email: editingUser.email, role: editingUser.role, status: editingUser.status }}
                      onSubmit={(v) => handleEditUser(v)}
                      onCancel={() => { setEditOpen(false); setEditingUser(null); }}
                    />
                  )}
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>Are you sure you want to delete this user? This is a soft delete.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeletingUser(null); }}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteUser}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </SidebarProvider>
  );
}

interface AddEditFormProps {
  roles: string[];
  initial?: { name: string; email: string; role: string; status: string };
  onSubmit: (form: { name: string; email: string; password?: string; role: string; status: string }) => void;
  onCancel: () => void;
}

function AddEditForm({ roles, initial, onSubmit, onCancel }: AddEditFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initial?.role ?? roles[0] ?? "User");
  const [status, setStatus] = useState(initial?.status ?? "active");

  const isEdit = !!initial;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        </div>
        {!isEdit && (
          <div className="space-y-2">
            <label className="text-sm">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password" />
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm">Role</label>
          <Select value={role} onValueChange={(v) => setRole(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(roles) ? roles : []).map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ name, email, ...(isEdit ? {} : { password }), role, status })}>
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </DialogFooter>
    </div>
  );
}
