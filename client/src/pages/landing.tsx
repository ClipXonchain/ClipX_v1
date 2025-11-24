import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Zap, Shield, Workflow } from "lucide-react";
import { SiX, SiTelegram } from "react-icons/si";
import { useLogin } from "@privy-io/react-auth";
import { useEffect } from "react";
import clipxLogo from "@assets/ClipX Logo with Neon Blue X and Newspaper Icon_1763034906334.png";

export default function Landing() {
  const { login } = useLogin({
    onComplete: () => {
      window.location.href = "/dashboard";
    },
  });

  // Auto-trigger login if opened from extension
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoLogin') === 'true') {
      // Small delay to ensure Privy is ready
      setTimeout(() => {
        login();
      }, 500);
    }
  }, [login]);

  const handleConnectTwitter = () => {
    login();
  };

  const features = [
    {
      icon: Zap,
      title: "Instant Tips",
      description: "Send BNB tips instantly through simple Twitter mentions. Fast, seamless, and secure.",
    },
    {
      icon: Shield,
      title: "Secure Wallets",
      description: "Auto-generated wallets with bank-level encryption. Your keys, your crypto.",
    },
    {
      icon: Workflow,
      title: "Easy Integration",
      description: "Just mention @clipx0_ with the tip command. No complex setup required.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Connect",
      description: "Link your Twitter account to ClipX",
    },
    {
      number: "2",
      title: "Mention",
      description: "Tweet: @clipx0_ send tip 0.1 bnb to @friend",
    },
    {
      number: "3",
      title: "Confirm",
      description: "Bot verifies both users are registered",
    },
    {
      number: "4",
      title: "Tip Sent",
      description: "Instant BNB transfer with transaction hash",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={clipxLogo} alt="ClipX" className="h-10 w-10" />
              <span className="text-xl font-semibold">ClipX</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button onClick={handleConnectTwitter} data-testid="button-connect-twitter">
                <SiX className="h-4 w-4 mr-2" />
                Connect with X
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                  Tip Anyone on X with BNB
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground">
                  Send instant cryptocurrency tips to anyone on Twitter. Secure wallets, seamless integration, and transparent transactions powered by BNB Chain.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={handleConnectTwitter} data-testid="button-hero-connect">
                  <SiX className="h-5 w-5 mr-2" />
                  Get Started
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works">Learn More</a>
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-2xl font-semibold">Instant</div>
                  <div className="text-sm text-muted-foreground">Tip Transfer</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="text-2xl font-semibold">Secure</div>
                  <div className="text-sm text-muted-foreground">Encrypted Wallets</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <div className="text-2xl font-semibold">Simple</div>
                  <div className="text-sm text-muted-foreground">Just Mention</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center p-12">
                <div className="relative w-full h-full rounded-xl border-2 border-primary/20 bg-card p-8 flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <SiX className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">@alice</p>
                      <p className="text-xs text-muted-foreground">@clipx0_ send tip 0.1 bnb to @bob</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Tip Sent!</p>
                      <p className="text-xs text-muted-foreground font-mono">0x1a2b3c...def</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Why Choose ClipX?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for the crypto-native Twitter community. Simple, secure, and lightning-fast.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Send tips in four simple steps. No blockchain knowledge required.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-semibold">Ready to Start Tipping?</h2>
          <p className="text-lg text-muted-foreground">
            Connect your Twitter account and start sending BNB tips in seconds.
          </p>
          <Button size="lg" onClick={handleConnectTwitter} data-testid="button-cta-connect">
            <SiX className="h-5 w-5 mr-2" />
            Connect Your Twitter Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={clipxLogo} alt="ClipX" className="h-6 w-6" />
              <span className="font-medium">ClipX</span>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
              <a
                href="https://x.com/ClipX0_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                aria-label="Follow ClipX on X"
              >
                <SiX className="h-4 w-4" />
                <span>Follow @ClipX0_</span>
              </a>

              <a
                href="https://t.me/ClipXofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                aria-label="Join ClipX on Telegram"
              >
                <SiTelegram className="h-4 w-4" />
                <span>Telegram</span>
              </a>

              <a
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </a>

              <a
                href="/terms"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Terms & Conditions
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2025 ClipX. Powered by BNB Chain.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
