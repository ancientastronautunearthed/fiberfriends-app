
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Sparkles, Users, BrainCircuit, Heart, ShieldCheck, Zap, Atom, Package, Gem, Star, Award as TierAwardIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: Atom,
    title: "Your Personal Morgellon Monster",
    description: "Visualize your journey with a unique, AI-generated 'Inner Monster'. Its health dynamically reflects your logged foods, exercises, and product usage, offering a gamified approach to understanding your body's responses.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "fantasy monster abstract",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Pattern Recognition",
    description: "Leverage cutting-edge AI to analyze your symptom journals, identify potential triggers (including weather correlations), and discover personal or community-wide patterns. Gain insights you might have missed.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "ai network data",
  },
  {
    icon: Heart,
    title: "Fiber Singles: Connect Authentically",
    description: "Meet others who understand. Create your 'Romantic Monster' persona and engage in a unique dating experience where AI helps assess message quality and monster essences 'sync' based on mutual desire. (Optional Add-on)",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "connected hearts abstract",
  },
  {
    icon: Users,
    title: "Supportive Community Spaces",
    description: "Share your story in the Belief Circle, find camaraderie in the Doctor Forum, validate experiences with Humor Hub elements, and find validated providers in our user-driven directory.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "community support group",
  },
];

const pricingPlans = [
  {
    tierName: "Emergent Spore",
    priceMonthly: "Free",
    billingCycle: "",
    description: "Core tools to begin your journey of understanding and connection.",
    features: [
      "Personal Morgellon Monster",
      "Basic Health Tracking (Food, Exercise, Product - limited AI grading/entries)",
      "Symptom Journal (limited entries)",
      "Belief Circle & Doctor Forum (read-only or limited posts)",
      "Limited Provider Directory Access",
      "Mind & Wellness features (limited access)",
    ],
    cta: "Start for Free",
    icon: Atom,
    tierHighlight: false,
  },
  {
    tierName: "Resilient Filament",
    priceMonthly: "$9.99",
    billingCycle: "/month",
    description: "Enhanced tools for deeper insights and fuller community participation.",
    features: [
      "All Emergent Spore features, PLUS:",
      "Full Symptom Journal & Basic AI Pattern Analysis",
      "Full Food, Exercise, Product Trackers with detailed AI grading",
      "Full Community Access (posting rights in Belief Circle & Doctor Forum)",
      "Full Provider Directory Access",
      "All Mind & Wellness features (standard limits/streaks)",
      "Resilient Filament Profile Badge",
    ],
    cta: "Choose Resilient Filament",
    icon: Gem,
    tierHighlight: false,
  },
  {
    tierName: "Crystalline Matrix",
    priceMonthly: "$19.99",
    billingCycle: "/month",
    description: "The ultimate toolkit for comprehensive analysis, peak wellness engagement, and premium support.",
    features: [
      "All Resilient Filament features, PLUS:",
      "Advanced AI Pattern Recognition (weather & community data insights)",
      "Higher limits/streaks on Mind & Wellness features",
      "Enhanced Monster Customization Options (future)",
      "Exclusive 'Crystalline Matrix' Profile Badge",
      "Priority Support (future)",
      "Early Access to New Features (future)",
    ],
    cta: "Choose Crystalline Matrix",
    icon: TierAwardIcon,
    tierHighlight: true,
    specialOffer: "Launch Price! First 50 subscribers lock in this rate.",
  },
];

const fiberSinglesAddon = {
    name: "Fiber Connection Add-on",
    price: "$9.99",
    billingCycle: "/month",
    description: "Unlock the full Fiber Singles experience to find meaningful connections.",
    features: [
        "Full access to Fiber Singles",
        "Create your Romantic Monster persona",
        "AI-assisted message quality insights",
        "Participate in chat games & exercises",
        "Connect with other singles in the community",
    ],
    icon: Heart,
};


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
            <Image src="https://placehold.co/1920x1080.png" alt="Abstract background" layout="fill" objectFit="cover" data-ai-hint="abstract tech background" />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">
            Navigate Morgellons with <span className="text-primary">Insight & Connection</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Fiber Friends empowers you with AI-driven tools, a unique 'Inner Monster' system, and a supportive community to understand your journey and connect with others who truly get it.
          </p>
          <div className="space-x-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link href="/register">Join the Community</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-card/10">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
            Transform Your Understanding with <span className="text-primary">Unique Features</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {features.map((feature, index) => (
              <Card key={feature.title} className="overflow-hidden shadow-xl hover:shadow-primary/20 transition-shadow duration-300 bg-card">
                <div className="relative h-56 w-full">
                    <Image src={feature.image} alt={feature.title} layout="fill" objectFit="cover" data-ai-hint={feature.imageAiHint}/>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-headline flex items-center gap-2">
                    <feature.icon className="h-7 w-7 text-primary" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-4">
            Find Your Fiber Friends Plan
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose the plan that best suits your journey. Subscriptions support platform development and research.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {pricingPlans.map((plan) => (
              <Card key={plan.tierName} className={`flex flex-col shadow-lg ${plan.tierHighlight ? 'border-2 border-primary ring-2 ring-primary/50' : 'border-border'}`}>
                {plan.tierHighlight && plan.specialOffer && (
                  <div className="py-1.5 px-4 bg-primary text-primary-foreground text-xs font-semibold text-center rounded-t-md">
                    {plan.specialOffer}
                  </div>
                )}
                <CardHeader className="text-center">
                  <plan.icon className={`h-10 w-10 mx-auto mb-2 ${plan.tierHighlight ? 'text-primary' : 'text-muted-foreground'}`} />
                  <CardTitle className={`text-2xl font-headline ${plan.tierHighlight ? 'text-primary' : ''}`}>{plan.tierName}</CardTitle>
                  <div className="text-4xl font-bold mt-2">
                    {plan.priceMonthly}
                    {plan.billingCycle && <span className="text-sm font-normal text-muted-foreground">{plan.billingCycle}</span>}
                  </div>
                   <CardDescription className="mt-1 h-10">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2.5">
                    {plan.features.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardContent className="mt-auto">
                  <Button 
                    className={`w-full ${plan.tierHighlight ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`}
                    variant={plan.priceMonthly === "Free" ? "outline" : "default"}
                  >
                    {plan.cta}
                  </Button>
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    (Stripe integration coming soon for subscriptions)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Fiber Singles Add-on Card */}
          <Card className="mt-12 max-w-md mx-auto shadow-lg border-dashed border-accent">
             <CardHeader className="text-center">
                  <fiberSinglesAddon.icon className="h-10 w-10 mx-auto mb-2 text-pink-500" />
                  <CardTitle className="text-2xl font-headline text-pink-500">{fiberSinglesAddon.name}</CardTitle>
                  <div className="text-3xl font-bold mt-2">
                    {fiberSinglesAddon.price}
                    <span className="text-sm font-normal text-muted-foreground">{fiberSinglesAddon.billingCycle}</span>
                  </div>
                   <CardDescription className="mt-1">{fiberSinglesAddon.description}</CardDescription>
              </CardHeader>
              <CardContent>
                  <ul className="space-y-2.5">
                    {fiberSinglesAddon.features.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
              </CardContent>
              <CardContent className="mt-auto">
                  <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                    Add Fiber Connection
                  </Button>
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    (Can be added to any base plan. Stripe integration coming soon.)
                  </p>
              </CardContent>
          </Card>

        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30">
        <div className="container mx-auto px-6 text-center">
          <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">
            Ready to Embrace Understanding?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join Fiber Friends today. Start your journey towards clarity, connection, and community support. You are not alone.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6" asChild>
            <Link href="/register">Sign Up & Begin</Link>
          </Button>
        </div>
      </section>

      {/* Footer (Simplified for landing page) */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Fiber Friends. All Rights Reserved.</p>
          <p className="mt-1">Dedicated to support, validation, and research for the Morgellons community.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
