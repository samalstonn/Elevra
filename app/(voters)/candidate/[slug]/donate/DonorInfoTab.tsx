"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FaArrowRight, FaInfoCircle, FaUserLock } from "react-icons/fa";
import LocationInput from "@/components/LocationInput";
import Link from "next/link";

interface DonorInfoTabProps {
  formState: {
    amount: number;
    coverFee: boolean;
    email: string;
    fullName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    isRetiredOrUnemployed: boolean;
    occupation: string;
    employer: string;
    agreedToTerms: boolean;
  };
  onChange: (field: string, value: string | boolean | number) => void;
  onLocationSelect: (city: string, state: string, fullAddress: string) => void;
  onSubmit: () => void;
  isUserSignedIn: boolean;
}

export default function DonorInfoTab({
  formState,
  onChange,
  onLocationSelect,
  onSubmit,
  isUserSignedIn,
}: DonorInfoTabProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aptNumber, setAptNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate the form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formState.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formState.fullName) {
      newErrors.fullName = "Full name is required";
    }

    if (!formState.address) {
      newErrors.address = "Address is required";
    }

    if (!formState.city) {
      newErrors.city = "City is required";
    }

    if (!formState.state) {
      newErrors.state = "State is required";
    }

    if (!formState.zip) {
      newErrors.zip = "ZIP code is required";
    }

    if (!formState.isRetiredOrUnemployed) {
      if (!formState.occupation) {
        newErrors.occupation = "Occupation is required";
      }
      if (!formState.employer) {
        newErrors.employer = "Employer is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (aptNumber.trim()) {
      const newAddress = aptNumber + ", " + formState.address;
      console.log("Updated address:", newAddress);
      onChange("address", newAddress);
      // Directly update the formState address so that subsequent logic uses the updated value
      formState.address = newAddress;
    }

    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    onChange(name, fieldValue);

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isUserSignedIn && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <FaUserLock className="text-blue-500 text-lg mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-700">
                Sign in to check out faster
              </h3>
              <p className="text-sm text-blue-600 mt-1">
                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent(
                    window.location.pathname
                  )}`}
                  className="underline"
                  onClick={() => {
                    // Store form state in localStorage before redirecting
                    localStorage.setItem(
                      "donationFormState",
                      JSON.stringify(formState)
                    );
                  }}
                >
                  Sign in
                </Link>{" "}
                to save your information for future donations.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address*
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formState.email}
            onChange={handleInputChange}
            className={errors.email ? "border-red-500" : ""}
            style={{ width: "100%" }}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name*
          </label>
          <Input
            id="fullName"
            name="fullName"
            value={formState.fullName}
            onChange={handleInputChange}
            className={errors.fullName ? "border-red-500" : ""}
            style={{ width: "100%" }}
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="aptNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Apartment, Unit, or Other (Optional)
          </label>
          <Input
            id="aptNumber"
            name="aptNumber"
            type="text"
            value={aptNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAptNumber(e.target.value)
            }
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address*
          </label>
          <LocationInput
            onLocationSelect={(city, state, fullAddress) => {
              onLocationSelect(city, state, fullAddress);
            }}
            initialValue={formState.address}
            error={errors.address}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="zip"
              className="block text-sm font-medium text-gray-700"
            >
              ZIP Code*
            </label>
            <Input
              id="zip"
              name="zip"
              value={formState.zip}
              onChange={handleInputChange}
              className={errors.zip ? "border-red-500" : ""}
              style={{ width: "100%" }}
            />
            {errors.zip && (
              <p className="text-red-500 text-xs mt-1">{errors.zip}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone (Optional)
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formState.phone}
              onChange={handleInputChange}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-col space-y-2">
            <h3 className="text-md font-medium text-gray-800">
              Employment Information
            </h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRetiredOrUnemployed"
                name="isRetiredOrUnemployed"
                checked={formState.isRetiredOrUnemployed}
                onCheckedChange={(checked) =>
                  onChange("isRetiredOrUnemployed", checked === true)
                }
              />
              <label
                htmlFor="isRetiredOrUnemployed"
                className="text-sm font-medium text-gray-700"
              >
                I am retired or currently unemployed
              </label>
            </div>
            <div className="text-sm text-gray-600 flex items-start mt-1">
              <FaInfoCircle className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>
                Campaign finance law requires us to collect contributor
                information, including employment. If you are{" "}
                <strong>self-employed</strong>, enter your own name as your
                employer.
              </p>
            </div>
          </div>

          {!formState.isRetiredOrUnemployed && (
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="occupation"
                  className="block text-sm font-medium text-gray-700"
                >
                  Occupation*
                </label>
                <Input
                  id="occupation"
                  name="occupation"
                  value={formState.occupation}
                  onChange={handleInputChange}
                  className={errors.occupation ? "border-red-500" : ""}
                  style={{ width: "100%" }}
                />
                {errors.occupation && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.occupation}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="employer"
                  className="block text-sm font-medium text-gray-700"
                >
                  Employer*
                </label>
                <Input
                  id="employer"
                  name="employer"
                  value={formState.employer}
                  onChange={handleInputChange}
                  className={errors.employer ? "border-red-500" : ""}
                  style={{ width: "100%" }}
                />
                {errors.employer && (
                  <p className="text-red-500 text-xs mt-1">{errors.employer}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Go back to amount tab
            window.history.back();
          }}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="purple"
          className="flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Donate Now"} <FaArrowRight />
        </Button>
      </div>
      <div className="mt-4 p-4 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-2">
          Contribution Rules
        </h3>
        <ol className="list-decimal list-inside text-sm text-gray-500 space-y-2">
          <li>
            I am a U.S. citizen or lawfully admitted permanent resident (i.e.,
            green card holder).
          </li>
          <li>
            This contribution is made from my own funds, and funds are not being
            provided to me by another person or entity for the purpose of making
            this contribution.
          </li>
          <li>I am at least eighteen years old.</li>
          <li>I am not a federal contractor.</li>
          <li>
            I am making this contribution with my own personal credit card and
            not with a corporate or business credit card or a card issued to
            another person.
          </li>
        </ol>
        <p className="text-sm text-gray-600 mt-2">
          Political donations are not tax deductible.
        </p>
      </div>
    </form>
  );
}
