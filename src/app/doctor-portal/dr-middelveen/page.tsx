
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, UserCheck, Microscope, Search, Download, Brain, Bone, Leaf, CookingPot, Pill, Bot, User, Users2, Sparkles, Settings2, Loader2, Send, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// Mock data interfaces
interface MockPatientData {
  id: string;
  name: string;
  email: string;
  monsterName: string;
  monsterImageUrl: string;
  monsterHealth: number;
  lastSymptomLogDate: string;
  commonSymptoms: string[];
  recentFoodEntries: { name: string; grade: 'good' | 'bad' | 'neutral' }[];
  recentExerciseEntries: { name: string; duration: number }[];
  trackedProducts: { name: string; benefitScore: number }[];
  trackedPrescriptions: { name: string; benefitScore: number }[];
}

const mockPatients: MockPatientData[] = [
  {
    id: 'patient123',
    name: 'Jane Doe (Mock)',
    email: 'jane.doe.mock@example.com',
    monsterName: 'Shadow Miasma',
    monsterImageUrl: 'https://placehold.co/80x80.png',
    monsterHealth: 65,
    lastSymptomLogDate: '2024-07-28',
    commonSymptoms: ['Fatigue', 'Brain Fog', 'Itching'],
    recentFoodEntries: [
      { name: 'Spinach Salad', grade: 'good' },
      { name: 'Dark Chocolate (70%)', grade: 'neutral' },
      { name: 'Pizza Slice', grade: 'bad' },
    ],
    recentExerciseEntries: [
      { name: 'Brisk Walk', duration: 30 },
      { name: 'Yoga', duration: 45 },
    ],
    trackedProducts: [
      { name: 'Vitamin D3 Supplement', benefitScore: 4 },
      { name: 'Magnesium Cream', benefitScore: 3 },
    ],
    trackedPrescriptions: [
        { name: 'Amoxicillin (Completed)', benefitScore: 10},
    ]
  }
];

interface AiAssistantConfig {
  name: string;
  gender: 'male' | 'female' | 'neutral';
  traits: string[];
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'assistant';
  text: string;
  timestamp: string;
}

const PERSONALITY_TRAITS_OPTIONS = [
  "Analytical & Data-Driven",
  "Empathetic & Patient-Focused",
  "Concise & Efficient",
  "Inquisitive & Research-Oriented",
  "Formal & Professional",
];

const ASSISTANT_CONFIG_KEY = 'drMiddelveenAiAssistantConfig';

export default function DrMiddelveenPortalPage() {
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<MockPatientData | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);

  // AI Assistant State
  const [assistantConfig, setAssistantConfig] = useState<AiAssistantConfig | null>(null);
  const [assistantNameInput, setAssistantNameInput] = useState('');
  const [assistantGenderInput, setAssistantGenderInput] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [selectedTraitsInput, setSelectedTraitsInput] = useState<string[]>([]);
  const [isConfiguringAssistant, setIsConfiguringAssistant] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);


  useEffect(() => {
    const storedConfig = localStorage.getItem(ASSISTANT_CONFIG_KEY);
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig) as AiAssistantConfig;
        setAssistantConfig(parsedConfig);
        setIsConfiguringAssistant(false);
      } catch (e) {
        console.error("Error parsing assistant config from localStorage", e);
        localStorage.removeItem(ASSISTANT_CONFIG_KEY); // Clear corrupted data
        setIsConfiguringAssistant(true);
      }
    } else {
      setIsConfiguringAssistant(true);
    }
  }, []);


  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientSearchTerm.trim()) return;
    setIsLoadingPatient(true);
    setTimeout(() => {
      const foundPatient = mockPatients.find(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase().trim()) || p.email.toLowerCase().includes(patientSearchTerm.toLowerCase().trim()));
      setSelectedPatient(foundPatient || null);
      setIsLoadingPatient(false);
    }, 1000);
  };

  const handleActivateAssistant = () => {
    if (!assistantNameInput.trim() || selectedTraitsInput.length === 0) {
      alert("Please provide a name and select at least one personality trait for your assistant.");
      return;
    }
    const newConfig: AiAssistantConfig = {
      name: assistantNameInput,
      gender: assistantGenderInput,
      traits: selectedTraitsInput,
    };
    setAssistantConfig(newConfig);
    localStorage.setItem(ASSISTANT_CONFIG_KEY, JSON.stringify(newConfig));
    setIsConfiguringAssistant(false);
    setChatHistory([]); // Reset chat history for new assistant
  };
  
  const handleReconfigureAssistant = () => {
    setIsConfiguringAssistant(true);
    setAssistantConfig(null);
    localStorage.removeItem(ASSISTANT_CONFIG_KEY);
    // Optionally reset input fields
    setAssistantNameInput('');
    setAssistantGenderInput('neutral');
    setSelectedTraitsInput([]);
    setChatHistory([]);
  };

  const handleTraitToggle = (trait: string, checked: boolean) => {
    setSelectedTraitsInput(prev =>
      checked ? [...prev, trait] : prev.filter(t => t !== trait)
    );
  };

  const handleAskAssistant = async () => {
    if (!currentQuery.trim() || !assistantConfig) return;
    const userMessage: ChatMessage = {
      id: `doc-${Date.now()}`,
      sender: 'doctor',
      text: currentQuery,
      timestamp: new Date().toISOString(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    setCurrentQuery('');
    setIsAssistantThinking(true);

    // Simulate AI response
    setTimeout(() => {
      let responseText = `This is a simulated response from ${assistantConfig.name}. `;
      if (currentQuery.toLowerCase().includes("patient summary") && selectedPatient) {
        responseText += `Regarding patient ${selectedPatient.name}: [Mock detailed summary based on logs - symptoms: ${selectedPatient.commonSymptoms.join(', ')}, recent good food: ${selectedPatient.recentFoodEntries.find(f=>f.grade==='good')?.name || 'N/A'}...]`;
      } else if (currentQuery.toLowerCase().includes("patient summary")) {
        responseText += "Please select a patient first to get a summary.";
      } else if (currentQuery.toLowerCase().includes("research on")) {
        const topic = currentQuery.toLowerCase().split("research on")[1]?.trim() || "the provided topic";
        responseText += `Simulating research for "${topic}": [Mock research findings about ${topic} including prevalence, common treatments, recent studies...]`;
      } else if (currentQuery.toLowerCase().includes("analytical data") || currentQuery.toLowerCase().includes("analytics")) {
        responseText += "Simulating analytical data gathering: [Mock aggregated data on common symptoms, product effectiveness, etc. presented as text for now]. Charts and tables would be richer here.";
      } else if (currentQuery.toLowerCase().includes("schedule appointment")) {
        responseText += "Simulating appointment scheduling: [A calendar interface or confirmation for scheduling would appear here].";
      } else {
        responseText += "I am processing your query: '" + userMessage.text + "'. As a prototype, my capabilities are illustrative.";
      }

      if (assistantConfig.traits.includes("Analytical & Data-Driven")) responseText = `From an analytical perspective: ${responseText}`;
      if (assistantConfig.traits.includes("Empathetic & Patient-Focused")) responseText = `Understanding the patient context is key. ${responseText}`;
      if (assistantConfig.traits.includes("Concise & Efficient")) responseText = `To summarize: ${responseText.substring(0, 200)}...`;

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, assistantMessage]);
      setIsAssistantThinking(false);
    }, 1500 + Math.random() * 1000);
  };
  
  const getAssistantIcon = () => {
    if (assistantConfig?.gender === 'male') return <User className="h-10 w-10 text-blue-500" />;
    if (assistantConfig?.gender === 'female') return <User className="h-10 w-10 text-pink-500" />;
    return <Bot className="h-10 w-10 text-gray-500" />;
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-3">
            <Image src="https://placehold.co/60x60.png" alt="Dr. Middelveen" width={60} height={60} className="rounded-full border-2 border-primary" data-ai-hint="doctor professional woman"/>
            Dr. Marianne J. Middelveen - Research & Consultation Portal
          </CardTitle>
          <CardDescription>
            Access to anonymized aggregated research data, consented patient profiles, and your AI Research Assistant.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="font-semibold">Prototype & Security Notice</AlertTitle>
                <AlertDescription className="text-sm">
                    This portal is a <strong>prototype for demonstration purposes</strong>. All data displayed is illustrative and mock.
                    In a production system, robust security, strict anonymization techniques, and explicit patient consent mechanisms would be paramount, adhering to all relevant data privacy regulations (e.g., HIPAA).
                    Access to this portal would require separate, secure authentication and authorization for verified medical professionals.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
      
      {/* AI Research Assistant Section */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Sparkles className="text-primary h-6 w-6"/>AI Research Assistant
            </CardTitle>
            <CardDescription>Your personalized AI to help with data analysis, research, and patient summaries.</CardDescription>
          </div>
          {!isConfiguringAssistant && assistantConfig && (
             <Button variant="outline" size="sm" onClick={handleReconfigureAssistant}><Settings2 className="mr-2 h-4 w-4"/>Reconfigure</Button>
          )}
        </CardHeader>
        <CardContent>
          {isConfiguringAssistant ? (
            <div className="space-y-4 p-2 border border-dashed rounded-md">
              <h3 className="font-semibold text-lg text-center">Configure Your AI Assistant</h3>
              <div>
                <Label htmlFor="assistant-name">Assistant Name</Label>
                <Input id="assistant-name" value={assistantNameInput} onChange={(e) => setAssistantNameInput(e.target.value)} placeholder="e.g., Analyzer, InsightBot" />
              </div>
              <div>
                <Label>Assistant Gender Persona</Label>
                <RadioGroup value={assistantGenderInput} onValueChange={(v) => setAssistantGenderInput(v as any)} className="flex gap-4 pt-1">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="gender-male" /><Label htmlFor="gender-male" className="font-normal">Male</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="gender-female" /><Label htmlFor="gender-female" className="font-normal">Female</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="neutral" id="gender-neutral" /><Label htmlFor="gender-neutral" className="font-normal">Neutral/Unspecified</Label></div>
                </RadioGroup>
              </div>
              <div>
                <Label>Personality Traits (Select up to 3)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {PERSONALITY_TRAITS_OPTIONS.map(trait => (
                    <div key={trait} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`trait-${trait.toLowerCase().replace(/\W/g, '-')}`} 
                        checked={selectedTraitsInput.includes(trait)}
                        onCheckedChange={(checked) => handleTraitToggle(trait, !!checked)}
                        disabled={selectedTraitsInput.length >= 3 && !selectedTraitsInput.includes(trait)}
                      />
                      <Label htmlFor={`trait-${trait.toLowerCase().replace(/\W/g, '-')}`} className="font-normal text-sm">{trait}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleActivateAssistant} className="w-full" disabled={!assistantNameInput.trim() || selectedTraitsInput.length === 0}>Activate Assistant</Button>
            </div>
          ) : assistantConfig ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                {getAssistantIcon()}
                <div>
                  <h3 className="text-lg font-semibold">{assistantConfig.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{assistantConfig.gender} Persona</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assistantConfig.traits.map(trait => <Badge key={trait} variant="secondary">{trait}</Badge>)}
                  </div>
                </div>
              </div>
              <ScrollArea className="h-[300px] border rounded-md p-3 space-y-3 bg-background">
                {chatHistory.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Ask your assistant a question to begin...</p>}
                {chatHistory.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-2.5 rounded-lg shadow-sm ${msg.sender === 'doctor' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'doctor' ? 'text-primary-foreground/70 text-right' : 'text-secondary-foreground/70'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isAssistantThinking && (
                    <div className="flex justify-start">
                        <div className="max-w-[75%] p-2.5 rounded-lg shadow-sm bg-secondary text-secondary-foreground">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        </div>
                    </div>
                )}
              </ScrollArea>
              <div className="flex gap-2 items-center pt-2">
                <Input 
                    value={currentQuery} 
                    onChange={(e) => setCurrentQuery(e.target.value)}
                    placeholder={`Ask ${assistantConfig.name}... (e.g., "Summarize patient ${selectedPatient?.name || 'ID:123'}", "Research latest on skin lesions")`}
                    onKeyPress={(e) => e.key === 'Enter' && !isAssistantThinking && handleAskAssistant()}
                    disabled={isAssistantThinking}
                />
                <Button onClick={handleAskAssistant} disabled={!currentQuery.trim() || isAssistantThinking}>
                    {isAssistantThinking ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><BarChart3 className="text-primary"/>Aggregated Anonymous Research Data</CardTitle>
          <CardDescription>Overview of trends and patterns from all anonymized user data. (Data below is illustrative)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-md flex items-center gap-1.5"><Brain className="h-4 w-4"/>Symptom Frequency</h3>
              <p className="text-sm text-muted-foreground">Placeholder for symptom frequency chart. (e.g., Itching: 75%, Fatigue: 60%)</p>
              <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs mt-2" data-ai-hint="bar chart mockup">Mock Chart Area</div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-md flex items-center gap-1.5"><CookingPot className="h-4 w-4"/>Common Food Correlations</h3>
              <p className="text-sm text-muted-foreground">Placeholder for food correlation insights. (e.g., High sugar intake correlated with increased fatigue for 30% of users)</p>
              <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs mt-2" data-ai-hint="scatter plot mockup">Mock Insights Area</div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-md flex items-center gap-1.5"><Leaf className="h-4 w-4"/>Product Effectiveness Overview</h3>
              <p className="text-sm text-muted-foreground">Placeholder for product effectiveness summary. (e.g., "Vitamin D" reported beneficial by 55% of users tracking it)</p>
               <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs mt-2" data-ai-hint="data table mockup">Mock Table/Summary Area</div>
            </Card>
             <Card className="p-4">
              <h3 className="font-semibold mb-2 text-md flex items-center gap-1.5"><Pill className="h-4 w-4"/>Prescription Usage Patterns</h3>
              <p className="text-sm text-muted-foreground">Placeholder for prescription trends. (e.g., 20% of users logging Amoxicillin reported significant improvement)</p>
               <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs mt-2" data-ai-hint="pie chart mockup">Mock Chart Area</div>
            </Card>
          </div>
          <div className="pt-2 text-right">
            <Button variant="outline" disabled><Download className="mr-2 h-4 w-4"/>Download Anonymized Dataset (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><UserCheck className="text-primary"/>Patient Profile Access (Requires Consent)</CardTitle>
          <CardDescription>Search for and view detailed profiles of patients who have consented to share their data for consultation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchPatient} className="flex items-center gap-2 mb-6">
            <Input
              type="search"
              placeholder="Search by patient name or ID..."
              value={patientSearchTerm}
              onChange={(e) => setPatientSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoadingPatient || !patientSearchTerm.trim()}>
              {isLoadingPatient ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
              Search
            </Button>
          </form>

          {isLoadingPatient && (
            <div className="text-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Searching for patient...</p>
            </div>
          )}

          {!isLoadingPatient && patientSearchTerm && !selectedPatient && (
            <Alert variant="default">
              <AlertTitle>No Patient Found</AlertTitle>
              <AlertDescription>No patient matching "{patientSearchTerm}" found or consent not granted. Please ensure the patient has shared their profile with you.</AlertDescription>
            </Alert>
          )}
          
          {selectedPatient && !isLoadingPatient && (
            <Card className="bg-card/50 p-4">
              <CardHeader className="flex flex-row items-center gap-4 pb-3">
                 <Image src={selectedPatient.monsterImageUrl} alt={selectedPatient.monsterName} width={64} height={64} className="rounded-lg border" data-ai-hint="fantasy monster"/>
                 <div>
                    <CardTitle className="text-lg">{selectedPatient.name}</CardTitle>
                    <CardDescription>{selectedPatient.email}</CardDescription>
                 </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-4">
                  <h4 className="font-semibold text-md">Monster Details:</h4>
                  <p className="text-sm">Name: <Badge variant="secondary">{selectedPatient.monsterName}</Badge></p>
                  <p className="text-sm">Current Health: <Badge variant={selectedPatient.monsterHealth < 50 ? "destructive" : "default"}>{selectedPatient.monsterHealth}%</Badge></p>
                  
                  <h4 className="font-semibold text-md mt-3">Symptom Overview:</h4>
                  <p className="text-sm">Last Logged: {selectedPatient.lastSymptomLogDate}</p>
                  <p className="text-sm">Commonly Reported: {selectedPatient.commonSymptoms.join(', ') || 'N/A'}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Symptom Journal (Mock)</Button>

                  <h4 className="font-semibold text-md mt-3">Dietary Log Summary:</h4>
                  <ul className="list-disc list-inside pl-4 text-sm">
                    {selectedPatient.recentFoodEntries.map((food, i) => (
                      <li key={`food-${i}`}>{food.name} - <Badge variant={food.grade === 'good' ? 'default' : food.grade === 'bad' ? 'destructive' : 'secondary'}>{food.grade}</Badge></li>
                    ))}
                  </ul>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Food Log (Mock)</Button>

                  <h4 className="font-semibold text-md mt-3">Exercise Log Summary:</h4>
                   <ul className="list-disc list-inside pl-4 text-sm">
                    {selectedPatient.recentExerciseEntries.map((ex, i) => (
                      <li key={`ex-${i}`}>{ex.name} - {ex.duration} mins</li>
                    ))}
                  </ul>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Exercise Log (Mock)</Button>
                  
                  <h4 className="font-semibold text-md mt-3">Tracked Products Summary:</h4>
                  <ul className="list-disc list-inside pl-4 text-sm">
                    {selectedPatient.trackedProducts.map((prod, i) => (
                      <li key={`prod-${i}`}>{prod.name} (Benefit: {prod.benefitScore}/5)</li>
                    ))}
                  </ul>
                   <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Product Tracker (Mock)</Button>
                  
                  <h4 className="font-semibold text-md mt-3">Tracked Prescriptions Summary:</h4>
                  <ul className="list-disc list-inside pl-4 text-sm">
                    {selectedPatient.trackedPrescriptions.map((rx, i) => (
                      <li key={`rx-${i}`}>{rx.name} (Benefit: {rx.benefitScore}/15)</li>
                    ))}
                  </ul>
                   <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Prescription Tracker (Mock)</Button>
                </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setSelectedPatient(null)}>Close Patient View</Button>
              </CardFooter>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    
