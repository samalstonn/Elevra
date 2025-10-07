"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SIGNUP_ROLE_STORAGE_KEY = "elevra_signup_role";

const storeRoleSelection = (role: "candidate" | "voter") => {
  try {
    localStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, role);
  } catch (error) {
    console.error("Failed to persist sign-up role selection", error);
  }
};

export default function SignUpRoleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const closeDialog = useCallback(() => setOpen(false), []);

  const handleCandidate = useCallback(() => {
    storeRoleSelection("candidate");
    closeDialog();
    const targetBase = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    window.location.href = `${targetBase}/candidates?tab=home`;
  }, [closeDialog]);

  const handleVoter = useCallback(() => {
    storeRoleSelection("voter");
    closeDialog();
    router.push("/sign-up?role=voter&redirect=/dashboard");
  }, [closeDialog, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="whitePrimaryOutline" className="md:text-base md:p-4">
          Sign Up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Who&apos;s joining Elevra?</DialogTitle>
          <DialogDescription>
            Choose the experience tailored to how you plan to use the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Button variant="purple" onClick={handleCandidate}>
            I&apos;m a candidate
          </Button>
          <Button variant="purple" onClick={handleVoter}>
            I&apos;m a voter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SIGNUP_ROLE_STORAGE_KEY };
