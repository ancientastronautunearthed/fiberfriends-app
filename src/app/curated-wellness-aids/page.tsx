
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShoppingCart, ExternalLink, BookOpen } from "lucide-react";
import { Separator } from '@/components/ui/separator';

interface WellnessAid {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageAiHint: string;
  affiliateLink: string;
  category: string;
  subCategory?: 'Free' | 'Not Free'; // For books
}

const wellnessAids: WellnessAid[] = [
  { id: '1', name: "Nature's Bounty Acidophilus Probiotic, Daily Probiotic Supplement, Digestive Health, 200 Tablets, Twin Pack", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Probiotic-Nutritional-Supplements/zgbs/hpc/3774071", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'probiotic supplement', category: 'Supplements' },
  { id: '2', name: "NewRhythm Probiotics 50 Billion CFU 20 Strains, 60 Veggie Capsules", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Probiotic-Nutritional-Supplements/zgbs/hpc/3774071", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'probiotic capsules', category: 'Supplements' },
  { id: '3', name: "Carlyle Vitamin D3 5000 IU Softgels | 500 Count", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Vitamin-D-Supplements/b?ie=UTF8&node=3774781", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'vitamin D3 softgels', category: 'Supplements' },
  { id: '4', name: "Amazon Basics Vitamin D3 2000 IU Gummies, Orange, Lemon & Strawberry, 160 Count", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Vitamin-D-Supplements/b?ie=UTF8&node=3774781", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'vitamin D3 gummies', category: 'Supplements' },
  { id: '5', name: "NOW Foods Supplements, Zinc (Zinc Gluconate) 50 mg, 100 Tablets", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Zinc-Mineral-Supplements/zgbs/hpc/3774511", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'zinc supplement', category: 'Supplements' },
  { id: '6', name: "Nature’s Bounty Zinc 50mg, Immune Support & Antioxidant Supplement, Promotes Skin Health 250 Caplets", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Zinc-Mineral-Supplements/zgbs/hpc/3774511", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'zinc caplets', category: 'Supplements' },
  { id: '7', name: "Nature's Bounty Vitamin C + Rose HIPS, Immune Support, 1000mg, 100 Ct", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Vitamin-C-Supplements/zgbs/hpc/3774771", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'vitamin C supplement', category: 'Supplements' },
  { id: '8', name: "Nature Made Vitamin C 500 mg, Dietary Supplement for Immune Support, 100 Tablets, 100 Day Supply", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Vitamin-C-Supplements/zgbs/hpc/3774771", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'vitamin C tablets', category: 'Supplements' },
  { id: '9', name: "Nature Made Collagen Gummies with Vitamin C, Zinc and Biotin", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Collagen-Supplements/zgbs/hpc/3774321", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'collagen gummies', category: 'Supplements' },
  { id: '10', name: "NeoCell Super Collagen Peptides, Unflavored Powder, 7 oz.", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Collagen-Supplements/zgbs/hpc/3774321", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'collagen powder', category: 'Supplements' },
  { id: '11', name: "Carlyle Turmeric Curcumin with Black Pepper 3000mg | 90 Powder Capsules", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Turmeric-Herbal-Supplements/zgbs/hpc/3767191", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'turmeric capsules', category: 'Supplements' },
  { id: '12', name: "Nature's Bounty Turmeric with Black Pepper Extract, 1000mg, 60 Capsules", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Turmeric-Herbal-Supplements/zgbs/hpc/3767191", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'turmeric supplement', category: 'Supplements' },
  { id: '13', name: "Doctors Best MSM, Supports Hair, Skin, Nails, & Joints, 120 Tablets", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-MSM-Nutritional-Supplements/zgbs/hpc/3773901", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'MSM tablets', category: 'Supplements' },
  { id: '14', name: "Doctors Best MSM Powder, 8.8 oz (250 Grams)", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-MSM-Nutritional-Supplements/zgbs/hpc/3773901", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'MSM powder', category: 'Supplements' },
  { id: '15', name: "Amazon Basics Omega 3 Fish Oil, 1000 mg, 90 Softgels", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Fish-Oil-Nutritional-Supplements/zgbs/hpc/10728501", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'fish oil softgels', category: 'Supplements' },
  { id: '16', name: "Amazon Basics Fish Oil 303 mg, Lemon, Orange & Strawberry-Banana flavors, 90 Gummies", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Fish-Oil-Nutritional-Supplements/zgbs/hpc/10728501", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'fish oil gummies', category: 'Supplements' },
  { id: '17', name: "Amazing Formulas Bromelain 500 Mg 120 Tablets Supplement", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Bromelain-Nutritional-Supplements/zgbs/hpc/3773301", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'bromelain supplement', category: 'Supplements' },
  { id: '18', name: "Best Naturals Bromelain Proteolytic Digestive Enzymes Supplements, 500 mg, 120 Tablets", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Bromelain-Nutritional-Supplements/zgbs/hpc/3773301", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'digestive enzymes', category: 'Supplements' },
  { id: '19', name: "NatureWise Vitamin B Complex for Women and Men - 60 Softgels", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Vitamin-B-Complex-Supplements/zgbs/hpc/3774761", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'vitamin B complex', category: 'Supplements' },
  { id: '20', name: "Life Extension Bioactive Complete B-Complex, 60 Vegetarian Capsules", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Vitamin-B-Complex-Supplements/zgbs/hpc/3774761", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'B-complex capsules', category: 'Supplements' },
  { id: '21', name: "Nature's Bounty Magnesium Supplements - Magnesium 500 Mg Tablets for Bone & Muscle Health, 200 Count", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Magnesium-Mineral-Supplements/zgbs/hpc/3774411", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'magnesium tablets', category: 'Supplements' },
  { id: '22', name: "Magnesium Glycinate 400mg, 180 Capsules (Vegan Safe, Third Party Tested, Gluten Free, Non-GMO)", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Magnesium-Mineral-Supplements/zgbs/hpc/3774411", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'magnesium glycinate', category: 'Supplements' },
  
  { id: '23', name: "Bumble Bee Canned Pink Salmon, 14.75 oz Can - Premium Wild Caught Salmon with Skin & Bones", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Salmon-Canned/s?k=Salmon+Canned", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'salmon can', category: 'Food Items' },
  { id: '24', name: "StarKist Wild Alaskan Pink Salmon - 14.75 oz. Can", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Canned-Packaged-Salmon/zgbs/grocery/11194507011", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'canned salmon', category: 'Food Items' },
  { id: '25', name: "Amazon Brand - Happy Belly California Walnuts Halves and Pieces, 40 ounce", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/walnuts-bulk/s?k=walnuts+bulk", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'walnuts bag', category: 'Food Items' },
  { id: '26', name: "365 by Whole Foods Market, Walnut Halves & Pieces, 16 Ounce", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/walnuts-bulk/s?k=walnuts+bulk", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'walnuts container', category: 'Food Items' },
  { id: '27', name: "Organic Mixed Berries, 2 Pounds — Non-GMO Dried Blueberries, Cranberries, and Tart Cherries", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Organic-Mixed-Berries-Pounds-Blueberries/dp/B07MGBQYW3", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'dried berries', category: 'Food Items' },
  { id: '28', name: "Organic Mixed Berries, 8 Ounce (Pack of 1)", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Organic-Mixed-Berries-Pounds-Blueberries/dp/B07MGBQYW3", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'mixed berries pack', category: 'Food Items' },
  { id: '29', name: "Organic Spice Resource Turmeric Root Powder, 8 oz (226 g)", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/turmeric-powder/s?k=turmeric+powder", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'turmeric powder', category: 'Food Items' },
  { id: '30', name: "FGO Organic Turmeric Powder w/Curcumin, 8oz Resealable Pouch", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/turmeric-powder/s?k=turmeric+powder", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'organic turmeric', category: 'Food Items' },
  { id: '31', name: "Organic Ginger Root (fresh)", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Fresh-Ginger/b?ie=UTF8&node=6507158011", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'ginger root', category: 'Food Items' },
  { id: '32', name: "Fresh Ginger Root / Adrak - 1lb", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Fresh-Ginger/b?ie=UTF8&node=6507158011", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'fresh ginger', category: 'Food Items' },
  { id: '33', name: "Pompeian Smooth Extra Virgin Olive Oil, 68 Fl Oz", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Olive-Oils/zgbs/grocery/16320381", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'olive oil bottle', category: 'Food Items' },
  { id: '34', name: "SULU ORGANICS 64 FL.OZ Organic Extra Virgin Olive Oil Cold Pressed", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/FL-OZ-Certified-Organic-Virgin-Pressed/dp/B086CYTN5R", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'organic olive oil', category: 'Food Items' },
  
  { id: '35', name: "Prince of Peace 100% Organic Tea, BEST VALUE Family Size, 200 Tea Bags (Organic Green Tea)", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/organic-green-tea/s?k=organic+green+tea", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'green tea bags', category: 'Beverages' },
  { id: '36', name: "FGO Organic Green Tea, 100 Count Eco-Conscious Tea Bags", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/organic-green-tea/s?k=organic+green+tea", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'organic tea box', category: 'Beverages' },
  
  { id: '37', name: "Results RNA - ACS 200 Silver-Glutathione Gel – 2 oz", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/colloidal-silver-gel/s?k=colloidal+silver+gel", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'silver gel tube', category: 'Topicals' },
  { id: '38', name: "Colloidal Silver Gel - 4 oz", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/colloidal-silver-gel/s?k=colloidal+silver+gel", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'silver gel jar', category: 'Topicals' },
  { id: '39', name: "111MedCo 6% SULFUR Medicated 4oz. Skin Cleansing Soap Bar", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/111MedCo-SULFUR-Medicated-4oz-Cleansing/dp/B0CFG62H35", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'sulfur soap bar', category: 'Topicals' },
  { id: '40', name: "Biosulfur Grisi Acne Treatment Soap, 4.4 oz, 3-Pack", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Biosulfur-Sulfur-Treatment-Cleaner-Pimples/dp/B08QKRQN26", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'sulfur soap pack', category: 'Topicals' },
  { id: '41', name: "Medical Grade 100% Manuka Honey Gel Tube Natural Healing of Wounds 20g Pack of 1", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/manuka-honey-wounds/s?k=manuka+honey+for+wounds", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'manuka honey tube', category: 'Topicals' },
  { id: '42', name: "Medical Grade Honey Bandages (5 Pieces in 1 Pack) - 30% Honey", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/manuka-honey-bandages/s?k=manuka+honey+bandages", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'honey bandages', category: 'Topicals' },
  
  { id: '43', name: "Schylling NeeDoh Original - Sensory Fidget Toy", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/stress-relief-tools/s?k=stress+relief+tools", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'fidget toy', category: 'Wellness Tools' },
  { id: '44', name: "Mr. Pen- Spiky Sensory Rings, 10 Pack", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/stress-relief-tools/s?k=stress+relief+tools", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'sensory rings', category: 'Wellness Tools' },
  { id: '45', name: "Air Wick Essential Mist Diffuser, 1ct, Essential Oils Diffuser", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Cheap-Air-Diffusers/s?k=Cheap+Air+Diffusers", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'oil diffuser', category: 'Wellness Tools' },
  { id: '46', name: "Homeweeks Diffusers, 100ml Colorful Essential Oil Diffuser", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Cheap-Air-Diffusers/s?k=Cheap+Air+Diffusers", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'essential oil diffuser', category: 'Wellness Tools' },
  { id: '47', name: "Floor Pillow - Square Large Cushions for Adults, Dark Grey, 22 x 22 Inch", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/meditation-cushions/s?k=meditation+cushions", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'floor pillow', category: 'Wellness Tools' },
  { id: '48', name: "Retrospec Sedona Zafu Meditation Cushion Filled w/Buckwheat Hulls", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/meditation-cushions/s?k=meditation+cushions", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'meditation cushion', category: 'Wellness Tools' },
  { id: '49', name: "CAP Barbell Non-Slip Yoga & Fitness Mat", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/cheap-yoga-mats/s?k=cheap+yoga+mats", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'yoga mat', category: 'Wellness Tools' },
  { id: '50', name: "The Step Small Exercise Mat - Premium Workout Mat", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/cheap-yoga-mats/s?k=cheap+yoga+mats", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'exercise mat', category: 'Wellness Tools' },
  { id: '51', name: "Resistance Bands for Working Out, Exercise Bands Resistance Bands Set with 5 Resistance Levels", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Resistance-Bands-Light-Strength-Training-Equipment/s?rh=n%3A23533915011%2Cp_n_feature_eight_browse-bin%3A59788779011", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'resistance bands set', category: 'Wellness Tools' },
  { id: '52', name: "Fit Simplify Resistance Loop Exercise Bands with Instruction Guide and Carry Bag, Set of 5", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Resistance-Bands-Light-Strength-Training-Equipment/s?rh=n%3A23533915011%2Cp_n_feature_eight_browse-bin%3A59788779011", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'loop exercise bands', category: 'Wellness Tools' },
  { id: '53', name: "Yes4All High Density Half Round Foam Roller, 12\"", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Best-Sellers-Foam-Rollers/zgbs/sporting-goods/3407871", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'foam roller', category: 'Wellness Tools' },
  { id: '54', name: "Amazon Basics High Density Foam Roller for Exercise and Recovery, 12 Inches", description: "Check with your healthcare provider before using any new supplement or product.", affiliateLink: "https://www.amazon.com/Amazon-High-Density-Exercise-Massage-Recovery/dp/B09LWFFRRG", imageUrl: 'https://placehold.co/300x300.png', imageAiHint: 'high density foam roller', category: 'Wellness Tools' },

  // Books - Free
  { id: 'b1', name: "The Republic by Plato (Free eBook)", description: "Classic philosophical text, available for free on Project Gutenberg.", affiliateLink: "https://www.gutenberg.org/ebooks/1497", imageUrl: 'https://placehold.co/300x450.png', imageAiHint: 'classic book cover', category: 'Books', subCategory: 'Free' },
  { id: 'b2', name: "Meditations by Marcus Aurelius (Free eBook)", description: "Stoic philosophy for resilience and inner peace, free from Project Gutenberg.", affiliateLink: "https://www.gutenberg.org/ebooks/2680", imageUrl: 'https://placehold.co/300x450.png', imageAiHint: 'philosophy book', category: 'Books', subCategory: 'Free' },
  
  // Books - Not Free
  { id: 'b3', name: "The Body Keeps the Score by Bessel van der Kolk", description: "Explores trauma's impact on mind and body. (Paid Book)", affiliateLink: "https://www.amazon.com/Body-Keeps-Score-Healing-Trauma/dp/0143127748/", imageUrl: 'https://placehold.co/300x450.png', imageAiHint: 'psychology book cover', category: 'Books', subCategory: 'Not Free' },
  { id: 'b4', name: "Man's Search for Meaning by Viktor Frankl", description: "A psychiatrist's experience in Nazi death camps and his logotherapy. (Paid Book)", affiliateLink: "https://www.amazon.com/Mans-Search-Meaning-Viktor-Frankl/dp/080701429X/", imageUrl: 'https://placehold.co/300x450.png', imageAiHint: 'meaningful book', category: 'Books', subCategory: 'Not Free' },
];

const renderProductCard = (aid: WellnessAid) => (
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
      <CardTitle className="text-lg h-12 line-clamp-2">{aid.name}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-sm text-muted-foreground line-clamp-3">{aid.description}</p>
    </CardContent>
    <CardFooter>
      <Button asChild className="w-full">
        <a href={aid.affiliateLink} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          {aid.category === 'Books' && aid.subCategory === 'Free' ? 'Read Free eBook' : 
           aid.category === 'Books' ? 'View on Amazon' : 'View on Amazon'}
        </a>
      </Button>
    </CardFooter>
  </Card>
);


export default function CuratedWellnessAidsPage() {
  
  const groupedAids = wellnessAids.reduce((acc, aid) => {
    if (!acc[aid.category]) {
      acc[aid.category] = [];
    }
    acc[aid.category].push(aid);
    return acc;
  }, {} as Record<string, WellnessAid[]>);

  const orderedCategories = Object.keys(groupedAids).sort((a, b) => {
    // Ensure 'Books' category comes last
    if (a === 'Books') return 1;
    if (b === 'Books') return -1;
    return a.localeCompare(b);
  });


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Curated Wellness Aids
          </CardTitle>
          <CardDescription>
            A selection of products and books based on community input and general wellness principles. 
            These are shared for informational purposes. Please consult with your healthcare provider before trying new supplements or treatments.
            Links provided are for convenience and may be affiliate links, which help support Fiber Friends at no extra cost to you. 
            You will need to replace these with your specific product affiliate links for tracking.
          </CardDescription>
        </CardHeader>
      </Card>

      {orderedCategories.map((category) => {
        if (category === 'Books') {
          const books = groupedAids[category];
          const freeBooks = books.filter(book => book.subCategory === 'Free');
          const notFreeBooks = books.filter(book => book.subCategory === 'Not Free');

          return (
            <section key={category} className="space-y-6">
              <div className="flex items-center gap-2 pt-2">
                <BookOpen className="h-7 w-7 text-primary" />
                <h2 className="text-2xl font-headline font-semibold text-primary">{category}</h2>
                <Separator className="flex-grow bg-primary/30" />
              </div>
              
              {freeBooks.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-foreground/90 mt-4 mb-2">Free Books</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {freeBooks.map(renderProductCard)}
                  </div>
                </>
              )}

              {notFreeBooks.length > 0 && (
                 <>
                  <h3 className="text-xl font-semibold text-foreground/90 mt-6 mb-2">Recommended Reads (Not Free)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notFreeBooks.map(renderProductCard)}
                  </div>
                </>
              )}
               {freeBooks.length === 0 && notFreeBooks.length === 0 && (
                <p className="text-muted-foreground">No books listed in this category yet.</p>
               )}
            </section>
          );
        }
        
        // Default rendering for other categories
        return (
          <section key={category} className="space-y-4">
            <div className="flex items-center gap-2 pt-2">
              <h2 className="text-2xl font-headline font-semibold text-primary">{category}</h2>
              <Separator className="flex-grow bg-primary/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedAids[category].map(renderProductCard)}
            </div>
          </section>
        );
      })}
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="font-headline text-lg">Important Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>The products and books listed on this page are not medical advice and have not been evaluated by the FDA to diagnose, treat, cure, or prevent any disease. Fiber Friends does not endorse any specific product or treatment.</p>
            <p>Information provided is based on community input or general wellness knowledge. Always consult with a qualified healthcare professional before making any decisions about your health or treatment plan, especially when considering new supplements, products, or information from books.</p>
            <p>Individual results may vary. Fiber Friends is not responsible for the efficacy or safety of any products or information linked from this page.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    