import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { callEdgeFunction } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface ChangeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onSuccess: () => void;
}

export const ChangeEmailModal = ({ open, onOpenChange, currentEmail, onSuccess }: ChangeEmailModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [oldOtp, setOldOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOtp, setNewOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOldOtp = async () => {
    setLoading(true);
    try {
      await callEdgeFunction('change-email', { action: 'send-old-otp' });
      toast({ title: "Success", description: `OTP sent to ${currentEmail}` });
      setCountdown(60);
      setStep(1);
    } catch (error: any) {
      const rawMsg = error?.message || "Verification failed";
      const isInvalidOtp = /invalid otp/i.test(rawMsg) || /INVALID_OTP/i.test(error?.error || "");
      const isGenericNon2xx = /non-2xx/i.test(rawMsg) && (error?.context?.status === 400 || !error?.context?.status);
      const friendly = (isInvalidOtp || isGenericNon2xx) ? "Orang-otap" : rawMsg;
      toast({ title: "Error", description: friendly, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOldOtp = async () => {
    if (oldOtp.length !== 6) {
      toast({ title: "Error", description: "Please enter 6-digit OTP", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await callEdgeFunction('change-email', { action: 'verify-old-otp', otp: oldOtp });
      toast({ title: "Success", description: "Current email verified" });
      setStep(2);
    } catch (error: any) {
      const rawMsg = error?.message || "Failed to send OTP";
      const isInvalidOtp = /invalid otp/i.test(rawMsg) || /INVALID_OTP/i.test(error?.error || "");
      const isGenericNon2xx = /non-2xx/i.test(rawMsg) && (error?.context?.status === 400 || !error?.context?.status);
      const friendly = (isInvalidOtp || isGenericNon2xx) ? "Orang-otap" : rawMsg;
      toast({ title: "Error", description: friendly, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendNewOtp = async () => {
    if (!newEmail || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(newEmail)) {
      toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      return;
    }

    // Frontend instant validation: block same email
    if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
      toast({ title: "Error", description: "You are already using this email. Please enter a different email.", variant: "destructive" });
      return;
    }

    // Frontend check: active user existence to give friendly message early
    try {
      const check = await callEdgeFunction('check-email', { email: newEmail.trim().toLowerCase() });
      if (check?.exists) {
        toast({ title: "Error", description: "This email is already registered by an active user.", variant: "destructive" });
        return;
      }
    } catch (e) {
      // Non-blocking: proceed to backend which also validates
    }

    setLoading(true);
    try {
      const resp = await callEdgeFunction('change-email', { action: 'send-new-otp', newEmail });
      toast({ title: "Success", description: `OTP sent to ${newEmail}` });
      if (resp?.note === 'DELETED_USER_AVAILABLE') {
        toast({ title: "Info", description: "This email belongs to a deleted user and is now available." });
      }
      setCountdown(60);
      setStep(3);
    } catch (error: any) {
      const rawMsg = error?.message || "Failed to confirm new email";
      const isInvalidOtp = /invalid otp/i.test(rawMsg) || /INVALID_OTP/i.test(error?.error || "");
      const isGenericNon2xx = /non-2xx/i.test(rawMsg) && (error?.context?.status === 400 || !error?.context?.status);
      const friendly = (isInvalidOtp || isGenericNon2xx) ? "Orang-otap" : rawMsg;
      // Map backend codes to friendly messages
      if (error?.error === 'SAME_EMAIL') {
        toast({ title: "Error", description: "New email must be different from your current email.", variant: "destructive" });
      } else if (error?.error === 'ACTIVE_EMAIL_TAKEN') {
        toast({ title: "Error", description: "This email is already registered by an active user.", variant: "destructive" });
      } else if (error?.error === 'INVALID_EMAIL') {
        toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      } else {
        toast({ title: "Error", description: friendly, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmNewEmail = async () => {
    if (newOtp.length !== 6) {
      toast({ title: "Error", description: "Please enter 6-digit OTP", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await callEdgeFunction('change-email', { action: 'confirm', otp: newOtp });
      toast({ title: "Success", description: "Email updated successfully" });
      onSuccess();
      onOpenChange(false);
      resetModal();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setOldOtp("");
    setNewEmail("");
    setNewOtp("");
    setCountdown(0);
  };

  useEffect(() => {
    if (open) {
      sendOldOtp();
    } else {
      resetModal();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            {step === 1 && "Step 1: Verify your current email"}
            {step === 2 && "Step 2: Enter your new email"}
            {step === 3 && "Step 3: Verify your new email"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((s) => (
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
                <Label>Current Email</Label>
                <Input value={currentEmail} disabled />
              </div>
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <InputOTP maxLength={6} value={oldOtp} onChange={setOldOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={verifyOldOtp}
                  disabled={loading || oldOtp.length !== 6}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
                <Button
                  variant="outline"
                  onClick={sendOldOtp}
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
                <Label>New Email Address</Label>
                <Input
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <Button onClick={sendNewOtp} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP to New Email
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Email</Label>
                <Input value={newEmail} disabled />
              </div>
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <InputOTP maxLength={6} value={newOtp} onChange={setNewOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={confirmNewEmail}
                  disabled={loading || newOtp.length !== 6}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  onClick={sendNewOtp}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0 ? `Resend (${countdown}s)` : "Resend OTP"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
