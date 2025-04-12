"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FaArrowRight, FaInfoCircle } from "react-icons/fa";
import { calculateFee } from "@/lib/functions";

const SUGGESTED_AMOUNTS = [10, 25, 50, 100, 250];

interface DonationAmountTabProps {
  onSubmit: (amount: number, coverFee: boolean) => void;
  initialAmount?: number;
  initialCoverFee?: boolean;
}

export default function DonationAmountTab({
  onSubmit,
  initialAmount = 0,
  initialCoverFee = false,
}: DonationAmountTabProps) {
  const [amount, setAmount] = useState<number>(initialAmount || 0);
  const [customAmount, setCustomAmount] = useState<string>(
    initialAmount ? initialAmount.toString() : ""
  );
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    SUGGESTED_AMOUNTS.includes(initialAmount) ? initialAmount : null
  );
  const [coverFee, setCoverFee] = useState<boolean>(initialCoverFee);
  const [error, setError] = useState<string | null>(null);

  const processingFee = calculateFee(amount);
  const totalAmount = coverFee ? amount + processingFee : amount;

  useEffect(() => {
    // Validate amount whenever it changes
    if (amount < 1 && amount !== 0) {
      setError("Donation amount must be at least $1");
    } else {
      setError(null);
    }
  }, [amount]);

  const handlePresetClick = (preset: number) => {
    setSelectedPreset(preset);
    setAmount(preset);
    setCustomAmount(preset.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, "");
    setCustomAmount(value);
    setSelectedPreset(null);

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setAmount(numValue);
    } else {
      setAmount(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < 1) {
      setError("Donation amount must be at least $1");
      return;
    }

    onSubmit(amount, coverFee);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Select Donation Amount
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {SUGGESTED_AMOUNTS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={selectedPreset === preset ? "purple" : "outline"}
              onClick={() => handlePresetClick(preset)}
              className="w-full"
            >
              ${preset}
            </Button>
          ))}
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <Input
              type="text"
              value={customAmount}
              onChange={handleCustomAmountChange}
              className={`pl-7 ${error ? "border-red-500" : ""}`}
              placeholder="Enter amount"
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex items-start space-x-2 pt-3">
          <Checkbox
            id="coverFee"
            checked={coverFee}
            onCheckedChange={(checked) => setCoverFee(checked === true)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="coverFee"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Cover the processing fee (
              {processingFee > 0 ? `$${processingFee.toFixed(2)}` : ""})
            </label>
            <p className="text-sm text-gray-500 mt-1">
              Add{" "}
              {processingFee > 0
                ? `$${processingFee.toFixed(2)}`
                : "the processing fee"}{" "}
              to ensure 100% of your intended donation goes to the campaign.
              Without this, the campaign receives your donation minus
              Stripe&apos;s fee.
            </p>
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-md mt-3">
          <div className="flex items-start">
            <FaInfoCircle className="text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-purple-700">
              Your donation will help fund campaign activities, outreach, and
              community engagement efforts. Thank you for supporting local
              democracy!
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        {coverFee && (
          <div className="mb-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Base donation:</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Processing fee:</span>
              <span>${processingFee.toFixed(2)}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between text-lg font-semibold mb-4">
          <span>Total Amount:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        <Button
          type="submit"
          variant="purple"
          className="w-full flex items-center justify-center gap-2"
          disabled={amount < 1}
        >
          Continue <FaArrowRight />
        </Button>
      </div>
    </form>
  );
}
