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
      <DialogContent
        className="
          sm:max-w-[500px] animate-scale-in
          bg-[#04160e]/85 backdrop-blur-2xl
          border border-green-500/20
          shadow-lg shadow-green-500/10
          rounded-2xl
        "
      >
        {/* Header */}
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-600/15 border border-green-500/30 flex items-center justify-center shadow-green-500/20 shadow-md animate-fade-in">
            <UserCircle className="w-10 h-10 text-green-400" />
          </div>

          <DialogTitle className="text-2xl text-center text-white font-bold">
            Complete your profile
          </DialogTitle>

          <DialogDescription className="text-center text-base text-white/70">
            Unlock the full Slate AI experience by filling in your profile details.
          </DialogDescription>
        </DialogHeader>

        {/* Features highlight */}
        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Sparkles className="w-5 h-5 text-green-300 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Get personalized access</p>
              <p className="text-xs text-white/60">Features and recommendations tailored to you</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleCompleteProfile}
            size="lg"
            className="
              w-full rounded-xl font-semibold
              bg-green-600/40 hover:bg-green-500/50
              text-green-200 border border-green-500/30
              shadow-green-500/20 shadow transition-all
            "
          >
            Complete Profile
          </Button>

          <Button
            onClick={handleSkip}
            variant="ghost"
            className="
              w-full rounded-xl text-white/70 hover:text-white
              hover:bg-white/10 transition-all
            "
          >
            Continue to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
