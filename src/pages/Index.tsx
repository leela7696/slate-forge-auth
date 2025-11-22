import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Zap, LineChart, ArrowRight, CheckCircle2, Lock, Users, Activity } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span><img src="/slateai-logo.png" alt="Slate AI Logo" className="w-25 h-14" /></span>
          </div>  
          <div className="flex gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-base">Log In</Button>
            </Link>
            <Link to="/auth">
              <Button className="text-base gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 lg:px-8 pt-24 pb-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
            <CheckCircle2 className="w-4 h-4" />
            Enterprise-grade Security
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
            Secure Auth
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Modern authentication with OTP verification, advanced security, and comprehensive audit logging—all in one platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 rounded-xl border-2">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 lg:px-8 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            { value: "99.9%", label: "Uptime" },
            { value: "<100ms", label: "Response Time" },
            { value: "256-bit", label: "Encryption" },
            { value: "24/7", label: "Monitoring" }
          ].map((stat, index) => (
            <div key={index} className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 lg:px-8 pb-24">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Why Choose Slate AI?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for secure, scalable authentication
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-8 border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Secure by Default</h3>
            <p className="text-muted-foreground leading-relaxed">
              Multi-factor authentication with OTP verification, password hashing, and comprehensive security logging.
            </p>
          </Card>

          <Card className="p-8 border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Lightning Fast</h3>
            <p className="text-muted-foreground leading-relaxed">
              Optimized authentication flow with instant OTP delivery and real-time verification status.
            </p>
          </Card>

          <Card className="p-8 border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LineChart className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Complete Audit Trail</h3>
            <p className="text-muted-foreground leading-relaxed">
              Track every authentication event with detailed audit logs for compliance and security monitoring.
            </p>
          </Card>

          <Card className="p-8 border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Enterprise Ready</h3>
            <p className="text-muted-foreground leading-relaxed">
              Built for scale with role-based access control and advanced security features.
            </p>
          </Card>

          <Card className="p-8 border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">User Management</h3>
            <p className="text-muted-foreground leading-relaxed">
              Comprehensive user profiles, permissions, and team collaboration features.
            </p>
          </Card>

          <Card className="p-8 border-2 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Real-time Analytics</h3>
            <p className="text-muted-foreground leading-relaxed">
              Monitor authentication events, user activity, and security metrics in real-time.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 lg:px-8 pb-24">
        <Card className="p-12 md:p-16 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers building secure applications with Slate AI
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all gap-2">
              Create Your Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">S</span>
              </div>
              <span className="text-lg font-bold">Slate AI</span>
            </div>
            <p className="text-muted-foreground">&copy; 2025 Slate AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
