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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { ImagePlus, Loader2 } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(500, {
      message: "Description cannot exceed 500 characters.",
    }),
  imageUrl: z
    .string()
    .url({
      message: "Please enter a valid URL for the image.",
    })
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface PortfolioItemFormProps {
  vendorId: number;
  portfolioItem?: {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
  };
  onSuccess?: () => void;
}

export default function PortfolioItemForm({
  vendorId,
  portfolioItem,
  onSuccess,
}: PortfolioItemFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!portfolioItem;

  // Initialize the form with existing data if editing
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: portfolioItem?.title || "",
      description: portfolioItem?.description || "",
      imageUrl: portfolioItem?.imageUrl || "",
    },
  });

  const { toast } = useToast();

  // Submit handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const endpoint = isEditing
        ? `/api/vendor/portfolio/${portfolioItem.id}`
        : "/api/vendor/portfolio";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error(
          isEditing
            ? "Failed to update portfolio item"
            : "Failed to create portfolio item"
        );
      }

      toast({
        title: isEditing ? "Portfolio item updated" : "Portfolio item created",
        description: isEditing
          ? "Your portfolio item has been successfully updated."
          : "Your portfolio item has been successfully added to your portfolio.",
        action: <ToastAction altText="Ok">Ok</ToastAction>,
      });

      // Reset form if adding new item
      if (!isEditing) {
        form.reset({
          title: "",
          description: "",
          imageUrl: "",
        });
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditing
          ? "There was a problem updating your portfolio item."
          : "There was a problem adding your portfolio item.",
      });
      console.error("Error with portfolio item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Portfolio item title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe this portfolio item..."
                  className="h-24"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/500 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <div className="flex">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...field}
                    className="rounded-r-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none border-l-0"
                    onClick={() => {
                      // This would be connected to an image upload functionality in the future
                      toast({
                        title: "Image upload",
                        description:
                          "Image upload functionality will be implemented in the future.",
                      });
                    }}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Provide a URL to an image that showcases this work. Direct image
                upload will be available in the future.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Update Portfolio Item"
          ) : (
            "Create Portfolio Item"
          )}
        </Button>
      </form>
    </Form>
  );
}
