import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { callEdgeFunction, authStorage } from "@/lib/auth";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailForm = z.infer<typeof emailSchema>;
type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

type AuthMode = "email" | "login" | "signup";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const handleEmailSubmit = async (values: EmailForm) => {
    setIsLoading(true);
    try {
      const response = await callEdgeFunction("check-email", { email: values.email });

      setUserEmail(values.email);
      
      if (response.exists) {
        loginForm.setValue("email", values.email);
        setMode("login");
      } else {
        signupForm.setValue("email", values.email);
        setMode("signup");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to check email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (values: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await callEdgeFunction("login", values);

      if (response.success) {
        authStorage.setToken(response.token);
        authStorage.setUser(response.user);
        toast.success("Welcome back!");
        navigate(response.redirectTo || "/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (values: SignupForm) => {
    setIsLoading(true);
    try {
      const response = await callEdgeFunction("send-otp", {
        name: values.email.split('@')[0],
        email: values.email,
        password: values.password,
      });

      if (response.success) {
        toast.success("Verification code sent to your email!");
        navigate(`/auth/verify-otp?email=${encodeURIComponent(values.email)}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setMode("email");
    setUserEmail("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === "email" && "Welcome to Slate AI"}
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create an account"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "email" && "Enter your email to continue"}
            {mode === "login" && "Sign in to your account"}
            {mode === "signup" && "Get started with Slate AI"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "email" && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Checking..." : "Continue"}
                </Button>
              </form>
            </Form>
          )}

          {mode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={handleBack}>
                  Use different email
                </Button>
              </form>
            </Form>
          )}

          {mode === "signup" && (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={handleBack}>
                  Use different email
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
