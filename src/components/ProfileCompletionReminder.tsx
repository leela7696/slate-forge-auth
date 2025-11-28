import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import { ProfileCompletionStatus } from "@/lib/profile-completion";

interface ProfileCompletionReminderProps {
  completion: ProfileCompletionStatus;
}

export function ProfileCompletionReminder({ completion }: ProfileCompletionReminderProps) {
  const navigate = useNavigate();

  if (completion.isComplete) return null;

  return (
    <Card
      className="
        bg-[#04160e]/85 backdrop-blur-xl border border-green-500/20
        shadow-lg shadow-green-500/10 rounded-2xl animate-fade-in
      "
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className="
              w-10 h-10 rounded-full bg-green-600/15 border border-green-500/30
              flex items-center justify-center flex-shrink-0 shadow-green-500/20 shadow-md
            "
          >
            <AlertCircle className="w-5 h-5 text-green-400" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-white">
                Profile Completion: {completion.percentage}%
              </h3>
              <p className="text-sm text-white/60">
                Finish your profile to unlock full Slate AI access.
              </p>
            </div>

            <div className="space-y-2">
              <Progress
                value={completion.percentage}
                className="h-2 bg-green-700/20 [&>div]:bg-green-500"
              />
              {completion.missingFields.length > 0 && (
                <p className="text-xs text-white/60">
                  Missing: {completion.missingFields.join(", ")}
                </p>
              )}
            </div>

            <Button
              onClick={() => navigate("/profile")}
              size="sm"
              className="
                mt-2 w-fit px-5 rounded-lg
                bg-green-600/40 hover:bg-green-500/50 text-green-200
                border border-green-500/30 shadow-green-500/20 shadow
                transition-all
              "
            >
              Continue Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
