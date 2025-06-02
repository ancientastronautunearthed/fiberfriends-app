
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string | null;
}

export default function SendMessageModal({ isOpen, onClose, doctorName }: SendMessageModalProps) {
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setMessageBody('');
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!doctorName) return;
    if (!subject.trim() || !messageBody.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a subject and message body.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Simulate sending message
    console.log(`Simulated message to ${doctorName}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${messageBody}`);

    toast({
      title: `Message to ${doctorName} "Sent" (Simulation)`,
      description: `Subject: ${subject}`,
      duration: 5000,
    });
    onClose(); // Close the modal after "sending"
  };

  if (!isOpen || !doctorName) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Send Message to {doctorName}</DialogTitle>
          <DialogDescription>
            Compose your message below. This is a simulated feature for demonstration.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="message-subject" className="text-right">
              Subject
            </Label>
            <Input
              id="message-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Regarding my symptoms..."
              className="col-span-3"
            />
          </div>
          <div>
            <Label htmlFor="message-body" className="text-right">
              Message
            </Label>
            <Textarea
              id="message-body"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Dear Dr. Sharma, ..."
              className="col-span-3 min-h-[150px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSendMessage}>
            <Send className="mr-2 h-4 w-4" /> Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
