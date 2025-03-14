'use client';

import { useState } from 'react';
import { Button } from "../components/ui/button"; // Replace 'your-button-library' with the actual library or file path
import { FaDonate } from 'react-icons/fa';
import getStripe from '../lib/get-stripe';

interface CheckoutButtonProps {
  cartItems: { name: string; price: number; quantity: number }[];
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ cartItems }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const stripe = await getStripe();
    const response = await fetch('/api/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cartItems }),
    });
    const { sessionId, error } = await response.json();
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const { error: stripeError } = await stripe!.redirectToCheckout({ sessionId });
    if (stripeError) {
      console.error(stripeError);
    }
    setLoading(false);
  };

  return (
    <Button variant="green" size="xl" onClick={handleCheckout} disabled={loading} className="flex items-center gap-2">
      <FaDonate />
      <span>{loading ? 'Loading...' : 'Donate'}</span>
    </Button>
  );
};

export default CheckoutButton;