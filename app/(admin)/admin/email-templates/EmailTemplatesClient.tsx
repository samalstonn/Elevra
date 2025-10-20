"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { EMAIL_TEMPLATE_VARIABLES } from "@/lib/email/templates/constants";
import { usePageTitle } from "@/lib/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EmailTemplateClientModel = {
  id: string;
  key: string;
  title: string;
  subjectTemplate: string;
  htmlTemplate: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
};

type EmailTemplatesClientProps = {
  initialTemplates: EmailTemplateClientModel[];
};

const DEFAULT_NEW_TEMPLATE_HTML = `<div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Ubuntu,Cantarell,'Helvetica Neue',Arial;">
  <p style="margin:0 0 16px;">Hi {{greetingName}},</p>
  <p style="margin:0 0 16px;">Your message here.</p>
  <p style="margin:0;">Best,<br />The Elevra Team</p>
</div>`;

const VARIABLE_METADATA: Record<
  string,
  { label: string; description: string; example: string }
> = {
  greetingName: {
    label: "Greeting Name",
    description: "Friendly first name or “there” fallback used in salutations.",
    example: "Jordan",
  },
  claimUrl: {
    label: "Claim URL",
    description: "Direct link for the candidate to claim or update their profile.",
    example: "https://app.elevra.com/candidates/jordan-smith",
  },
  templatesUrl: {
    label: "Templates URL",
    description: "Shortcut URL to the templates dashboard (defaults to the claim URL).",
    example: "https://app.elevra.com/candidates/jordan-smith/templates",
  },
  profileUrl: {
    label: "Profile URL",
    description: "Public-facing profile page if it already exists.",
    example: "https://elevra.com/candidates/jordan-smith",
  },
  profileLink: {
    label: "Profile Link Snippet",
    description: "HTML snippet that links to the profile (blank when no profile URL).",
    example: "(<a href=\"https://elevra.com/candidates/jordan-smith\">view profile</a>)",
  },
  ctaLabel: {
    label: "CTA Label",
    description: "Button text for primary call to action.",
    example: "Create My Webpage",
  },
  municipalityName: {
    label: "Municipality",
    description: "Candidate’s city, district, or locality when available.",
    example: "Brooklyn",
  },
  stateName: {
    label: "State/Region",
    description: "Two-letter or proper-case state/region name.",
    example: "NY",
  },
  locationFragment: {
    label: "Location Fragment",
    description: "Short phrase referencing the candidate’s locality.",
    example: "in Brooklyn",
  },
  locationSummary: {
    label: "Location Summary",
    description: "Space-prefixed state summary for inline sentences.",
    example: " in NY",
  },
  locationDetail: {
    label: "Location Detail",
    description: "Expanded city + state detail when both are known.",
    example: "Brooklyn, NY",
  },
  positionDescriptor: {
    label: "Position Descriptor",
    description: "Readable position mention for mid-sentence usage.",
    example: "city council candidate",
  },
  positionName: {
    label: "Position Name",
    description: "Exact position title the candidate is running for.",
    example: "City Council, District 7",
  },
  originalHtml: {
    label: "Original Message HTML",
    description: "Embeds the prior email HTML when composing follow-ups.",
    example: "— renders the quoted initial outreach —",
  },
  senderName: {
    label: "Sender Name",
    description: "Name of the admin sending the email (defaults to account metadata).",
    example: "Maya at Elevra",
  },
  senderTitle: {
    label: "Sender Title",
    description: "Sender’s title or role, shown under their name.",
    example: "Community Partnerships",
  },
  senderLinkedInUrl: {
    label: "Sender LinkedIn URL",
    description: "Public LinkedIn profile URL for the sender.",
    example: "https://linkedin.com/in/maya-lee",
  },
  senderLinkedInLabel: {
    label: "Sender LinkedIn Label",
    description: "Link text for the sender’s LinkedIn URL.",
    example: "LinkedIn",
  },
};

export default function EmailTemplatesClient({
  initialTemplates,
}: EmailTemplatesClientProps) {
  usePageTitle("Admin – Email Templates");
  const { toast } = useToast();

  const [templates, setTemplates] = useState<EmailTemplateClientModel[]>(
    [...initialTemplates].sort((a, b) => a.title.localeCompare(b.title))
  );
  const [selectedKey, setSelectedKey] = useState<string>(
    [...initialTemplates].sort((a, b) => a.title.localeCompare(b.title))[0]
      ?.key ?? ""
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedKey) ?? null,
    [templates, selectedKey]
  );

  const [subject, setSubject] = useState<string>(
    selectedTemplate?.subjectTemplate ?? ""
  );
  const [lastSavedSubject, setLastSavedSubject] = useState<string>(
    selectedTemplate?.subjectTemplate ?? ""
  );
  const [initialContent, setInitialContent] = useState<string>(
    selectedTemplate?.htmlTemplate ?? ""
  );
  const [lastSavedHtml, setLastSavedHtml] = useState<string>(
    selectedTemplate?.htmlTemplate ?? ""
  );
  const [lastSavedAt, setLastSavedAt] = useState<string>(
    selectedTemplate?.updatedAt ?? new Date().toISOString()
  );

  useEffect(() => {
    if (selectedTemplate) {
      setSubject(selectedTemplate.subjectTemplate);
      setLastSavedSubject(selectedTemplate.subjectTemplate);
      setInitialContent(selectedTemplate.htmlTemplate);
      setLastSavedHtml(selectedTemplate.htmlTemplate);
      setLastSavedAt(selectedTemplate.updatedAt);
    } else {
      setSubject("");
      setLastSavedSubject("");
      setInitialContent("");
      setLastSavedHtml("");
      setLastSavedAt(new Date().toISOString());
    }
  }, [selectedTemplate]);

  const subjectDirty = subject.trim() !== lastSavedSubject.trim();

  const formattedUpdatedAt = useMemo(() => {
    try {
      return Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastSavedAt));
    } catch {
      return lastSavedAt;
    }
  }, [lastSavedAt]);

  const templateOptions = useMemo(
    () =>
      templates.map((template) => ({
        key: template.key,
        title: template.title,
      })),
    [templates]
  );

  const handleSave = async ({
    html,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    json: any;
    html: string;
  }) => {
    if (!selectedTemplate) {
      toast({
        variant: "destructive",
        title: "No template selected",
        description: "Please choose a template before saving.",
      });
      throw new Error("Template not selected");
    }

    const subjectValue = subject.trim();
    if (!subjectValue) {
      toast({
        variant: "destructive",
        title: "Subject required",
        description: "Please enter a subject before saving this template.",
      });
      throw new Error("Subject is required");
    }

    const response = await fetch(
      `/api/admin/email-templates/${encodeURIComponent(selectedTemplate.key)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectTemplate: subjectValue,
          htmlTemplate: html,
        }),
      }
    );

    let data: {
      subjectTemplate?: string;
      htmlTemplate?: string;
      updatedAt?: string;
      error?: string;
    } | null = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data?.error ||
        `Failed to update template "${selectedTemplate.title}". Please try again.`;
      toast({
        variant: "destructive",
        title: "Save failed",
        description: message,
      });
      throw new Error(message);
    }

    const nextSubject = data?.subjectTemplate ?? subjectValue;
    const nextHtml = data?.htmlTemplate ?? html;
    const nextUpdatedAt = data?.updatedAt ?? new Date().toISOString();
    const savedAtLabel = (() => {
      try {
        return Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(nextUpdatedAt));
      } catch {
        return nextUpdatedAt;
      }
    })();

    setSubject(nextSubject);
    setLastSavedSubject(nextSubject);
    setInitialContent(nextHtml);
    setLastSavedHtml(nextHtml);
    setLastSavedAt(nextUpdatedAt);
    setTemplates((prev) =>
      [...prev]
        .map((template) =>
          template.id === selectedTemplate.id
            ? {
                ...template,
                subjectTemplate: nextSubject,
                htmlTemplate: nextHtml,
                updatedAt: nextUpdatedAt,
              }
            : template
        )
        .sort((a, b) => a.title.localeCompare(b.title))
    );

    toast({
      title: "Template saved",
      description: `Updated ${selectedTemplate.title} at ${savedAtLabel}.`,
    });
  };

  const handleResetSubject = () => {
    setSubject(lastSavedSubject);
  };

  const handleTemplateCreated = (template: EmailTemplateClientModel) => {
    setTemplates((prev) =>
      [...prev, template].sort((a, b) => a.title.localeCompare(b.title))
    );
    setSelectedKey(template.key);
    toast({
      title: "Template created",
      description: `“${template.title}” is ready to edit.`,
    });
  };

  const placeholderBadges = useMemo(
    () =>
      EMAIL_TEMPLATE_VARIABLES.map((variable) => {
        const meta = VARIABLE_METADATA[variable] ?? {
          label: variable,
          description: "Variable used when composing outreach emails.",
          example: "Example value",
        };
        return (
          <Tooltip key={variable}>
            <TooltipTrigger asChild>
              <span className="cursor-help rounded-md bg-purple-50 px-2 py-1 font-mono text-xs text-purple-700">
                {`{{${variable}}}`}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-left">
              <p className="font-semibold text-white">{meta.label}</p>
              <p className="mt-1 text-white/90">{meta.description}</p>
              <p className="mt-2 text-white/70">
                <span className="font-semibold text-white">Example:</span>{" "}
                {meta.example}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      }),
    []
  );

  const hasTemplates = templates.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Outreach Email Templates
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Update the copy used by the candidate outreach flows. Select a
              template, adjust the subject, and edit the HTML body using the
              rich text editor. Merge variables are replaced automatically when
              emails send.
            </p>
          </div>
          <NewTemplateDialog onTemplateCreated={handleTemplateCreated} />
        </div>
        <TooltipProvider delayDuration={120}>
          <div className="mt-4 flex flex-wrap gap-2">{placeholderBadges}</div>
        </TooltipProvider>
      </section>

      {hasTemplates ? (
        <Card className="bg-white">
          <CardHeader className="space-y-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">
                  {selectedTemplate?.title ?? "Select a template"}
                </CardTitle>
                {selectedTemplate?.description ? (
                  <CardDescription>
                    {selectedTemplate.description}
                  </CardDescription>
                ) : null}
                {selectedTemplate ? (
                  <p className="text-xs text-slate-500">
                    Last updated {formattedUpdatedAt}
                  </p>
                ) : null}
              </div>
              <div className="w-full max-w-xs">
                <Select
                  value={selectedKey}
                  onValueChange={(value) => setSelectedKey(value)}
                >
                  <SelectTrigger aria-label="Select email template">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateOptions.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Subject
              </label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  value={subject}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSubject(event.target.value)
                  }
                  placeholder="Subject line"
                  className={`w-full ${
                    subjectDirty ? "border-purple-500" : ""
                  }`}
                  disabled={!selectedTemplate}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetSubject}
                  disabled={!subjectDirty}
                  className="w-full md:w-auto"
                >
                  Reset
                </Button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Use placeholders like{" "}
                <span className="font-mono">{"{{greetingName}}"}</span> to
                personalize subjects.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                HTML Content
              </label>
              <SimpleEditor
                key={selectedTemplate?.id ?? "template-editor"}
                initialContent={initialContent}
                onSave={handleSave}
                allowMediaUploads={false}
              />
              <p className="mt-2 text-xs text-slate-500">
                Current HTML length: {lastSavedHtml.length.toLocaleString()}{" "}
                characters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">
              No templates available yet
            </CardTitle>
            <CardDescription>
              Create your first outreach template to begin editing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewTemplateDialog onTemplateCreated={handleTemplateCreated} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}

type NewTemplateDialogProps = {
  onTemplateCreated: (template: EmailTemplateClientModel) => void;
};

function NewTemplateDialog({ onTemplateCreated }: NewTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [description, setDescription] = useState("");
  const [htmlTemplate, setHtmlTemplate] = useState(DEFAULT_NEW_TEMPLATE_HTML);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setKey("");
    setSubjectTemplate("");
    setDescription("");
    setHtmlTemplate(DEFAULT_NEW_TEMPLATE_HTML);
    setError(null);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          key,
          subjectTemplate,
          htmlTemplate,
          description,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          data?.error || "Failed to create template. Please try again later."
        );
        return;
      }
      const template = (data as { template: EmailTemplateClientModel })
        .template;
      onTemplateCreated(template);
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while creating template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="purple" className="self-start">
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new email template</DialogTitle>
          <DialogDescription>
            Provide a title, optional key, and any starters for the content. You
            can fine-tune the HTML after creation in the editor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <Input
              value={title}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setTitle(event.target.value)
              }
              placeholder="e.g., Primary Follow-up"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Key (optional)
            </label>
            <Input
              value={key}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setKey(event.target.value)
              }
              placeholder="Defaults to a slug based on the title"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Subject (optional)
            </label>
            <Input
              value={subjectTemplate}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSubjectTemplate(event.target.value)
              }
              placeholder="Subject line"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(event.target.value)
              }
              rows={2}
              placeholder="Short description for other admins"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Initial HTML (optional)
            </label>
            <Textarea
              value={htmlTemplate}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setHtmlTemplate(event.target.value)
              }
              rows={6}
            />
            <p className="mt-1 text-xs text-slate-500">
              You can refine this HTML after creation using the rich text
              editor.
            </p>
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
