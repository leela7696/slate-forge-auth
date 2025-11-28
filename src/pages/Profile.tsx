import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authStorage, callEdgeFunction } from "@/lib/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { TopNav } from "@/components/TopNav";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { ChangeEmailModal } from "@/components/ChangeEmailModal";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { Mail, Lock, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().max(15, "Phone number is too long").optional(),
  department: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  return (
    <SidebarProvider>
      <ProfileContent />
    </SidebarProvider>
  );
}

function ProfileContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [user, setUser] = useState(authStorage.getUser());
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === "expanded";
  const ToggleIcon = isExpanded ? PanelLeftClose : PanelLeftOpen;

  const profileCompletion = calculateProfileCompletion(user);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: (user as any)?.phone || "",
      department: (user as any)?.department || "",
    },
  });

  const fetchUserData = async () => {
    const updated = authStorage.getUser();
    setUser(updated);
    if (updated) {
      form.reset({
        name: updated.name,
        phone: (updated as any).phone || "",
        department: (updated as any).department || "",
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleProfilePictureUpdate = async (url: string) => {
    try {
      const result = await callEdgeFunction("update-profile", { profile_picture_url: url });
      const updated = { ...user, ...result.user };
      authStorage.setUser(updated as any);
      setUser(updated as any);
    } catch (error: any) {
      toast.error(error.message || "Failed to update picture");
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const result = await callEdgeFunction("update-profile", data);
      const updated = { ...user, ...result.user };
      authStorage.setUser(updated as any);
      setUser(updated as any);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#071d12] text-white">
      <AppSidebar />
      <div className="flex flex-col flex-1 w-full">
        <TopNav />

        <main className="flex-1 p-8 bg-[#071d12]">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-10 w-10 rounded-full border border-white/30 text-white hover:bg-white/10 transition"
              >
                <ToggleIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-white/60 mt-1">Manage your personal & account details</p>
              </div>
            </div>

            {user && <ProfileCard user={user} />}

            <ProfileCompletionBar completion={profileCompletion} />

            <Separator className="my-8 bg-white/20" />

            {/* Main layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Picture */}
              <Card className="bg-white/10 border border-white/20 shadow-lg flex items-center justify-center">
                <CardContent className="p-8">
                  {user && (
                    <ProfilePictureUpload
                      currentImageUrl={user.profile_picture_url}
                      userName={user.name}
                      onUploadSuccess={handleProfilePictureUpdate}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Personal Info */}
              <Card className="lg:col-span-2 bg-white/10 border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
            <CardDescription className="text-white/60">
                    Update your personal details here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/10 border-white/20 text-white placeholder-gray-300" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Mobile Number</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white/10 border-white/20 text-white placeholder-gray-300" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="department" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Designation</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white/10 border-white/20 text-white placeholder-gray-300" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-500 text-white shadow-green-500/30 shadow-md w-full sm:w-auto"
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="bg-white/10 border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">Security Settings</CardTitle>
            <CardDescription className="text-white/60">
                    Manage your password & email security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent text-white border-white/40 hover:bg-white/10"
                    onClick={() => setShowEmailModal(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" /> Change Email Address
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent text-white border-white/40 hover:bg-white/10"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <Lock className="mr-2 h-4 w-4" /> Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <ChangeEmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        currentEmail={user?.email || ""}
        onSuccess={fetchUserData}
      />

      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onSuccess={() => toast.success("Password changed successfully")}
      />
    </div>
  );
}
