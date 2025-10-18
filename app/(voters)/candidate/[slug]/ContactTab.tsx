"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FaEnvelope, FaGlobe, FaPhone, FaLinkedin } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ContactTabProps {
  candidateId: number;
  candidateName: string;
  candidateSlug: string;
  email?: string | null;
  website?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  verified?: boolean;
}

export function ContactTab({
  candidateId,
  candidateName,
  candidateSlug,
  email,
  website,
  phone,
  linkedin,
  verified,
}: ContactTabProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultName = useMemo(() => {
    if (!user) return "";
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }
    return user.username || "";
  }, [user]);
  const defaultEmail = useMemo(() => {
    if (!user) return "";
    const primaryId = user.primaryEmailAddressId;
    const primary = user.emailAddresses.find(
      (address) => address.id === primaryId,
    );
    return primary?.emailAddress || user.emailAddresses[0]?.emailAddress || "";
  }, [user]);
  const [form, setForm] = useState({
    name: defaultName,
    email: defaultEmail,
    subject: "",
    message: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || defaultName,
      email: prev.email || defaultEmail,
    }));
  }, [defaultName, defaultEmail]);

  const otherContactOptions = useMemo(
    () =>
      [
        email
          ? {
              label: "Email",
              value: email,
              icon: <FaEnvelope className="text-gray-500" />,
              href: `mailto:${email}`,
            }
          : null,
        website
          ? {
              label: "Website",
              value: website,
              icon: <FaGlobe className="text-gray-500" />,
              href: website,
            }
          : null,
        phone
          ? {
              label: "Phone",
              value: phone,
              icon: <FaPhone className="text-gray-500" />,
              href: `tel:${phone}`,
            }
          : null,
        linkedin
          ? {
              label: "LinkedIn",
              value: linkedin,
              icon: <FaLinkedin className="text-gray-500" />,
              href: linkedin,
            }
          : null,
      ].filter(Boolean) as Array<{
        label: string;
        value: string;
        icon: React.ReactNode;
        href: string;
      }>,
    [email, website, phone, linkedin],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSignedIn) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(`/candidate/${candidateSlug}`)}`,
      );
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/candidate/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId,
          senderName: form.name,
          senderEmail: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message =
          body?.error ||
          (response.status === 429
            ? "You’ve reached the limit for contacting this candidate right now."
            : "We couldn’t send your message. Please try again.");
        throw new Error(message);
      }
      setSuccess(true);
      toast({
        title: "Message sent!",
        description: `We delivered your message to ${candidateName}. Check your inbox for confirmation.`,
      });
      setForm((prev) => ({
        ...prev,
        subject: "",
        message: "",
      }));
    } catch (err) {
      console.error("Failed to send candidate message", err);
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t send your message. Please try again.",
      );
      toast({
        title: "Something went wrong",
        description:
          err instanceof Error
            ? err.message
            : "We couldn’t send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        {!verified && (
          <Alert>
            <AlertTitle>This candidate has not verified their profile yet</AlertTitle>
            <AlertDescription>
              We&apos;ll still deliver your message so the Elevra team can help them
              connect with you.
            </AlertDescription>
          </Alert>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Send {candidateName} a message
          </h3>
          <p className="text-sm text-muted-foreground">
            Let them know why you&apos;re reaching out. We&apos;ll email you a copy for
            your records.
          </p>
        </div>
        {isSignedIn ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Your name
                </label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Subject
              </label>
              <Input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Let’s connect about…"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                Your message
              </label>
              <Textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={6}
                placeholder="Share how you’d like to support their campaign or ask a question."
                required
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                variant="purple"
                disabled={isSubmitting}
                className="sm:w-auto"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </Button>
              {success && (
                <span className="text-sm text-green-600">
                  Message sent! Check your email for confirmation.
                </span>
              )}
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </form>
        ) : (
          <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50/40 p-6">
            <Alert>
              <AlertTitle>Sign in to contact this candidate</AlertTitle>
              <AlertDescription>
                You need an Elevra account to message {candidateName}. Once you&apos;re
                signed in, you can send them a note directly.
              </AlertDescription>
            </Alert>
            <Button
              variant="purple"
              onClick={() =>
                router.push(
                  `/sign-in?redirect_url=${encodeURIComponent(`/candidate/${candidateSlug}`)}`,
                )
              }
            >
              Sign in to send a message
            </Button>
          </div>
        )}
      </div>
      <aside className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Other contact options
        </h4>
        {otherContactOptions.length > 0 ? (
          <div className="space-y-3 rounded-lg border border-purple-100 bg-purple-50/40 p-4">
            {otherContactOptions.map((option) => (
              <a
                key={option.label}
                href={option.href}
                target={option.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  option.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="flex items-start gap-3 rounded-md px-3 py-2 text-sm text-purple-700 transition hover:bg-white"
              >
                <span className="mt-1">{option.icon}</span>
                <span className="flex-1">
                  <span className="block font-medium text-gray-900">
                    {option.label}
                  </span>
                  <span className="block break-words text-muted-foreground">
                    {option.value}
                  </span>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {verified
              ? "This candidate hasn’t added other contact details yet."
              : "We’ll publish more contact information once they verify their profile."}
          </p>
        )}
      </aside>
    </div>
  );
}
