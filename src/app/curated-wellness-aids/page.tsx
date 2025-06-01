
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShoppingCart, ExternalLink } from "lucide-react";

interface WellnessAid {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageAiHint: string;
  affiliateLink: string;
  category: string;
}

// --- Pre-Approved Product List ---
// Please provide your actual product details to replace these placeholders.
// Ensure 'affiliateLink' is your complete Amazon affiliate link for each product.
const wellnessAids: WellnessAid[] = [
  {
    id: '1',
    name: 'High-Quality Vitamin D3 Supplement',
    description: 'Supports immune health and bone strength. Many find D3 beneficial for overall well-being, especially if levels are low.',
    imageUrl: 'https://placehold.co/300x300.png',
    imageAiHint: 'supplement bottle',
    affiliateLink: 'YOUR_AMAZON_AFFILIATE_LINK_FOR_VITAMIN_D3_HERE',
    category: 'Supplements',
  },
  {
    id: '2',
    name: 'Gentle Magnesium Glycinate Capsules',
    description: 'Known for its calming effects and support for muscle relaxation and sleep. Generally well-tolerated.',
    imageUrl: 'https://placehold.co/300x300.png',
    imageAiHint: 'capsules bottle',
    affiliateLink: 'YOUR_AMAZON_AFFILIATE_LINK_FOR_MAGNESIUM_HERE',
    category: 'Supplements',
  },
  {
    id: '3',
    name: 'Soothing Calendula Cream',
    description: 'A natural topical cream often used for irritated or sensitive skin. Known for its gentle properties.',
    imageUrl: 'https://placehold.co/300x300.png',
    imageAiHint: 'cream jar',
    affiliateLink: 'YOUR_AMAZON_AFFILIATE_LINK_FOR_CALENDULA_CREAM_HERE',
    category: 'Topicals',
  },
  {
    id: '4',
    name: 'Red Light Therapy Device (Small Panel)',
    description: 'Some individuals explore red light therapy for skin health and inflammation. This is an example of a home-use panel.',
    imageUrl: 'https://placehold.co/300x300.png',
    imageAiHint: 'therapy device',
    affiliateLink: 'YOUR_AMAZON_AFFILIATE_LINK_FOR_RED_LIGHT_PANEL_HERE',
    category: 'Devices',
  }
];
// --- End of Pre-Approved Product List ---

export default function CuratedWellnessAidsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Curated Wellness Aids
          </CardTitle>
          <CardDescription>
            A selection of products that members of the community and our team have found potentially helpful or worth exploring. 
            These are shared for informational purposes. Please consult with your healthcare provider before trying new supplements or treatments.
            Links provided may be affiliate links, which help support Fiber Friends at no extra cost to you.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wellnessAids.map((aid) => (
          <Card key={aid.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-xl">
            <div className="relative w-full h-48 sm:h-56">
              <Image
                src={aid.imageUrl}
                alt={aid.name}
                layout="fill"
                objectFit="cover"
                data-ai-hint={aid.imageAiHint}
              />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{aid.name}</CardTitle>
              <CardDescription className="text-xs text-primary">{aid.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{aid.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <a href={aid.affiliateLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Amazon
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="font-headline text-lg">Important Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>The products listed on this page are not medical advice and have not been evaluated by the FDA to diagnose, treat, cure, or prevent any disease. Fiber Friends does not endorse any specific product or treatment.</p>
            <p>Information provided is based on anecdotal experiences from the community or general wellness knowledge. Always consult with a qualified healthcare professional before making any decisions about your health or treatment plan, especially when considering new supplements or products.</p>
            <p>Individual results may vary. Fiber Friends is not responsible for the efficacy or safety of any products linked from this page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
