"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define Zod schema for validation
const listSchema = z.object({
  name: z
    .string()
    .min(3, { message: "List name must be at least 3 characters." })
    .max(100),
  description: z.string().max(250).optional(),
});

type ListFormData = z.infer<typeof listSchema>;

interface CreateListFormProps {
  // Callback to notify parent when a list is created (placeholder)
  onListCreated: (newList: {
    id: number;
    name: string;
    subscriberCount: number;
    createdAt: Date;
  }) => void;
}

export function CreateListForm({ onListCreated }: CreateListFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
  });

  const onSubmit = async (data: ListFormData) => {
    setIsSubmitting(true);
    console.log("Submitting new list data:", data);

    // ** Placeholder for actual API call **
    // try {
    //   const response = await fetch('/api/mailing-lists', { // Replace with your actual endpoint
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data),
    //   });
    //   if (!response.ok) throw new Error('Failed to create list');
    //   const newList = await response.json();
    //   toast({ title: "Success", description: `List "${newList.name}" created.` });
    //   onListCreated(newList); // Pass data back to parent
    //   reset(); // Clear the form
    // } catch (error) {
    //   console.error("Error creating list:", error);
    //   toast({ title: "Error", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsSubmitting(false);
    // }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockNewList = {
      id: Math.floor(Math.random() * 1000), // Mock ID
      name: data.name,
      subscriberCount: 0,
      createdAt: new Date(),
    };
    toast({
      title: "List Created (Placeholder)",
      description: `List "${data.name}" added.`,
    });
    onListCreated(mockNewList); // Use mock data
    reset();
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div>
        <Label htmlFor="list-name">List Name</Label>
        <Input id="list-name" {...register("name")} disabled={isSubmitting} />
        {errors.name && (
          <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="list-description">Description (Optional)</Label>
        <Textarea
          id="list-description"
          {...register("description")}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="text-xs text-red-600 mt-1">
            {errors.description.message}
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create List"}
        </Button>
      </div>
    </form>
  );
}
