import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ShieldCheck,
  Zap,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Lock,
  Users,
  Activity
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      
      {/* Animated Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[1000px] h-[1000px] bg-green-500/20 rounded-full blur-[200px] animate-pulse -top-40 -left-40"></div>
        <div className="absolute w-[850px] h-[850px] bg-emerald-600/20 rounded-full blur-[200px] animate-pulse-slow top-1/2 -right-60"></div>
      </div>

      {/* Header */}
      <header className="border-b border-border backdrop-blur-md bg-popover sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
          
          {/* Updated Logo */}
          <img
            src="/slateai-logo.png"
            alt="Slate AI"
            className="w-32 h-auto rounded-2xl shadow-lg shadow-green-500/10 hover:shadow-green-400/30 hover:scale-110 transition-all duration-300"
          />

          {/* Navigation Links */}
          <nav className="hidden md:flex gap-8 text-lg">
            <Link to="/" className="hover:text-primary transition">Home</Link>
            <Link to="/pricing" className="hover:text-primary transition">Pricing</Link>
            <Link to="/features" className="hover:text-primary transition">Features</Link>
            <Link to="/contact" className="hover:text-primary transition">Contact</Link>
          </nav>

          {/* Buttons + Theme toggle */}
          <div className="flex gap-3 items-center">
            <Link to="/auth">
              <Button
                size="lg"
                className="text-base px-8 py-3 rounded-xl bg-transparent text-foreground border border-border hover:bg-accent backdrop-blur-sm transition-all"
              >
                Log In
              </Button>
            </Link>

            <Link to="/auth">
              <Button className="text-base gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 lg:px-8 pt-24 pb-32 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-400/20 text-sm font-medium text-green-400 backdrop-blur-md animate-fade">
          <CheckCircle2 className="w-4 h-4" />
          Enterprise-grade Security
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight animate-fade-up">
          Secure Auth
          <br />
          <span className="bg-gradient-to-r from-green-500 via-green-400 to-green-200 bg-clip-text text-transparent">
            Made Simple
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
          Modern authentication with OTP verification, advanced security, and comprehensive audit logging—all in one platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-up delay-300">
          <Link to="/auth">
            <Button
              size="lg"
              className="text-lg px-10 py-6 rounded-xl bg-green-600 hover:bg-green-500 shadow-green-500/30 shadow-xl hover:shadow-2xl transition-all gap-2 scale-100 hover:scale-105"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="lg"
              className="text-lg px-10 py-6 rounded-xl bg-transparent text-white border border-white/40 hover:border-white hover:bg-white/10 backdrop-blur-sm transition-all"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 lg:px-8 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            { value: "99.9%", label: "Uptime" },
            { value: "<100ms", label: "Response Time" },
            { value: "256-bit", label: "Encryption" },
            { value: "24/7", label: "Monitoring" }
          ].map((stat, index) => (
            <div key={index} className="text-center space-y-2 animate-fade-up delay-100">
              <p className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-green-200 to-green-500 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 lg:px-8 pb-24">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">Why Choose Slate AI?</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need for secure, scalable authentication
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { title: "Secure by Default", icon: ShieldCheck, desc: "Multi-factor authentication with OTP verification, password hashing, and comprehensive security logging." },
            { title: "Lightning Fast", icon: Zap, desc: "Optimized authentication flow with instant OTP delivery and real-time verification status." },
            { title: "Complete Audit Trail", icon: LineChart, desc: "Track every authentication event with detailed audit logs for compliance and security monitoring." },
            { title: "Enterprise Ready", icon: Lock, desc: "Built for scale with role-based access control and advanced security features." },
            { title: "User Management", icon: Users, desc: "Comprehensive user profiles, permissions, and team collaboration features." },
            { title: "Real-time Analytics", icon: Activity, desc: "Monitor authentication events, user activity, and security metrics in real-time." }
          ].map((f, i) => (
            <Card key={i} className="p-8 border border-white/10 bg-white/5 hover:border-green-400/30 hover:shadow-green-400/20 hover:shadow-2xl transition-all backdrop-blur-xl group animate-fade-up delay-150 cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{f.title}</h3>
              <p className="text-gray-300 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 lg:px-8 pb-24">
        <Card className="p-12 md:p-16 text-center bg-green-500/10 border border-green-400/20 shadow-green-400/10 shadow-xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of developers building secure applications with Slate AI
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="text-lg px-10 py-6 rounded-xl bg-green-600 hover:bg-green-500 shadow-green-500/30 shadow-xl transition-all gap-2 scale-100 hover:scale-105"
            >
              Create Your Account <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-4 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <img src="/slateai-logo.png" alt="Slate AI" className="w-32 h-auto rounded-xl opacity-80" />
          <p className="text-gray-400 text-sm">&copy; 2025 Slate AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
