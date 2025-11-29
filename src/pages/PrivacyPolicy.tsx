import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { ArrowLeft, ArrowUp } from "lucide-react";

export default function PrivacyPolicy() {
  const today = format(new Date(), "MMMM d, yyyy");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground mb-6">Last updated: {today}</p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What Personal Data Is Collected</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  We collect information you provide during registration and use of the platform, including
                  name, email, and optional profile details such as phone and department. Technical data
                  (such as device type, browser, IP address) may be collected to maintain security and
                  improve performance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How Data Is Used</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  We use your data to enable authentication, secure access, and permission management.
                  Aggregated analytics help us understand usage to improve reliability and features. We
                  may personalize the interface (for example, theme preferences) to enhance your experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookies and Preferences</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Cookies support session management, analytics, and functional preferences. You can manage
                  your choices using the Cookie Policy and the “Manage Cookie Preferences” link in the footer.
                  Necessary cookies are required for secure login and core functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Sharing</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  We do not sell personal data. Limited sharing may occur with trusted service providers to support
                  infrastructure, security, and email delivery. These providers are bound by contractual obligations
                  to protect your information and use it solely for the purposes we specify.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Storage and Retention</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Data is stored securely and retained only as long as necessary to provide the service, comply with
                  legal obligations, and enforce policies. Audit logs may be retained to ensure system integrity and
                  traceability of administrative actions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Rights</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Depending on applicable law, you may have rights to access, download, correct, or request deletion
                  of your data. If the platform supports these features, you can submit a request through your profile
                  or contact support for assistance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  For privacy-related questions or requests, contact us at privacy@example.com. We aim to respond in a
                  timely manner and address your concerns in accordance with applicable regulations.
                </p>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 rounded-full shadow-lg"
            variant="secondary"
          >
            <ArrowUp className="w-4 h-4 mr-2" /> Top
          </Button>
        </main>
      </div>
    </SidebarProvider>
  );
}

