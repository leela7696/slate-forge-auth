import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CookieConsentDialogProps {
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CookieConsentDialog({ forceOpen = false, onOpenChange }: CookieConsentDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("cookieConsent") : null;
    // If forced open, show regardless of stored consent
    if (forceOpen) {
      setOpen(true);
      return;
    }
    // Show only when no choice has been made yet
    setOpen(!stored);
  }, [forceOpen]);

  const handleDecision = (decision: "accepted" | "denied") => {
    try {
      window.localStorage.setItem("cookieConsent", decision);
    } catch {}
    setOpen(false);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); onOpenChange?.(val); }}>
      <DialogContent className="max-w-md sm:max-w-lg bg-popover text-popover-foreground border-border animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle>Cookie Policy</DialogTitle>
          <DialogDescription className="text-sm">
            We use cookies to improve your experience, analyze traffic, and personalize content. You can choose to accept or deny.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mt-4">
          <Link to="/cookie-policy" className="text-xs text-muted-foreground hover:text-primary underline">
            Learn More
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleDecision("denied")}>Deny</Button>
            <Button onClick={() => handleDecision("accepted")}>Accept</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

