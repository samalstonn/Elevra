"use client";

import { Button } from "../components/ui/button";
import { FaDonate } from "react-icons/fa";
import Link from "next/link";

interface CheckoutButtonProps {
  cartItems: { name: string; price: number; quantity: number }[];
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({}) => {
  return (
    <div>
      <Button variant="green" size="xl" className="flex items-center gap-2">
        <FaDonate />
        <Link href={`${window.location.pathname}/donate`}>
          <span>Donate</span>
        </Link>
      </Button>
    </div>
  );
};

export default CheckoutButton;
