import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format } from "date-fns";

export default function CookiePolicy() {
  const today = format(new Date(), "MMMM d, yyyy");

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground mb-6">Last updated: {today}</p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What Are Cookies?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Cookies are small text files stored on your device by websites you visit. They help websites remember information about your visit, such as preferences, login status, and analytics usage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Types of Cookies We Use</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <div>
                  <p className="font-medium text-foreground">Necessary</p>
                  <p>Required for core functionality, such as authentication and security. These cannot be disabled.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Analytics</p>
                  <p>Help us understand how the application is used so we can improve performance and reliability.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Functional</p>
                  <p>Remember preferences (like theme) and provide enhanced features for a better experience.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Marketing</p>
                  <p>Used to deliver relevant content. We currently do not use third-party marketing cookies.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Cookies</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Maintain user sessions and secure access</li>
                  <li>Track audit events and system activity</li>
                  <li>Measure usage to improve features and performance</li>
                  <li>Remember interface preferences (such as theme)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Managing Cookie Preferences</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  You can update your cookie preferences at any time by using the "Manage Cookie Preferences" link in the footer of the landing page. You can also control cookies via your browser settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>For questions about this cookie policy, contact us at support@example.com.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

