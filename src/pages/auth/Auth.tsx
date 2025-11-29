import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
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

const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
        localStorage.removeItem("user_permissions_cache");
        window.localStorage.setItem("justLoggedIn", "true");
        navigate(response.redirectTo || "/dashboard");
      }
    } catch (error: any) {
      let message = typeof error?.message === "string" ? error.message : "Invalid email or password";
      const rawBody = error?.context?.body;
      const status = error?.status ?? error?.context?.status;
      const isGenericNon2xx = typeof error?.message === "string" && error.message.toLowerCase().includes("non-2xx");
      if (typeof rawBody === "string") {
        try {
          const parsed = JSON.parse(rawBody);
          if (parsed && typeof parsed === "object") {
            if (typeof parsed.error === "string") message = parsed.error;
            else if (typeof parsed.message === "string") message = parsed.message;
          }
        } catch {}
      }
      if ((!rawBody || isGenericNon2xx) && (status === 400 || status === undefined)) {
        message = "wrong password. re-enter the password.";
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (values: SignupForm) => {
    setIsLoading(true);
    try {
      const response = await callEdgeFunction("send-otp", {
        name: values.email.split("@")[0],
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
    <div className="min-h-screen flex items-center justify-center bg-[#071d12] relative overflow-hidden px-4">

      {/* Matching Landing Glow Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[900px] h-[900px] bg-green-500/20 rounded-full blur-[200px] animate-pulse -top-40 -left-40"></div>
        <div className="absolute w-[700px] h-[700px] bg-green-700/20 rounded-full blur-[200px] animate-pulse-slow bottom-0 -right-32"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center flex flex-col items-center gap-4">

            {/* Updated Rounded Logo */}
            <img
              src="/slateai-logo.png"
              alt="Slate AI Logo"
              className="h-16 w-auto rounded-2xl shadow-green-500/20 shadow-lg hover:shadow-green-400/30 transition-all duration-300"
            />

            {mode === "email" && "Welcome to Slate AI"}
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
          </CardTitle>

          <CardDescription className="text-center text-gray-300">
            {mode === "email" && "Enter your email to continue"}
            {mode === "login" && "Sign in to your account"}
            {mode === "signup" && "Get started with Slate AI"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* EMAIL STEP */}
          {mode === "email" && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField control={emailForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" className="bg-black/20 border-white/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button className="w-full bg-green-600 hover:bg-green-500" disabled={isLoading}>
                  {isLoading ? "Checking..." : "Continue"}
                </Button>
              </form>
            </Form>
          )}

          {/* LOGIN STEP */}
          {mode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" disabled className="bg-black/20 border-white/30" {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-black/20 border-white/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-end">
                  <Link to="/auth/forgot-password" className="text-sm text-green-400 hover:text-green-300 underline">
                    Forgot password?
                  </Link>
                </div>

                {/* Transparent Sign In button like navbar */}
                <Button type="submit" className="w-full bg-transparent text-white border border-white/40 hover:border-white hover:bg-white/10 backdrop-blur transition-all" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <Button type="button" variant="ghost" className="w-full text-gray-300 hover:text-white" onClick={handleBack}>
                  Use different email
                </Button>
              </form>
            </Form>
          )}

          {/* SIGNUP STEP */}
          {mode === "signup" && (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4">
                <FormField control={signupForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" disabled className="bg-black/20 border-white/30" {...field} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={signupForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-black/20 border-white/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-black/20 border-white/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button className="w-full bg-transparent text-white border border-white/40 hover:border-white hover:bg-white/10 backdrop-blur transition-all" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>

                <Button type="button" variant="ghost" className="w-full text-gray-300 hover:text-white" onClick={handleBack}>
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
