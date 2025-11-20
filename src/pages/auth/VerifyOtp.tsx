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
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      const response = await callEdgeFunction("verify-otp", {
        email,
        otp: otpString,
      });

      if (response.success) {
        authStorage.setToken(response.token);
        authStorage.setUser(response.user);
        toast.success("Account verified successfully!");
        navigate(response.redirectTo || "/dashboard");
      }
    } catch (error: any) {
      if (error.error === "INVALID_OTP") {
        toast.error(`Invalid code. ${error.attempts_left} attempts remaining.`);
      } else if (error.error === "OTP_EXPIRED") {
        toast.error("Code expired. Please request a new one.");
      } else if (error.error === "OTP_LOCKED") {
        toast.error("Too many failed attempts. Please start signup again.");
      } else {
        toast.error(error.message || "Verification failed");
      }
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
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            We sent a 6-digit code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-bold"
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isLoading || otp.some((d) => !d)}
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>

          <div className="text-center text-sm">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-primary hover:underline"
              >
                Resend code
              </button>
            ) : (
              <span className="text-muted-foreground">
                Resend code in {resendCooldown}s
              </span>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Wrong email?{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Go back
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}