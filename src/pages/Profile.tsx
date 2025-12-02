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

// Validation regexes
const NAME_REGEX = /^[A-Za-z\s]+$/;
const DESIGNATION_REGEX = /^[A-Za-z\s]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/; // India format: starts with 6-9, total 10 digits

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Please enter a valid name — only letters and spaces are allowed.")
    .regex(NAME_REGEX, "Please enter a valid name — only letters and spaces are allowed."),
  phone: z
    .string()
    .trim()
    .regex(MOBILE_REGEX, "Please enter a valid 10-digit mobile number."),
  department: z
    .string()
    .trim()
    .min(2, "Please enter a valid designation.")
    .regex(DESIGNATION_REGEX, "Please enter a valid designation."),
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
    mode: "onChange",
    defaultValues: {
      name: (user?.name || "").trim(),
      phone: ((user as any)?.phone || "").toString().trim(),
      department: ((user as any)?.department || "").trim(),
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
        name: data.name.trim(),
        phone: data.phone.trim(),
        department: data.department.trim(),
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

  const onInvalid = (errors: any) => {
    const firstErrorField = Object.keys(errors)[0] as keyof ProfileForm | undefined;
    if (firstErrorField) {
      form.setFocus(firstErrorField);
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
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                const onlyLettersSpaces = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                field.onChange(onlyLettersSpaces);
                              }}
                              onBlur={(e) => field.onChange(e.target.value.trim())}
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="10-digit mobile number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                onKeyDown={(e) => {
                                  const allowed = [
                                    "Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"
                                  ];
                                  if (allowed.includes(e.key)) return;
                                  if (!/^[0-9]$/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={(e) => {
                                  const digitsOnly = e.target.value.replace(/\D/g, "");
                                  field.onChange(digitsOnly);
                                }}
                                onBlur={(e) => field.onChange(e.target.value.trim())}
                                maxLength={10}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="department" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Designation</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) => {
                                  const onlyLettersSpaces = e.target.value.replace(/[^A-Za-z\s]/g, "");
                                  field.onChange(onlyLettersSpaces);
                                }}
                                onBlur={(e) => field.onChange(e.target.value.trim())}
                                autoComplete="organization-title"
                                placeholder="e.g., Software Engineer"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                       <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full sm:w-auto">
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
