import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      toast({ title: "Error", description: error?.message || "Failed to reset password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#071d12] relative overflow-hidden px-4 text-white">

      {/* Background Glow — Same as Landing/Auth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[950px] h-[950px] bg-green-500/20 rounded-full blur-[200px] animate-pulse -top-40 -left-40"></div>
        <div className="absolute w-[750px] h-[750px] bg-green-700/20 rounded-full blur-[200px] animate-pulse-slow bottom-0 -right-32"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl text-white">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-white hover:text-green-300 hover:bg-white/10 transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>

          <CardTitle className="text-3xl font-bold text-white">
            Forgot Password
          </CardTitle>

          <CardDescription className="text-white/80">
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
                  s <= step ? "bg-green-500" : "bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* STEP 1: SEND OTP */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Email</Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-black/20 border-white/40 text-white placeholder-white/60"
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
                <Label className="text-white">Email</Label>
                <Input disabled className="bg-black/20 border-white/40 text-white" value={email} />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Enter OTP</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="text-white" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-2">
                <Label className="text-white">New Password</Label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  className="bg-black/20 border-white/40 text-white placeholder-white/60"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-white/80">{STRONG_PASSWORD_MESSAGE}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  className="bg-black/20 border-white/40 text-white placeholder-white/60"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                {/* Glass-style button */}
                <Button
                  onClick={resetPassword}
                  disabled={loading}
                  className="flex-1 bg-transparent text-white border border-white/40 hover:border-white hover:bg-white/10 backdrop-blur transition"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>

                <Button
                  variant="outline"
                  onClick={sendOtp}
                  disabled={countdown > 0 || loading}
                  className="bg-transparent text-white border border-white/40 hover:border-white hover:bg-white/10 backdrop-blur transition"
                >
                  {countdown > 0 ? `${countdown}s` : "Resend"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
