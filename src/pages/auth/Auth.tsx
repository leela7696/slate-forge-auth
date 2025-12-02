import { useMemo, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

// Validation regex constants
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .regex(EMAIL_REGEX, "Please enter a valid email address"),
});

const loginSchema = z.object({
  email: z.string().trim().regex(EMAIL_REGEX, "Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z
  .object({
    email: z.string().trim().regex(EMAIL_REGEX, "Please enter a valid email address"),
    password: z
      .string()
      .regex(
        STRONG_PASSWORD_REGEX,
        "Password must be at least 8 characters and include upper/lowercase, number and special character."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
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
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Password strength and checklist derived values
  const passwordValue = signupForm.watch("password") || "";
  const checks = {
    upper: /[A-Z]/.test(passwordValue),
    lower: /[a-z]/.test(passwordValue),
    number: /\d/.test(passwordValue),
    special: /[!@#$%^&*]/.test(passwordValue),
    length: passwordValue.length >= 8,
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const strengthValue = Math.round((passedCount / 5) * 100);
  const strengthLabel = passedCount <= 2 ? "Weak" : passedCount === 3 || passedCount === 4 ? "Medium" : "Strong";

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
                <Button className="w-full bg-green-600 hover:bg-green-500" disabled={isLoading || !emailForm.formState.isValid}>
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

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="bg-black/20 border-white/30"
                              {...field}
                            />
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80">
                          <div className="space-y-3 text-sm">
                            <div className="font-medium">Password requirements</div>
                            <ul className="space-y-2">
                              <li className="flex items-center gap-2">
                                {checks.upper ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                <span>Uppercase</span>
                              </li>
                              <li className="flex items-center gap-2">
                                {checks.lower ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                <span>Lowercase</span>
                              </li>
                              <li className="flex items-center gap-2">
                                {checks.number ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                <span>Number</span>
                              </li>
                              <li className="flex items-center gap-2">
                                {checks.special ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                <span>Special character</span>
                              </li>
                              <li className="flex items-center gap-2">
                                {checks.length ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                <span>8+ Characters</span>
                              </li>
                            </ul>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Strength</span>
                                <span className={passedCount === 5 ? "text-green-500" : passedCount >= 3 ? "text-yellow-400" : "text-red-500"}>{strengthLabel}</span>
                              </div>
                              <Progress value={strengthValue} />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-black/20 border-white/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button className="w-full bg-transparent text-white border border-white/40 hover:border-white hover:bg-white/10 backdrop-blur transition-all" disabled={isLoading || !signupForm.formState.isValid}>
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
