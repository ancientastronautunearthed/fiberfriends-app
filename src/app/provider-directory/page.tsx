
'use client'; // Ensure this is at the top

import React, { useState } from 'react'; // Import useState
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Filter, PlusCircle, ShieldCheck, Send as SendIcon } from "lucide-react";
import Image from "next/image";
import SendMessageModal from '@/components/features/send-message-modal'; // Import the modal

interface Provider {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating?: number; 
  reviewsCount?: number; 
  philosophy: string;
  morgellonsExperience: string;
  imageUrl: string;
  imageAiHint: string;
  isTrusted?: boolean;
}

const mockProviders: Provider[] = [
  {
    id: "trusted-1",
    name: "Dr. Anya Sharma, MD",
    specialty: "Internal Medicine, Morgellons Research Advocate",
    location: "Community Health Institute (Online Consultations)",
    philosophy: "Empathetic listening, evidence-based exploration, and dedicated research to support the Morgellons community.",
    morgellonsExperience: "Lead Medical Advisor for Fiber Friends",
    imageUrl: "https://placehold.co/80x80.png",
    imageAiHint: "professional doctor",
    isTrusted: true,
  },
  {
    id: "1",
    name: "Dr. Evelyn Hayes, MD",
    specialty: "Integrative Medicine, Dermatology",
    location: "San Francisco, CA",
    rating: 4.8,
    reviewsCount: 32,
    philosophy: "Holistic approach, patient-centered care.",
    morgellonsExperience: "Positive, understanding",
    imageUrl: "https://placehold.co/80x80.png",
    imageAiHint: "doctor portrait",
  },
  {
    id: "2",
    name: "Dr. Kenji Tanaka, ND",
    specialty: "Naturopathic Medicine",
    location: "Portland, OR",
    rating: 4.5,
    reviewsCount: 19,
    philosophy: "Focus on root cause, natural therapies.",
    morgellonsExperience: "Knowledgeable, validating",
    imageUrl: "https://placehold.co/80x80.png",
    imageAiHint: "physician office",
  },
  {
    id: "3",
    name: "Wellness Clinic Plus",
    specialty: "Functional Medicine",
    location: "Austin, TX",
    rating: 4.2,
    reviewsCount: 25,
    philosophy: "Comprehensive testing and lifestyle changes.",
    morgellonsExperience: "Supportive, willing to learn",
    imageUrl: "https://placehold.co/80x80.png",
    imageAiHint: "clinic building",
  },
];

export default function ProviderDirectoryPage() {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messagingDoctorName, setMessagingDoctorName] = useState<string | null>(null);

  const handleSendMessageClick = (doctorName: string) => {
    setMessagingDoctorName(doctorName);
    setIsMessageModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Validated Provider Directory</CardTitle>
            <CardDescription>Find medical professionals who treat Morgellons with care and credibility. Reviews are based on Morgellons-specific experiences. Look for our Trusted Advisor!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <Input placeholder="Search by name or keyword..." />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ca">California</SelectItem>
                  <SelectItem value="or">Oregon</SelectItem>
                  <SelectItem value="tx">Texas</SelectItem>
                  <SelectItem value="all">All Regions</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="integrative">Integrative Medicine</SelectItem>
                  <SelectItem value="dermatology">Dermatology</SelectItem>
                  <SelectItem value="naturopathic">Naturopathic</SelectItem>
                  <SelectItem value="functional">Functional Medicine</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full"><Filter className="mr-2 h-4 w-4" />Apply Filters</Button>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Suggest a Provider</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProviders.map(provider => (
            <Card key={provider.id} className={`hover:shadow-lg transition-shadow ${provider.isTrusted ? 'border-2 border-primary bg-primary/5' : ''}`}>
              <CardHeader className="flex flex-row items-start gap-4">
                <Image src={provider.imageUrl} alt={provider.name} width={80} height={80} className="rounded-lg border object-cover" data-ai-hint={provider.imageAiHint} />
                <div>
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                  {provider.isTrusted && (
                    <Badge className="mt-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Lead Medical Advisor
                    </Badge>
                  )}
                  <CardDescription className="text-xs mt-1">{provider.specialty}</CardDescription>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" /> {provider.location}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {provider.rating && provider.reviewsCount && (
                  <div className="flex items-center">
                    {[...Array(Math.floor(provider.rating))].map((_, i) => <Star key={`full-${i}`} className="h-4 w-4 fill-primary text-primary" />)}
                    {provider.rating % 1 >= 0.5 && <Star key="half" className="h-4 w-4 fill-primary text-primary" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
                    {[...Array(5 - Math.ceil(provider.rating))].map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />)}
                    <span className="ml-1 text-xs text-muted-foreground">({provider.reviewsCount} reviews)</span>
                  </div>
                )}
                <p><strong>Treatment Philosophy:</strong> {provider.philosophy}</p>
                <p><strong>Morgellons Experience:</strong> <Badge variant={provider.morgellonsExperience.includes("Positive") || provider.morgellonsExperience.includes("Knowledgeable") || provider.isTrusted ? "default" : "secondary"}>{provider.morgellonsExperience}</Badge></p>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button variant="outline" className="w-full">View Profile & Reviews</Button>
                {provider.isTrusted && (
                  <Button className="w-full" onClick={() => handleSendMessageClick(provider.name)}>
                    <SendIcon className="mr-2 h-4 w-4" /> Send Message to Dr. Sharma
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
              <CardTitle className="font-headline text-lg">Preparing for Your Appointment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
              <p>Consider these tips when meeting a new provider:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                  <li>Write down your symptoms and questions beforehand.</li>
                  <li>Bring any relevant medical records or photos.</li>
                  <li>Be clear about your experiences and concerns.</li>
                  <li>It's okay to bring a friend or family member for support.</li>
              </ul>
          </CardContent>
        </Card>
      </div>
      <SendMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        doctorName={messagingDoctorName}
      />
    </>
  );
}
