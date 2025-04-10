"use client";

// import { useState } from "react";
import { Button } from "../components/ui/button";
import { FaDonate } from "react-icons/fa";
// import getStripe from "../lib/get-stripe";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

interface CheckoutButtonProps {
  cartItems: { name: string; price: number; quantity: number }[];
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({}) => {
  // const [_loading, setLoading] = useState(false);

  // Keep all the original logic intact
  // const handleCheckout = async () => {
  //   setLoading(true);
  //   const stripe = await getStripe();
  //   const response = await fetch("/api/checkout_sessions", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ cartItems }),
  //   });
  //   const { sessionId, error } = await response.json();
  //   if (error) {
  //     console.error(error);
  //     setLoading(false);
  //     return;
  //   }
  //   const { error: stripeError } = await stripe!.redirectToCheckout({
  //     sessionId,
  //   });
  //   if (stripeError) {
  //     console.error(stripeError);
  //   }
  //   setLoading(false);
  // };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              variant="outline"
              size="xl"
              disabled={true}
              className="flex items-center gap-2 opacity-50 cursor-not-allowed"
            >
              <FaDonate />
              <span>Donate</span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>This candidate does not support donations yet.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CheckoutButton;
