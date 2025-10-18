"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type CandidateMessage = {
  id: number;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  createdAt: string;
};

type CandidateMessagesClientProps = {
  messages: CandidateMessage[];
};

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function CandidateMessagesClient({
  messages,
}: CandidateMessagesClientProps) {
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(
    null,
  );

  const totalMessages = messages.length;
  const headerCopy = useMemo(() => {
    if (totalMessages === 0) return "You haven't received any messages yet.";
    if (totalMessages === 1) return "You have 1 message from your supporters.";
    return `You have ${totalMessages} messages from your supporters.`;
  }, [totalMessages]);

  if (messages.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We’ll list messages from voters here once they reach out through your
            profile.
          </p>
        </header>
        <EmptyState
          primary="No messages yet."
          secondary="Share your profile link to invite voters to connect."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">{headerCopy}</p>
      </header>
      <div className="space-y-4">
        {messages.map((message) => {
          const isExpanded = expandedMessageId === message.id;
          const preview = message.body.slice(0, 160);
          const shouldTruncate = message.body.length > 160;

          return (
            <Card key={message.id} className="border-purple-100">
              <CardHeader className="gap-1">
                <CardTitle className="text-base text-gray-900">
                  {message.subject}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  From {message.senderName} (
                  <a
                    href={`mailto:${message.senderEmail}`}
                    className="text-purple-600 hover:underline"
                  >
                    {message.senderEmail}
                  </a>
                  ) · {formatTimestamp(message.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {isExpanded || !shouldTruncate
                    ? message.body
                    : `${preview}…`}
                </p>
                {shouldTruncate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0 text-purple-600 hover:text-purple-700"
                    onClick={() =>
                      setExpandedMessageId(isExpanded ? null : message.id)
                    }
                  >
                    {isExpanded ? "Show less" : "Read full message"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <footer className="rounded-lg border border-dashed border-purple-200 bg-purple-50/40 p-4 text-sm text-muted-foreground">
        Tip: when you reply, email supporters directly at the address included
        with their message. Elevra doesn’t send responses on your behalf yet.
      </footer>
    </div>
  );
}
