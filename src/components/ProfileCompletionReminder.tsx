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

  if (completion.isComplete) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-md animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">Profile completion: {completion.percentage}%</h3>
              <p className="text-sm text-muted-foreground">
                Complete your profile to unlock all features
              </p>
            </div>
            <div className="space-y-2">
              <Progress value={completion.percentage} className="h-2" />
              {completion.missingFields.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Missing: {completion.missingFields.join(", ")}
                </p>
              )}
            </div>
            <Button 
              onClick={() => navigate("/profile")}
              size="sm"
              className="mt-2"
            >
              Continue Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
