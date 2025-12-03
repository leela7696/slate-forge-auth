import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { callEdgeFunction, authStorage } from "@/lib/auth";

export default function VerifyOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else setCanResend(true);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return toast.error("Please enter all 6 digits");

    setIsLoading(true);
    try {
      const response = await callEdgeFunction("verify-otp", { email, otp: code });

      if (response.success) {
        authStorage.setToken(response.token);
        authStorage.setUser(response.user);
        localStorage.removeItem("user_permissions_cache");
        toast.success("Account verified successfully!");
        navigate(response.redirectTo || "/dashboard");
      }
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await callEdgeFunction("resend-otp", { email });
      toast.success("New code sent!");
      setResendCooldown(60);
      setCanResend(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to resend code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[900px] h-[900px] bg-green-500/20 blur-[200px] animate-pulse -top-40 -left-40 rounded-full"></div>
        <div className="absolute w-[750px] h-[750px] bg-green-700/20 blur-[200px] animate-pulse-slow bottom-0 -right-32 rounded-full"></div>
      </div>

      <Card className="w-full max-w-md bg-card border border-border backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Verify your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <span className="font-semibold">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* OTP Input */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <Input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-lg"
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={isLoading || otp.some((d) => !d)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30 shadow-md"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>

          {/* Resend Code */}
          <div className="text-center text-sm text-muted-foreground">
            {canResend ? (
              <button className="text-primary hover:underline" onClick={handleResend}>Resend code</button>
            ) : (
              <span>Resend code in {resendCooldown}s</span>
            )}
          </div>

          {/* Go Back */}
          <div className="text-center text-sm text-muted-foreground">
            Wrong email?{" "}
            <Link to="/auth" className="text-primary underline hover:text-primary/80 transition">
              Go back
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
