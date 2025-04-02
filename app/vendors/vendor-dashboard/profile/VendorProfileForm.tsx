"use client";
import { Vendor } from "@prisma/client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ServiceCategoryType } from "@prisma/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  bio: z
    .string()
    .min(10, {
      message: "Bio must be at least 10 characters.",
    })
    .max(500, {
      message: "Bio cannot exceed 500 characters.",
    }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  website: z
    .string()
    .url({
      message: "Please enter a valid URL.",
    })
    .optional()
    .or(z.literal("")),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  serviceCategories: z.array(z.number()),
});

type FormValues = z.infer<typeof formSchema>;

interface VendorProfileFormProps {
  vendor: Vendor;
  categoriesByType: Record<
    string,
    { id: number; name: string; type: ServiceCategoryType }[]
  >;
  selectedCategoryIds: number[];
}

export default function VendorProfileForm({
  vendor,
  categoriesByType,
  selectedCategoryIds,
}: VendorProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with vendor data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: vendor.name,
      bio: vendor.bio,
      email: vendor.email,
      phone: vendor.phone || "",
      website: vendor.website || "",
      city: vendor.city,
      state: vendor.state,
      serviceCategories: selectedCategoryIds,
    },
  });

  const { toast } = useToast();

  // Submit handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast({
        title: "Profile updated",
        description: "Your vendor profile has been successfully updated.",
        action: <ToastAction altText="Ok">Ok</ToastAction>,
      });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem updating your profile.",
        action: <ToastAction altText="Try Again">Try Again</ToastAction>,
      });
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group service categories by type for better display
  const categoryTypes = Object.keys(categoriesByType) as ServiceCategoryType[];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Your business name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your business and services..."
                  className="h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This will be displayed on your public profile.
                {field.value?.length || 0}/500 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="(123) 456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://yourbusiness.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Your city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Your state" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel className="text-base">Service Categories</FormLabel>
          <FormDescription className="mt-1 mb-4">
            Select the categories that best represent your services.
          </FormDescription>

          {categoryTypes.map((type) => (
            <Card key={type} className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {formatCategoryType(type)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categoriesByType[type]?.map((category) => (
                    <FormField
                      key={category.id}
                      control={form.control}
                      name="serviceCategories"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={category.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  const isCategorySelected =
                                    field.value?.includes(category.id);
                                  return checked
                                    ? !isCategorySelected
                                      ? field.onChange([
                                          ...field.value,
                                          category.id,
                                        ])
                                      : field.onChange(field.value)
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== category.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {category.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

// Helper function to format category types for display
function formatCategoryType(type: string): string {
  // Convert SNAKE_CASE to Title Case with Spaces
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
