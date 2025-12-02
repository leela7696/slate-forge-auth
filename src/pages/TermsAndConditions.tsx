import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { format } from "date-fns";

export default function TermsAndConditions() {
  const today = format(new Date(), "MMMM d, yyyy");

  // Scroll to top on first load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <main className="w-full max-w-4xl px-4 lg:px-8 py-10">

        <div className="flex items-center justify-center mb-4">
          <h1 className="text-3xl font-bold text-center">Terms & Conditions</h1>
        </div>

        <p className="text-muted-foreground mb-6 text-center">
          Last updated: {today}
        </p>

        <div className="space-y-6">

          {/* USER RESPONSIBILITIES */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                By accessing or using this platform, you agree to provide accurate information during
                registration and maintain the confidentiality of your login credentials. You are fully
                responsible for all activities that occur under your account and agree to use the platform
                only for lawful and authorized purposes.
              </p>
              <p className="mt-2">
                Misrepresentation of identity, unauthorized access, and platform misuse are strictly prohibited.
              </p>
            </CardContent>
          </Card>

          {/* ACCEPTABLE USE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Acceptable Use of the Platform</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2 text-center">
              <p>
                You agree not to use the platform in any manner that could impair performance, attempt to bypass
                security mechanisms, or exploit vulnerabilities. Activities such as reverse engineering,
                unauthorized data scraping, distribution of malware, or automated abuse of the system are prohibited.
              </p>
              <p>
                We reserve the right to take corrective action including warnings, account restrictions,
                or permanent suspension if harmful activity is detected.
              </p>
            </CardContent>
          </Card>

          {/* DATA & PRIVACY */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Data & Privacy Protection</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                Your personal data is handled according to our Privacy Policy. Usage of this platform implies
                consent to processing necessary for authentication, security, and service improvement.
              </p>
            </CardContent>
          </Card>

          {/* SERVICE AVAILABILITY */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Service Availability & Limitations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                While we aim to provide uninterrupted access, platform availability is not guaranteed.
                Maintenance, upgrades, or unexpected outages may occur.
              </p>
            </CardContent>
          </Card>

          {/* TERMINATION POLICY */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Account Suspension & Termination</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms & Conditions,
                engage in unauthorized access, or pose a security risk to other users.
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Scroll to Top Button */}
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full shadow-lg"
          variant="secondary"
        >
          <ArrowUp className="w-4 h-4 mr-2" /> Top
        </Button>
      </main>
    </div>
  );
}
