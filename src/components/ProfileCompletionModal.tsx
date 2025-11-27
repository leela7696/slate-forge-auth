import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCircle, Sparkles } from "lucide-react";
import { markProfilePopupSkipped } from "@/lib/profile-completion";

interface ProfileCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileCompletionModal({ open, onOpenChange }: ProfileCompletionModalProps) {
  const navigate = useNavigate();

  const handleCompleteProfile = () => {
    onOpenChange(false);
    navigate("/profile");
  };

  const handleSkip = () => {
    markProfilePopupSkipped();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] animate-scale-in">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-fade-in">
            <UserCircle className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Complete your profile
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Please complete your profile to unlock the best experience and access all features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Get personalized experience</p>
              <p className="text-xs text-muted-foreground">Help us serve you better</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button 
            onClick={handleCompleteProfile}
            className="w-full"
            size="lg"
          >
            Complete Profile
          </Button>
          <Button 
            onClick={handleSkip}
            variant="ghost"
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
