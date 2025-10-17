"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FollowButtonProps = {
  candidateId: number;
  candidateSlug: string;
  candidateName: string;
  onChange?: (isFollowing: boolean) => void;
};

export function FollowButton({
  candidateId,
  candidateSlug,
  candidateName,
  onChange,
}: FollowButtonProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [signinModalOpen, setSigninModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const isVoter = user?.publicMetadata?.isVoter === true;

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/voter/following?candidateId=${candidateId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch follow status");
      }
      const data = (await response.json()) as { isFollowing?: boolean };
      const next = Boolean(data.isFollowing);
      setIsFollowing(next);
      onChange?.(next);
    } catch (error) {
      console.error("Unable to load follow status", error);
    }
  }, [candidateId, onChange]);

  useEffect(() => {
    if (isSignedIn && isVoter) {
      void fetchStatus();
    } else {
      setIsFollowing(false);
    }
  }, [isSignedIn, isVoter, fetchStatus]);

  const handleToggle = async () => {
    if (!isSignedIn) {
      setSigninModalOpen(true);
      return;
    }
    if (!isVoter) {
      setVerifyModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        const response = await fetch(`/api/voter/follow/${candidateId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to unfollow candidate");
        }
        setIsFollowing(false);
        onChange?.(false);
        return;
      }

      const response = await fetch("/api/voter/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidateId }),
      });
      if (!response.ok) {
        throw new Error("Failed to follow candidate");
      }
      setIsFollowing(true);
      onChange?.(true);
    } catch (error) {
      console.error("Follow action failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = useCallback(() => {
    const redirect = `/candidate/${candidateSlug}`;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(redirect)}`);
  }, [candidateSlug, router]);

  const handleSwitchRole = useCallback(() => {
    router.push("/sign-up?role=voter&redirect=/dashboard");
  }, [router]);

  return (
    <>
      <Button
        type="button"
        variant={isFollowing ? "outline" : "purple"}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500 focus-visible:outline-offset-2"
        data-testid="follow-button"
        aria-pressed={isFollowing}
        disabled={loading}
        onClick={handleToggle}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>

      <Dialog open={signinModalOpen} onOpenChange={setSigninModalOpen}>
        <DialogContent data-testid="signin-modal">
          <DialogHeader>
            <DialogTitle>Sign in to follow candidates</DialogTitle>
            <DialogDescription>
              Create a voter account or sign in to keep tabs on candidates like {candidateName}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSigninModalOpen(false)}>
              Close
            </Button>
            <Button variant="purple" onClick={handleSignin}>
              Sign in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent data-testid="verify-modal">
          <DialogHeader>
            <DialogTitle>Switch to the voter experience</DialogTitle>
            <DialogDescription>
              Following candidates is available for voters. Update your role to unlock the dashboard, feed, and notifications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVerifyModalOpen(false)}>
              Maybe later
            </Button>
            <Button variant="purple" onClick={handleSwitchRole}>
              I&apos;m a voter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
