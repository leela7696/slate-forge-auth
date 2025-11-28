import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles } from "lucide-react";
import {
  ProfileCompletionStatus,
  hasProfileCompletionBeenCelebrated,
  markProfileCompletionCelebrated,
} from "@/lib/profile-completion";
import confetti from "canvas-confetti";

interface ProfileCompletionBarProps {
  completion: ProfileCompletionStatus;
}

export function ProfileCompletionBar({ completion }: ProfileCompletionBarProps) {
  const [showBadge, setShowBadge] = useState(false);
  const [celebrationTriggered, setCelebrationTriggered] = useState(
    hasProfileCompletionBeenCelebrated()
  );

  useEffect(() => {
    if (completion.isComplete && !celebrationTriggered) {
      triggerCelebration();
      markProfileCompletionCelebrated();
      setCelebrationTriggered(true);
      setShowBadge(true);
    } else if (completion.isComplete) {
      setShowBadge(true);
    }
  }, [completion.isComplete, celebrationTriggered]);

  const triggerCelebration = () => {
    const audio = new Audio("/success-sound.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => null);

    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  return (
    <Card className="bg-[#04160e]/70 backdrop-blur-xl border border-green-500/20 shadow-green-500/10 shadow-xl rounded-2xl animate-fade-in">
      <CardContent className="p-6">
        <div className="space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
              <p className="text-sm text-white/60">
                {completion.isComplete
                  ? "Your profile is complete!"
                  : `${completion.percentage}% complete`}
              </p>
            </div>

            {showBadge && (
              <Badge
                className="gap-2 px-4 py-2 text-sm bg-green-600/25 border border-green-500/40 text-green-300 shadow-green-500/10 shadow rounded-full animate-scale-in"
              >
                <Trophy className="w-4 h-4" />
                Profile Completed
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress
              value={completion.percentage}
              className="h-3 bg-black/40 [&>div]:bg-green-400"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">{completion.percentage}%</span>

              {!completion.isComplete && completion.missingFields.length > 0 && (
                <span className="text-white/60">
                  Missing: {completion.missingFields.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Congratulations message */}
          {completion.isComplete && (
            <div className="flex items-center gap-2 text-sm text-green-300 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Congratulations on completing your profile!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
