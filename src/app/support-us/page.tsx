
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartHandshake } from "lucide-react";
import Image from "next/image";

export default function SupportUsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full">
            <Image 
                src="https://placehold.co/800x300.png" 
                alt="Supportive community" 
                layout="fill" 
                objectFit="cover"
                data-ai-hint="community hands"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                 <h1 className="text-3xl font-headline font-bold text-white">Support Fiber Friends</h1>
            </div>
        </div>
        <CardContent className="p-6 pt-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold font-headline text-primary mb-3 flex items-center gap-2">
              <HeartHandshake className="h-7 w-7" />
              Help Us Grow and Fund Research
            </h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Fiber Friends is a community-driven platform committed to providing support, validation, and resources for individuals affected by Morgellons disease. Your generous support plays a crucial role in our mission.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              Contributions help us cover operational costs, develop new and improved features for the app, and most importantly, fund vital research aimed at understanding this complex condition and exploring potential avenues for relief and treatment.
            </p>
          </section>

          <section className="p-4 border-l-4 border-accent bg-accent/10 rounded-r-md">
            <h3 className="font-semibold text-accent-foreground mb-2">Our Commitment to Transparency</h3>
            <p className="text-sm text-accent-foreground/80">
              <strong>100% of the proceeds</strong> from donations are dedicated to running this site and advancing our research efforts. We believe in full transparency and are committed to using every contribution effectively to benefit the Morgellons community.
            </p>
          </section>
          
          <section>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Every contribution, no matter the size, makes a significant difference and brings us closer to a future where those with Morgellons feel understood, supported, and hopeful.
            </p>
            <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <a href="#donate-link"> {/* Placeholder link */}
                Donate Now and Make a Difference
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
              (You will be redirected to our secure donation partner)
            </p>
          </section>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Other Ways to Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Besides monetary donations, you can support our mission by:</p>
            <ul className="list-disc list-inside pl-4">
                <li>Sharing your experiences and insights within the app.</li>
                <li>Inviting others who might benefit from our community.</li>
                <li>Providing feedback on how we can improve the platform.</li>
                <li>Raising awareness about Morgellons disease.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
