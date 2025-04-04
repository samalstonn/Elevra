"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast"; // Assuming useToast hook exists

interface VendorContactFormProps {
  vendorName: string;
  vendorId: number; // Needed if the backend API requires it
  onClose: () => void; // Function to close the dialog
}

export function VendorContactForm({
  vendorName,
  vendorId,
  onClose,
}: VendorContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    // **Placeholder for actual API call**
    // In a real implementation, you would send this data to a backend endpoint
    // (e.g., /api/vendors/contact) which would then likely:
    // 1. Validate the data.
    // 2. Find the vendor's email address (securely).
    // 3. Send an email to the vendor with the message content.
    // 4. Potentially save the contact request in the database.

    console.log("Submitting contact form:", { vendorId, name, email, message });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Show success toast (using your existing useToast hook)
    toast({
      title: "Message Sent!",
      description: `Your message to ${vendorName} has not been sent successfully. (Not implemented yet)`,
      variant: "default", // Or 'success' if you have one
    });

    setIsSubmitting(false);
    onClose(); // Close the dialog after submission
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Contact {vendorName}</DialogTitle>
        <DialogDescription>
          Fill out the form below to send a message directly to {vendorName}.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          {/* Name Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Your Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              className="col-span-3"
              required
              disabled={isSubmitting}
            />
          </div>
          {/* Email Field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Your Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              className="col-span-3"
              required
              disabled={isSubmitting}
            />
          </div>
          {/* Message Field */}
          <div className="grid grid-cols-4 items-start gap-4">
            {" "}
            {/* Use items-start for textarea */}
            <Label htmlFor="message" className="text-right pt-2">
              {" "}
              {/* Add padding-top */}
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3 min-h-[100px]" // Set min height
              required
              disabled={isSubmitting}
              placeholder="Enter your message here..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
