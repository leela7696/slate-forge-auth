import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { authHelpers } from "@/lib/auth";

interface Error500Props {
  message?: string;
  onTryAgain?: () => void;
}

export default function Error500({ message, onTryAgain }: Error500Props) {
  const navigate = useNavigate();
  const isAuthenticated = authHelpers.isAuthenticated();
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds === 0) {
      navigate(isAuthenticated ? "/dashboard" : "/", { replace: true });
    }
  }, [seconds, isAuthenticated, navigate]);

  const handlePrimary = () => {
    if (onTryAgain) onTryAgain();
    else navigate(0); // reload
  };

  const handleContact = () => {
    window.location.href = "mailto:support@example.com?subject=Internal%20Server%20Error";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-in fade-in duration-300">
      <div className="w-full max-w-xl px-6">
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 text-warning flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">Something Went Wrong</h1>
            <p className="text-muted-foreground">We ran into an unexpected problem.</p>
            {message && <p className="text-xs text-muted-foreground">Details: {message}</p>}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Button onClick={handlePrimary} className="font-medium">Try Again</Button>
              <Button variant="outline" onClick={handleContact}>Contact Support</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Auto-redirect in {seconds}s</p>
            <p className="text-xs mt-2">
              <a className="underline text-muted-foreground hover:text-primary" href="mailto:support@example.com?subject=Bug%20Report">Report this issue</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

