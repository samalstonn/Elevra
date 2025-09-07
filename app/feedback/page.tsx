"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FaPaperPlane } from "react-icons/fa";

export default function FeedbackPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    anonymous: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Note: Email sending and visit ping are disabled for now on this page.

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Temporarily disable email submission; just acknowledge receipt locally
    try {
      console.info("Feedback captured (email disabled)", form);
      setSuccess(true);
      toast({
        title: "Thanks for your feedback!",
        description:
          "We’ve recorded your message. Email notifications are temporarily disabled.",
      });
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        anonymous: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl sm:text-5xl font-bold text-purple-700 mb-6">
        Contact Us
      </h1>
      <p className="text-sm text-muted-foreground">
        The Elevra team truly appreciates your ideas and wants to hear your
        feedback!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!form.anonymous && (
          <>
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full mt-1"
              />
              <br />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full mt-1"
              />
              <br />
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="anonymous"
            checked={form.anonymous}
            onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
          />
          <label className="text-sm">Submit anonymously</label>
        </div>
        <div>
          <label className="text-sm font-medium">Subject</label>
          <Input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            className="w-full mt-1"
          />
          <br />
        </div>

        <div>
          <label className="text-sm font-medium">Your Message</label>
          <Textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={5}
            className="w-full mt-1"
            required
          />
          <br />
        </div>

        <Button
          type="submit"
          variant="purple"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <FaPaperPlane className="h-4 w-4" />
          {loading ? "Sending..." : "Submit Feedback"}
        </Button>

        {success && (
          <p className="text-green-600 text-sm">Thanks for your feedback!</p>
        )}
      </form>
      <p className="text-sm text-muted-foreground mt-4">
        You can use this form to submit feature requests, suggest improvements,
        report bugs, or share general feedback about your experience.
      </p>
    </div>
  );
}
