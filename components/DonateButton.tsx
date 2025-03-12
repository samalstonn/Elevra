'use client';

import { useState } from 'react';
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
    <button
    onClick={handleCheckout}
    disabled={loading}
    className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700 transition flex items-center gap-2">
        <FaDonate />
        <span>{loading ? 'Loading...' : 'Donate'}</span>
    </button>
  );
};

export default CheckoutButton;