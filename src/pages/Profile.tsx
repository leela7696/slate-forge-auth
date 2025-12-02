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
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { TopNav } from "@/components/TopNav";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const [user, setUser] = useState(authStorage.getUser());
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === "expanded";
  const ToggleIcon = isExpanded ? PanelLeftClose : PanelLeftOpen;
  const profileCompletion = calculateProfileCompletion(user);

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

  const handleProfilePictureUpdate = async (url: string) => {
    try {
      const result = await callEdgeFunction('update-profile', {
        profile_picture_url: url,
      });

      const updatedUser = { ...user, ...result.user };
      authStorage.setUser(updatedUser as any);
      setUser(updatedUser as any);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile picture");
    }
  };

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
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1 w-full">
        <TopNav />
        <main className="flex-1 p-8 bg-gradient-to-br from-background via-secondary/10 to-background">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-primary/20 shadow-sm"
                onClick={toggleSidebar}
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ToggleIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account settings and personal information</p>
              </div>
            </div>

            {user && <ProfileCard user={user} />}
            
            <ProfileCompletionBar completion={profileCompletion} />

            <Separator className="my-8" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-md flex items-center justify-center">
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

              <Card className="lg:col-span-2 shadow-md">
                <CardHeader className="bg-muted/30">
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
                       <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                         {isLoading ? "Saving..." : "Save Changes"}
                       </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              
            </div>
          </div>
        </main>
      </div>

      
    </div>
  );
}
