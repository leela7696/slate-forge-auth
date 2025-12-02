import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function CookiePolicy() {
  const today = format(new Date(), "MMMM d, yyyy");

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <main className="w-full max-w-4xl px-4 lg:px-8 py-10">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Last updated: {today}
        </p>

        <div className="space-y-6">

          {/* What are cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">What Are Cookies?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                Cookies are small text files stored on your device by websites you visit.
                They help websites remember your preferences, login status, and usage patterns.
              </p>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Types of Cookies We Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4 text-center">
              <div>
                <p className="font-medium text-foreground">Necessary</p>
                <p>Required for secure login, authentication, and core functionality.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Analytics</p>
                <p>Used to track system usage and improve reliability and performance.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Functional</p>
                <p>Remembers preferences such as theme to provide better usability.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Marketing</p>
                <p>Used for relevant content display. Currently no third-party marketing cookies are used.</p>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">How We Use Cookies</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2 text-left mx-auto max-w-xl">
                <li>Maintain user sessions and secure account access</li>
                <li>Track audit logs and authentication events</li>
                <li>Improve app features based on usage insights</li>
                <li>Store interface preferences such as dark/light theme</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookie Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Managing Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                Cookies can be managed anytime using the “Manage Cookie Preferences” link
                in the landing page footer. You may also adjust settings using your browser.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground text-center">
              <p>
                For cookie-related questions, reach us at support@example.com.
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
