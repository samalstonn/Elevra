"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";
import { cn } from "@/lib/utils";

interface Citation {
  id: string;
  label: string;
  url: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations?: Citation[] | null;
  pending?: boolean;
}

type AssistantPayload = {
  sessionId: number;
  messages: ChatMessage[];
  followUps?: string[];
};

const quickPrompts = [
  "What are the key filing deadlines I should plan for this year?",
  "How do Washington's mini reporting rules work with the PDC?",
  "What do I need to submit for the local voters' pamphlet?",
  "Are there restrictions on campaign yard signs in my city?",
];

const disclaimerText =
  "This assistant provides informational guidance based on Washington State resources and is not a substitute for legal advice.";

export default function CandidateAssistantPage() {
  usePageTitle("Candidate Dashboard – Assistant");
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [followUps, setFollowUps] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    async function bootstrap() {
      try {
        const res = await fetch("/api/candidate/assistant", {
          method: "GET",
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Unable to load assistant");
        }
        const data = (await res.json()) as {
          session: { id: number };
          messages: ChatMessage[];
        };
        setSessionId(data.session.id);
        setMessages(data.messages ?? []);
      } catch (error) {
        console.error("Failed to bootstrap assistant", error);
        toast({
          title: "Unable to load assistant",
          description:
            "Please refresh the page or contact support if the issue persists.",
          variant: "destructive",
        });
      } finally {
        setInitializing(false);
      }
    }

    bootstrap();

    return () => {
      controller.abort();
    };
  }, [toast]);

  const orderedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) {
      toast({
        title: "Ask a question",
        description: "Type a question about your campaign before sending.",
      });
      return;
    }

    if (isLoading) return;

    const question = input.trim();
    const tempId = Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/candidate/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const payload = (await res.json()) as AssistantPayload;
      setSessionId(payload.sessionId);
      setFollowUps(payload.followUps ?? []);
      setMessages((prev) => {
        const withoutTemp = prev.filter((message) => message.id !== tempId);
        return [...withoutTemp, ...payload.messages];
      });
    } catch (error) {
      console.error("Assistant send failed", error);
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
      toast({
        title: "Message failed",
        description:
          "The assistant is unavailable right now. Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>Washington Election Assistant</CardTitle>
          </div>
          <CardDescription>
            Ask campaign planning questions and get guidance sourced from the
            Washington Secretary of State and the Public Disclosure Commission.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Washington</Badge>
            <Badge variant="outline">Informational only</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              Suggested prompts
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <ScrollArea className="h-[360px] rounded-md border bg-card">
              <div className="flex flex-col gap-4 p-4">
                {initializing && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading your previous questions…</span>
                  </div>
                )}

                {!initializing && orderedMessages.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Ask your first question about filing, campaign finance, or
                      voter outreach in Washington, and the assistant will cite
                      official sources for you.
                    </p>
                  </div>
                )}

                {orderedMessages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      "rounded-md border p-3 text-sm shadow-sm",
                      message.role === "assistant"
                        ? "bg-purple-50/70 border-purple-200"
                        : "bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {message.role === "assistant"
                          ? "Assistant"
                          : "You"}
                      </span>
                      <time className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <div className="prose prose-sm mt-2 whitespace-pre-wrap">
                      {message.content}
                    </div>
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Sources
                        </p>
                        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                          {message.citations.map((citation) => (
                            <li key={`${message.id}-${citation.id}`}>
                              <Link
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-700 hover:underline"
                              >
                                {citation.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </ScrollArea>

            {followUps.length > 0 && (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Suggested follow-ups</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {followUps.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => handlePromptClick(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                placeholder="Ask about filing deadlines, compliance, or campaign planning in Washington…"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                maxLength={1500}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Use official resources for final confirmation with your county
                  elections office.
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending
                    </>
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            </form>
          </section>

          <footer className="flex items-center justify-between rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <span>{disclaimerText}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-muted-foreground"
            >
              <RefreshCcw className="mr-2 h-3 w-3" /> Refresh
            </Button>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
