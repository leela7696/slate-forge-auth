import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { callEdgeFunction } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { isStrongPassword, STRONG_PASSWORD_MESSAGE } from "@/lib/password";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ChangePasswordModal = ({ open, onOpenChange, onSuccess }: ChangePasswordModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await callEdgeFunction('change-password', { action: 'send-otp' });
      toast({ title: "Success", description: "OTP sent to your email" });
      setCountdown(60);
      setStep(1);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndUpdate = async () => {
    if (otp.length !== 6) {
      toast({ title: "Error", description: "Please enter 6-digit OTP", variant: "destructive" });
      return;
    }

    if (!newPassword || !isStrongPassword(newPassword)) {
      toast({ title: "Error", description: STRONG_PASSWORD_MESSAGE, variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await callEdgeFunction('change-password', { 
        action: 'verify-and-update', 
        otp, 
        newPassword 
      });
      toast({ title: "Success", description: "Password updated successfully" });
      onSuccess();
      onOpenChange(false);
      resetModal();
    } catch (error: any) {
      const rawMsg = error?.message || "Failed to update password";
      const isInvalidOtp = /invalid otp/i.test(rawMsg) || /INVALID_OTP/i.test(error?.error || "");
      const isGenericNon2xx = /non-2xx/i.test(rawMsg) && (error?.context?.status === 400 || !error?.context?.status);
      const friendly = (isInvalidOtp || isGenericNon2xx) ? "Wrong-otp" : rawMsg;
      toast({ title: "Error", description: friendly, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setCountdown(0);
  };

  const handleNext = () => {
    if (otp.length === 6) {
      setStep(2);
    } else {
      toast({ title: "Error", description: "Please enter 6-digit OTP", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (open) {
      sendOtp();
    } else {
      resetModal();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            {step === 1 && "Step 1: Verify your identity with OTP"}
            {step === 2 && "Step 2: Enter your new password"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enter OTP sent to your email</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleNext}
                  disabled={loading || otp.length !== 6}
                  className="flex-1"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  onClick={sendOtp}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0 ? `Resend (${countdown}s)` : "Resend OTP"}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <PasswordInput
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {STRONG_PASSWORD_MESSAGE}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <PasswordInput
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={verifyAndUpdate}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
