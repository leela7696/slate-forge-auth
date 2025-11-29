import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { authHelpers } from "@/lib/auth";

export default function Error403() {
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

  const handlePrimary = () => navigate(isAuthenticated ? "/dashboard" : "/", { replace: true });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-in fade-in duration-300">
      <div className="w-full max-w-xl px-6">
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldX className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You don’t have permission to view this page.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Button onClick={handlePrimary} className="font-medium">Return to Dashboard</Button>
              <Button variant="outline" onClick={() => alert("Access request submitted (placeholder)")}>Request Access</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Auto-redirect in {seconds}s</p>
            <p className="text-xs mt-2">
              <a className="underline text-muted-foreground hover:text-primary" href="mailto:support@example.com?subject=Access%20Denied%20Help">Report this issue</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

