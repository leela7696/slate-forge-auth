import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/auth";

interface Role {
  id: number;
  name: string;
}

interface Permission {
  id: number;
  role_id: number;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const MODULES = [
  "Dashboard",
  "Profile",
  "User Management",
  "Audit Logs",
  "RBAC",
  "Analytics",
  "Settings",
  "Notifications Broadcast",
];

export function PermissionsGrid() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchPermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const fetchRoles = async () => {
    try {
      const data = await callEdgeFunction("get-roles");
      setRoles(data.roles);
      if (data.roles.length > 0) {
        setSelectedRoleId(data.roles[0].id.toString());
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch roles");
    }
  };

  const fetchPermissions = async (roleId: string) => {
    setLoading(true);
    try {
      const data = await callEdgeFunction("get-permissions", { roleId });
      
      // Create a map of existing permissions
      const permMap = new Map(
        (data.permissions as Permission[]).map((p) => [p.module, p])
      );
      
      // Ensure all modules have permissions
      const allPermissions: Permission[] = MODULES.map((module) => {
        if (permMap.has(module)) {
          return permMap.get(module)!;
        }
        // Create default permission structure for missing modules
        return {
          id: 0, // 0 indicates new permission
          role_id: parseInt(roleId),
          module,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
        } as Permission;
      });
      
      setPermissions(allPermissions);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (module: string, field: keyof Permission, value: boolean) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        perm.module === module ? { ...perm, [field]: value } : perm
      )
    );
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    
    setSaving(true);
    try {
      await callEdgeFunction("update-permissions", {
        roleId: parseInt(selectedRoleId),
        permissions: permissions.map(p => ({
          id: p.id || undefined,
          module: p.module,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        })),
      });

      toast.success("Permissions updated successfully");
      fetchPermissions(selectedRoleId);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Configure module-level permissions for each role
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !selectedRoleId} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Select Role:</label>
        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">Loading permissions...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Module</TableHead>
                <TableHead className="text-center">View</TableHead>
                <TableHead className="text-center">Create</TableHead>
                <TableHead className="text-center">Edit</TableHead>
                <TableHead className="text-center">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm) => (
                <TableRow key={perm.module}>
                  <TableCell className="font-medium">{perm.module}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={perm.can_view}
                        onCheckedChange={(checked) =>
                          updatePermission(perm.module, "can_view", checked)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={perm.can_create}
                        onCheckedChange={(checked) =>
                          updatePermission(perm.module, "can_create", checked)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={perm.can_edit}
                        onCheckedChange={(checked) =>
                          updatePermission(perm.module, "can_edit", checked)
                        }
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={perm.can_delete}
                        onCheckedChange={(checked) =>
                          updatePermission(perm.module, "can_delete", checked)
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
