"use client";
import { Vendor } from "@prisma/client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Check, Loader2 } from "lucide-react";
import { FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";
import { AutocompleteSuggestion } from "@/types/geocoding";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding";
import { debounce } from "@/lib/debounce";
import { MultiSelect } from "@/components/ui/multi-select";

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

  // Location search state
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    AutocompleteSuggestion[]
  >([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [locationErrors, setLocationErrors] = useState<{
    city?: string;
    state?: string;
    location?: string;
  }>({});

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

  // Set location input when component mounts
  useEffect(() => {
    if (vendor.city && vendor.state) {
      setLocationInput(`${vendor.city}, ${vendor.state}`);
    }
  }, [vendor]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Location input change handler with debounced suggestions
  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setLocationInput(value);

    // Clear location-related errors
    if (
      locationErrors.city ||
      locationErrors.state ||
      locationErrors.location
    ) {
      setLocationErrors({});
    }

    if (value.trim().length >= 2) {
      setIsLoadingLocations(true);
      setShowLocationSuggestions(true);
      debouncedFetchLocationSuggestions(value);
    } else {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  // Debounced location suggestions fetch
  const debouncedFetchLocationSuggestions = debounce(async (input: string) => {
    if (input.trim().length < 2) {
      setLocationSuggestions([]);
      setIsLoadingLocations(false);
      return;
    }

    try {
      const results = await getLocationSuggestions(input);
      setLocationSuggestions(results);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    } finally {
      setIsLoadingLocations(false);
    }
  }, 500);

  // Handle location suggestion selection
  const handleSelectLocationSuggestion = async (
    suggestion: AutocompleteSuggestion
  ) => {
    setLocationInput(suggestion.placeName);
    setShowLocationSuggestions(false);

    if (suggestion.city && suggestion.state) {
      form.setValue("city", suggestion.city);
      form.setValue("state", suggestion.state);
    } else {
      // Try to normalize the location if city/state not provided in suggestion
      try {
        const normalizedLocation = await normalizeLocation(
          suggestion.placeName
        );
        if ("city" in normalizedLocation && "state" in normalizedLocation) {
          form.setValue("city", normalizedLocation.city || "");
          form.setValue("state", normalizedLocation.state || "");
          setLocationInput(normalizedLocation.fullAddress || "");
        }
      } catch (error) {
        console.error("Error normalizing location:", error);
        setLocationErrors({
          location: "Unable to determine city and state from this location",
        });
      }
    }
  };

  // Handle manual location validation when input field loses focus
  const handleLocationBlur = async () => {
    if (
      locationInput &&
      (!form.getValues("city") || !form.getValues("state"))
    ) {
      try {
        const normalizedLocation = await normalizeLocation(locationInput);
        if ("city" in normalizedLocation && "state" in normalizedLocation) {
          form.setValue("city", normalizedLocation.city || "");
          form.setValue("state", normalizedLocation.state || "");
          setLocationInput(normalizedLocation.fullAddress || "");
        } else if ("message" in normalizedLocation) {
          setLocationErrors({
            location: normalizedLocation.message,
          });
        }
      } catch (error) {
        console.error("Error validating location:", error);
      }
    }

    // Hide suggestions after a short delay (allows for clicks on suggestions)
    setTimeout(() => {
      setShowLocationSuggestions(false);
    }, 200);
  };

  // Prepare category options for MultiSelect
  const allCategories = Object.values(categoriesByType)
    .flat()
    .map((category) => ({
      value: category.id.toString(),
      label: `${formatCategoryType(category.type)}: ${category.name}`,
    }));

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

  return (
    <div>
      <Button
        className="mb-4 mt-4w-full md:w-auto"
        variant={"purple"}
        onClick={() =>
          router.push("/candidates/vendor-marketplace/" + vendor.slug)
        }
      >
        See Public Profile
      </Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <br />
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
                  <br />
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
                  <br />
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
                <br />
                <FormControl>
                  <Input
                    placeholder="https://yourbusiness.com"
                    {...field}
                    style={{ width: "100%" }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Location with Autocomplete */}
          <div className="space-y-2 relative">
            <FormLabel className="block text-sm font-medium flex items-center gap-2">
              <FaMapMarkerAlt className="text-purple-600" /> Location
            </FormLabel>
            <div className="relative">
              <Input
                ref={locationInputRef}
                id="location"
                name="location"
                value={locationInput}
                onChange={handleLocationInputChange}
                onBlur={handleLocationBlur}
                onFocus={() => {
                  if (locationInput.trim().length >= 2) {
                    setShowLocationSuggestions(true);
                  }
                }}
                placeholder="Enter city, state, or ZIP code"
                className={locationErrors.location ? "border-red-500" : ""}
                autoComplete="off"
                style={{ width: "100%" }}
              />
              {isLoadingLocations && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {locationErrors.location && (
              <p className="text-xs text-red-600 mt-1">
                {locationErrors.location}
              </p>
            )}
            {/* Location Suggestions */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
              >
                <ul className="py-1">
                  {locationSuggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.id || index}
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer flex items-center"
                      onClick={() => handleSelectLocationSuggestion(suggestion)}
                    >
                      <FaMapMarkerAlt className="text-purple-400 mr-2 flex-shrink-0" />
                      <span className="text-sm">{suggestion.placeName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Display selected location info */}
            {form.getValues("city") && form.getValues("state") && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span>
                  Selected: {form.getValues("city")}, {form.getValues("state")}
                </span>
              </div>
            )}
          </div>
          {/* Hidden City and State fields (populated by location selection) */}
          <input type="hidden" {...form.register("city")} />
          <input type="hidden" {...form.register("state")} />
          {/* Service Categories with MultiSelect */}
          <FormField
            control={form.control}
            name="serviceCategories"
            render={() => (
              <FormItem>
                <FormLabel className="text-base">Service Categories</FormLabel>
                <FormDescription className="mt-1 mb-4">
                  Select the categories that best represent your services.
                </FormDescription>
                <FormControl>
                  <Controller
                    control={form.control}
                    name="serviceCategories"
                    render={({ field }) => (
                      <MultiSelect
                        placeholder="Select categories..."
                        options={allCategories}
                        value={field.value.map((id) => id.toString())}
                        onChange={(values) => {
                          field.onChange(values.map((v) => parseInt(v)));
                        }}
                      />
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
    </div>
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
