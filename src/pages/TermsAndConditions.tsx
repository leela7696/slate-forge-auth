import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { ArrowLeft, ArrowUp } from "lucide-react";

export default function TermsAndConditions() {
  const today = format(new Date(), "MMMM d, yyyy");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Terms & Conditions</h1>
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
                <CardTitle>User Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  By using this platform, you agree to provide accurate information, maintain
                  the confidentiality of your account credentials, and comply with all applicable
                  laws and regulations. You are responsible for any activity conducted through your
                  account and for adhering to community standards of respectful and lawful behavior.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acceptable Use of the Platform</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  You may not misuse the platform or attempt to interfere with its proper operation.
                  Prohibited activities include unauthorized access, data scraping, distribution of malware,
                  harassing or abusive conduct, and any actions that violate privacy or intellectual property rights.
                </p>
                <p>
                  We reserve the right to monitor usage for security and compliance purposes and to take appropriate
                  action if suspicious or harmful behavior is detected.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intellectual Property Rules</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  All content, trademarks, and intellectual property associated with this platform are owned by us or
                  our licensors. You may use the platform for its intended purpose and within the scope of granted
                  permissions. You may not reproduce, modify, distribute, or create derivative works without explicit
                  written consent.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account & Security Requirements</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  You must maintain secure credentials and update them when necessary. Notify us immediately of any
                  unauthorized access or suspected security incidents. We may require multi-factor authentication and
                  routine verification steps to protect your account.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Availability Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  While we strive for high availability and reliability, the service may experience occasional downtime
                  due to maintenance, updates, or unforeseen incidents. We will take reasonable steps to minimize
                  disruptions and communicate material service interruptions when possible.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential
                  damages arising from your use of the platform. Our total liability for any claim will not exceed the
                  amount you paid (if any) to access the service during the preceding 12 months.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termination of Access</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  We may suspend or terminate your access if you violate these Terms & Conditions, engage in unlawful
                  activity, or pose a risk to the security or integrity of the platform. You may also terminate your
                  use at any time by discontinuing access and, where applicable, closing your account.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Governing Law</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  These Terms & Conditions are governed by the laws of the jurisdiction in which our company is
                  established, without regard to its conflict of law provisions. Any disputes will be resolved in the
                  competent courts of that jurisdiction.
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

