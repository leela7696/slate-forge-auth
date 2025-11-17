import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { authStorage, callEdgeFunction } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChangeEmailModal } from "@/components/ChangeEmailModal";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { Mail, Lock, User, Calendar } from "lucide-react";
import { format } from "date-fns";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().max(15, "Phone number is too long").optional(),
  department: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [user, setUser] = useState(authStorage.getUser());

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: "",
      department: "",
    },
  });

  const fetchUserData = async () => {
    const userData = authStorage.getUser();
    setUser(userData);
    if (userData) {
      form.reset({
        name: userData.name,
        phone: (userData as any).phone || "",
        department: (userData as any).department || "",
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const result = await callEdgeFunction('update-profile', {
        name: data.name,
        phone: data.phone,
        department: data.department,
      });

      const updatedUser = { ...user, ...result.user };
      authStorage.setUser(updatedUser as any);
      setUser(updatedUser as any);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-gradient-to-br from-background via-secondary/10 to-background">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account settings and personal information</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl><Input {...field} placeholder="Optional" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="department" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Designation</FormLabel>
                            <FormControl><Input {...field} placeholder="Optional" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>Your current account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Role</p>
                      <Badge variant="secondary">{user?.role}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-muted-foreground">
                        {(user as any)?.created_at ? format(new Date((user as any).created_at), 'PPP') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setShowEmailModal(true)}>
                    <Mail className="mr-2 h-4 w-4" />Change Email Address
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setShowPasswordModal(true)}>
                    <Lock className="mr-2 h-4 w-4" />Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <ChangeEmailModal open={showEmailModal} onOpenChange={setShowEmailModal} currentEmail={user?.email || ""} onSuccess={fetchUserData} />
      <ChangePasswordModal open={showPasswordModal} onOpenChange={setShowPasswordModal} onSuccess={() => toast.success("Password changed successfully")} />
    </SidebarProvider>
  );
}