import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Slate AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade authentication and user management platform with
            comprehensive audit logging and role-based access control
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/auth/signup">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/auth/login">Sign In</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">SMTP OTP Verification</h3>
            <p className="text-sm text-muted-foreground">
              Secure email-based verification with tamper-proof OTP delivery
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Role-Based Access Control</h3>
            <p className="text-sm text-muted-foreground">
              Granular permissions system with multi-tier role management
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Audit Trail</h3>
            <p className="text-sm text-muted-foreground">
              Blockchain-like immutable audit logs for complete traceability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
