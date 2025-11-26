import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopNav } from "@/components/TopNav";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { RolesTable } from "@/components/rbac/RolesTable";
import { PermissionsGrid } from "@/components/rbac/PermissionsGrid";

export default function RBAC() {
  const [activeTab, setActiveTab] = useState("roles");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Role-Based Access Control</h1>
                <p className="text-muted-foreground mt-2">
                  Manage roles, permissions, and user access across your application
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="roles">Roles</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="roles" className="space-y-4">
                  <RolesTable />
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                  <PermissionsGrid />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
