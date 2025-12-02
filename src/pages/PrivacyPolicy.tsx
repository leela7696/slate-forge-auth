import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, ArrowUp } from "lucide-react";

export default function PrivacyPolicy() {
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

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-center w-full">Privacy Policy</h1>

          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 absolute right-6 top-10 md:static">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>

        <p className="text-muted-foreground mb-6 text-center">
          Last updated: {today}
        </p>

        <div className="space-y-6">

          {/* DATA COLLECTION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">What Personal Data Is Collected</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                We collect information you provide during registration and use of the platform,
                including name, email, and optional profile fields. Technical information such as
                browser type, device ID, and IP address may be collected for security and performance purposes.
              </p>
            </CardContent>
          </Card>

          {/* HOW DATA IS USED */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">How Data Is Used</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center space-y-2">
              <p>
                Data is used for authentication, secure access, permission handling, analytics, and
                personalization. Usage analytics help improve platform reliability and user experience.
              </p>
            </CardContent>
          </Card>

          {/* COOKIES */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Cookies and Preferences</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                Cookies support login sessions, security, and feature preferences. Necessary cookies cannot
                be disabled as they are required for secure authentication.
              </p>
            </CardContent>
          </Card>

          {/* DATA SHARING */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Data Sharing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                We do not sell personal data. Limited sharing occurs only with trusted service providers
                for hosting, email delivery, and infrastructure security — all bound by confidentiality.
              </p>
            </CardContent>
          </Card>

          {/* STORAGE & RETENTION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Data Storage and Retention</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                Data is stored securely and maintained only for as long as necessary to provide services
                and comply with legal obligations. Audit logs may be retained to maintain system integrity.
              </p>
            </CardContent>
          </Card>

          {/* USER RIGHTS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">User Rights</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                Depending on applicable regulations, you may request access to your data, download it,
                correct inaccuracies, or request deletion. Support may assist with such requests.
              </p>
            </CardContent>
          </Card>

          {/* CONTACT */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                For privacy-related questions or requests, contact us at privacy@example.com.
                We will aim to respond promptly in accordance with applicable laws.
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
