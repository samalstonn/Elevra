"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Loader2, Mail, MessageSquare, UserPlus } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  candidateId: z.string().min(1, {
    message: "Please select a candidate",
  }),
  personalMessage: z
    .string()
    .min(10, {
      message: "Personal message must be at least 10 characters.",
    })
    .max(500, {
      message: "Personal message cannot exceed 500 characters.",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface TestimonialRequestFormProps {
  vendorId: number;
  candidates: Array<{
    id: number;
    name: string;
    position: string;
    city?: string | null;
    state?: string | null;
  }>;
}

export default function TestimonialRequestForm({
  vendorId,
  candidates,
}: TestimonialRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateId: "",
      personalMessage:
        "I enjoyed working on your campaign. Would you be willing to share your experience with our services? Your testimonial would be greatly appreciated. Thank you!",
    },
  });

  const { toast } = useToast();

  // Submit handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/vendor/testimonial/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          candidateId: parseInt(data.candidateId),
          message: data.personalMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send testimonial request");
      }

      toast({
        title: "Request sent",
        description: "Your testimonial request has been sent to the candidate.",
        action: <ToastAction altText="Ok">Ok</ToastAction>,
      });

      // Reset form after successful submission
      form.reset({
        candidateId: "",
        personalMessage:
          "I enjoyed working on your campaign. Would you be willing to share your experience with our services? Your testimonial would be greatly appreciated. Thank you!",
      });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem sending your testimonial request.",
      });
      console.error("Error sending testimonial request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UserPlus className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No associated candidates</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          You need to be associated with candidates before you can request
          testimonials. Connect with candidates through the platform to build
          your network.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="candidateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Candidate</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a candidate" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem
                      key={candidate.id}
                      value={candidate.id.toString()}
                    >
                      {candidate.name} - {candidate.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose a candidate you`&apos;`ve worked with to request a
                testimonial
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personalMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write a personal request message..."
                  className="h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This message will be sent to the candidate with your request for
                a testimonial.
                {field.value?.length || 0}/500 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Mail className="h-5 w-5 text-blue-500 mr-2" />
            <h4 className="font-medium text-blue-700">
              How Testimonial Requests Work
            </h4>
          </div>
          <p className="text-sm text-blue-600 mb-2">
            When you request a testimonial, the candidate will receive an email
            with:
          </p>
          <ul className="text-sm text-blue-600 list-disc pl-5 space-y-1">
            <li>Your personal message</li>
            <li>A link to submit a testimonial for your services</li>
            <li>A rating system to rate their experience</li>
          </ul>
          <p className="text-sm text-blue-600 mt-2">
            The testimonial will appear on your profile once it has been
            submitted.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Request...
            </>
          ) : (
            <>
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Testimonial Request
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
