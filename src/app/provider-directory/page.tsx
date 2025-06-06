
'use client'; // Ensure this is at the top

import React, { useState } from 'react'; // Import useState
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Filter, PlusCircle, ShieldCheck, Send as SendIcon, Info } from "lucide-react";
import Image from "next/image";
import SendMessageModal from '@/components/features/send-message-modal'; // Import the modal
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

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
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // State for suggestion modal
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestedProviderName, setSuggestedProviderName] = useState('');
  const [suggestedProviderSpecialty, setSuggestedProviderSpecialty] = useState('');
  const [suggestedProviderLocation, setSuggestedProviderLocation] = useState('');
  const [suggestedProviderReason, setSuggestedProviderReason] = useState('');
  const [suggestedProviderContact, setSuggestedProviderContact] = useState('');


  const handleSendMessageClick = (doctorName: string) => {
    setMessagingDoctorName(doctorName);
    setIsMessageModalOpen(true);
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedProviderName.trim() || !suggestedProviderSpecialty.trim() || !suggestedProviderLocation.trim() || !suggestedProviderReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least Name, Specialty, Location, and Reason.",
        variant: "destructive",
      });
      return;
    }
    console.log("Provider Suggestion Submitted:", {
      name: suggestedProviderName,
      specialty: suggestedProviderSpecialty,
      location: suggestedProviderLocation,
      reason: suggestedProviderReason,
      contact: suggestedProviderContact,
    });
    toast({
      title: "Suggestion Received!",
      description: `Thank you for suggesting ${suggestedProviderName}. Our team will review it.`,
    });
    setIsSuggestModalOpen(false);
    // Clear form
    setSuggestedProviderName('');
    setSuggestedProviderSpecialty('');
    setSuggestedProviderLocation('');
    setSuggestedProviderReason('');
    setSuggestedProviderContact('');
  };

  const filteredProviders = mockProviders.filter(provider => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      provider.name.toLowerCase().includes(lowerSearchTerm) ||
      provider.specialty.toLowerCase().includes(lowerSearchTerm) ||
      provider.location.toLowerCase().includes(lowerSearchTerm) ||
      provider.morgellonsExperience.toLowerCase().includes(lowerSearchTerm)
    );
  });


  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Validated Provider Directory</CardTitle>
            <CardDescription>
              Find trusted Medical Specialists with experience in Morgellons. Reviews are based on Morgellons-specific experiences. Look for our Lead Medical Advisor!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <Input
                placeholder="Search by name, location (city/state), or keyword..."
                className="flex-grow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {/* The Apply Filters button can be kept for future enhanced filtering logic */}
              {/* <Button className="w-full sm:w-auto"><Filter className="mr-2 h-4 w-4" />Apply Filters</Button> */}
            </div>
             <Alert variant="default" className="mt-4 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="font-semibold">Expanding Our Network</AlertTitle>
                <AlertDescription className="text-sm">
                    If you don't see a provider in your state, please check back regularly. We are continuously working to expand our network and aim to have at least one validated specialist in every state and grow internationally.
                </AlertDescription>
            </Alert>
            <div className="flex justify-end mt-4">
              <Dialog open={isSuggestModalOpen} onOpenChange={setIsSuggestModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Suggest a Provider</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Suggest a Provider</DialogTitle>
                    <DialogDescription>
                      Help us grow our directory by suggesting a provider you trust or know has experience with Morgellons.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSuggestionSubmit}>
                    <div className="py-4 space-y-3">
                      <div>
                        <Label htmlFor="suggest-name">Provider's Name <span className="text-destructive">*</span></Label>
                        <Input id="suggest-name" value={suggestedProviderName} onChange={(e) => setSuggestedProviderName(e.target.value)} placeholder="e.g., Dr. Jane Smith" required />
                      </div>
                      <div>
                        <Label htmlFor="suggest-specialty">Specialty <span className="text-destructive">*</span></Label>
                        <Input id="suggest-specialty" value={suggestedProviderSpecialty} onChange={(e) => setSuggestedProviderSpecialty(e.target.value)} placeholder="e.g., Dermatologist, Internist" required />
                      </div>
                      <div>
                        <Label htmlFor="suggest-location">Location (City, State) <span className="text-destructive">*</span></Label>
                        <Input id="suggest-location" value={suggestedProviderLocation} onChange={(e) => setSuggestedProviderLocation(e.target.value)} placeholder="e.g., Anytown, CA" required />
                      </div>
                      <div>
                        <Label htmlFor="suggest-reason">Reason for Suggestion / Experience <span className="text-destructive">*</span></Label>
                        <Textarea id="suggest-reason" value={suggestedProviderReason} onChange={(e) => setSuggestedProviderReason(e.target.value)} placeholder="Describe why you're suggesting this provider..." className="min-h-[100px]" required/>
                      </div>
                      <div>
                        <Label htmlFor="suggest-contact">Provider Contact (Website/Phone - Optional)</Label>
                        <Input id="suggest-contact" value={suggestedProviderContact} onChange={(e) => setSuggestedProviderContact(e.target.value)} placeholder="e.g., www.drsmith.com or 555-1234" />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit">Submit Suggestion</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map(provider => (
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
                <p><strong>Morgellons Experience:</strong> <Badge variant={provider.morgellonsExperience.includes("Positive") || provider.morgellonsExperience.includes("Knowledgeable") || provider.morgellonsExperience.includes("Lead Medical Advisor") ? "default" : "secondary"}>{provider.morgellonsExperience}</Badge></p>
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
           {filteredProviders.length === 0 && searchTerm && (
            <Card className="md:col-span-2 lg:col-span-3 p-6 text-center text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>No providers found matching "{searchTerm}". Try a broader search term or check back later as our network grows.</p>
            </Card>
          )}
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
