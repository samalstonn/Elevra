"use client"; // This component uses hooks and state

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose, // Import DialogClose for explicit closing
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast"; // Assuming useToast hook exists

// Define the schema for the contact form using Zod
const contactFormSchema = z.object({
  // Assuming the user sending the message is logged in,
  // we might get their email/name from the session later.
  // For now, let's include basic fields.
  senderName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." }),
  senderEmail: z
    .string()
    .email({ message: "Please enter a valid email address." }),
  subject: z
    .string()
    .min(3, { message: "Subject must be at least 3 characters." }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." }),
  vendorId: z.number(), // Hidden field to know who the message is for
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// Define props for the dialog component
interface VendorContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  vendorName: string;
  vendorId: number;
}

export default function VendorContactFormDialog({
  isOpen,
  onOpenChange,
  vendorName,
  vendorId,
}: VendorContactFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize react-hook-form
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      senderName: "",
      senderEmail: "",
      subject: "",
      message: "",
      vendorId: vendorId, // Set the vendorId from props
    },
  });

  // Handle form submission
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    console.log("Contact form submitted:", data);

    // --- Placeholder for API call ---
    // In a real application, you would send this data to your backend API
    // Example:
    // try {
    //   const response = await fetch('/api/vendor/contact', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data),
    //   });
    //   if (!response.ok) {
    //     throw new Error('Failed to send message');
    //   }
    //   toast({ title: "Success!", description: "Your message has been sent." });
    //   form.reset(); // Clear the form
    //   onOpenChange(false); // Close the dialog
    // } catch (error) {
    //   console.error("Failed to send message:", error);
    //   toast({ title: "Error", description: "Could not send message. Please try again.", variant: "destructive" });
    // } finally {
    //   setIsSubmitting(false);
    // }

    // --- Mock Success for Demo ---
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
    toast({
      title: "Message Sent (Demo)",
      description: "Your message would be sent in a real app.",
    });
    form.reset();
    onOpenChange(false); // Close dialog on successful submission
    setIsSubmitting(false);
    // --- End Mock Success ---
  };

  // Reset form when dialog closes or vendorId changes
  React.useEffect(() => {
    if (!isOpen) {
      form.reset({
        senderName: "",
        senderEmail: "",
        subject: "",
        message: "",
        vendorId: vendorId, // Reset with potentially new vendorId
      });
    } else {
      // Ensure vendorId is up-to-date if dialog stays open but context changes (unlikely here)
      form.setValue("vendorId", vendorId);
    }
  }, [isOpen, vendorId, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send a Message to {vendorName}</DialogTitle>
          <DialogDescription>
            Fill out the form below to contact this vendor.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-4"
        >
          {/* Hidden Vendor ID */}
          <input type="hidden" {...form.register("vendorId")} />

          {/* Sender Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="senderName" className="text-right">
              Your Name
            </Label>
            <div className="col-span-3">
              <Input
                id="senderName"
                {...form.register("senderName")}
                className={
                  form.formState.errors.senderName ? "border-red-500" : ""
                }
                disabled={isSubmitting}
              />
              {form.formState.errors.senderName && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.senderName.message}
                </p>
              )}
            </div>
          </div>

          {/* Sender Email */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="senderEmail" className="text-right">
              Your Email
            </Label>
            <div className="col-span-3">
              <Input
                id="senderEmail"
                type="email"
                {...form.register("senderEmail")}
                className={
                  form.formState.errors.senderEmail ? "border-red-500" : ""
                }
                disabled={isSubmitting}
              />
              {form.formState.errors.senderEmail && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.senderEmail.message}
                </p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <div className="col-span-3">
              <Input
                id="subject"
                {...form.register("subject")}
                className={
                  form.formState.errors.subject ? "border-red-500" : ""
                }
                disabled={isSubmitting}
              />
              {form.formState.errors.subject && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.subject.message}
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right">
              Message
            </Label>
            <div className="col-span-3">
              <Textarea
                id="message"
                {...form.register("message")}
                className={`min-h-[100px] ${
                  form.formState.errors.message ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {form.formState.errors.message && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer with Buttons */}
          <DialogFooter>
            {/* Add a Close button */}
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="bg-[#f2f0f4] text-[#141118]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-[#8019e6] text-white hover:bg-[#6714b8]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
