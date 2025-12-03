import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { callEdgeFunction } from "@/lib/auth";
import { Loader2, ArrowLeft } from "lucide-react";
import { isStrongPassword, STRONG_PASSWORD_MESSAGE } from "@/lib/password";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await callEdgeFunction("forgot-password", { action: "send-otp", email });
      toast({ title: "Success", description: "OTP sent to your email" });
      setStep(2);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (otp.length !== 6) return toast({ title: "Error", description: "Please enter 6-digit OTP", variant: "destructive" });
    if (!newPassword || !isStrongPassword(newPassword))
      return toast({ title: "Error", description: STRONG_PASSWORD_MESSAGE, variant: "destructive" });
    if (newPassword !== confirmPassword)
      return toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });

    setLoading(true);
    try {
      await callEdgeFunction("forgot-password", { action: "reset", email, otp, newPassword });
      toast({ title: "Success", description: "Password reset successfully" });
      navigate("/auth");
    } catch (error: any) {
      // Map backend error to a friendly message for wrong OTP and allow retry
      const rawMsg: string = String(error?.message || "Failed to reset password");
      const rawErr: string = String(error?.error || "");
      const status: number | undefined = (error?.context?.status as number | undefined);
      let bodyStr: string | undefined = undefined;
      try {
        bodyStr = typeof error?.context?.body === "string" ? error?.context?.body : undefined;
      } catch {}

      let parsedBody: any = undefined;
      if (bodyStr) {
        try { parsedBody = JSON.parse(bodyStr); } catch {}
      }

      const backendCode: string = String(parsedBody?.error || rawErr).toUpperCase();
      const isInvalidOtp = /INVALID OTP/i.test(rawMsg) || /INVALID_OTP/i.test(rawMsg) || backendCode === "INVALID OTP" || backendCode === "INVALID_OTP";
      const isExpiredOrLocked = /expired/i.test(rawMsg) || /Invalid or expired request/i.test(rawMsg) || /OTP_EXPIRED/i.test(backendCode) || /locked/i.test(rawMsg);
      const likelyGenericInvoke = /non-2xx/i.test(rawMsg) && (status === 400 || status === undefined);

      if (isInvalidOtp || likelyGenericInvoke) {
        // If backend provided attempts_left, surface it
        const attemptsLeft = parsedBody?.attempts_left;
        const suffix = typeof attemptsLeft === "number" ? ` (${attemptsLeft} attempts left)` : "";
        toast({ title: "Wrong OTP", description: `Please re-enter the 6-digit code${suffix}.`, variant: "destructive" });
        // Clear OTP to encourage re-entry, keep user on same step
        setOtp("");
      } else if (isExpiredOrLocked) {
        toast({ title: "OTP expired/locked", description: "Please request a new OTP and try again.", variant: "destructive" });
        // Suggest resending by clearing OTP; user can tap Resend OTP
        setOtp("");
      } else {
        toast({ title: "Error", description: rawMsg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">

      {/* Background Glow — Same as Landing/Auth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[950px] h-[950px] bg-green-500/20 rounded-full blur-[200px] animate-pulse -top-40 -left-40"></div>
        <div className="absolute w-[750px] h-[750px] bg-green-700/20 rounded-full blur-[200px] animate-pulse-slow bottom-0 -right-32"></div>
      </div>

      <Card className="w-full max-w-md bg-card border border-border backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="hover:bg-accent hover:text-accent-foreground transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>

          <CardTitle className="text-3xl font-bold">
            Forgot Password
          </CardTitle>

          <CardDescription>
            {step === 1
              ? "Enter your email to receive a password reset OTP"
              : "Enter the OTP and set your new password"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* STEP 1: SEND OTP */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                />
              </div>

              <Button
                onClick={sendOtp}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </div>
          )}

          {/* STEP 2: RESET PASSWORD */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input disabled value={email} />
              </div>

              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <PasswordInput
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{STRONG_PASSWORD_MESSAGE}</p>
              </div>

              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <PasswordInput
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                {/* Glass-style button */}
                <Button
                  onClick={resetPassword}
                  disabled={loading}
                  className="flex-1 bg-transparent text-foreground border border-border hover:bg-accent hover:text-accent-foreground backdrop-blur transition"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>

                <Button
                  variant="outline"
                  onClick={sendOtp}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0 ? `${countdown}s` : "Resend OTP"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
