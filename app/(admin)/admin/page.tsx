"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  authorName?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  contentMd: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
}

interface BlogForm {
  title: string;
  authorName: string;
  tags: string; // comma separated
  contentMd: string;
  status: "DRAFT" | "PUBLISHED";
}

// New type for request payload (create/update)
interface BlogPostUpsertRequest {
  id?: number;
  title: string;
  contentMd: string;
  authorName?: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
}

export default function AdminDashboard() {
  usePageTitle("Admin – Dashboard");
  const { toast } = useToast();
  const sendTestEmail = async () => {
    try {
      const res = await fetch("/api/admin/email-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: "Test Email",
          data: {
            title: "Admin Test Email",
            intro:
              "This is a test email with a link to elevracommunity.com",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: data.dryRun ? "Email dry-run" : "Email sent",
          description: data.dryRun
            ? "Message captured (no email sent in development)."
            : "Email sent successfully!",
        });
      } else {
        toast({
          title: "Email failed",
          description: String(data.error || "Unknown error"),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Email failed",
        description: "Unexpected error while sending test email.",
        variant: "destructive",
      });
    }
  };

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);

  const emptyForm: BlogForm = {
    title: "",
    authorName: "",
    tags: "",
    contentMd: "",
    status: "DRAFT",
  };
  const [form, setForm] = useState<BlogForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/blog?limit=100&includeDrafts=1", {
        cache: "no-store",
      });
      const data = await res.json();
      setPosts(data);
    } finally {
      setLoadingPosts(false);
    }
  };
  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload: BlogPostUpsertRequest = {
        title: form.title,
        contentMd: form.contentMd,
        authorName: form.authorName || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: form.status,
      };
      if (editing) payload = { ...payload, id: editing.id };
      const method = editing ? "PATCH" : "POST";
      const res = await fetch("/api/blog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        alert("Save failed");
        return;
      }
      setForm({ ...emptyForm });
      setEditing(null);
      fetchPosts();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      title: p.title,
      authorName: p.authorName || "",
      tags: p.tags.join(", "),
      contentMd: p.contentMd,
      status: p.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const togglePublish = async (p: BlogPost) => {
    const res = await fetch("/api/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: p.id,
        status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
      }),
    });
    if (res.ok) fetchPosts();
  };

  const deletePost = async (p: BlogPost) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/blog?id=${p.id}`, { method: "DELETE" });
    if (res.ok) fetchPosts();
    else alert("Delete failed");
  };

  return (
    <main className="max-w-6xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="space-y-4 mb-10">
        <Link
          href="/admin/user-validation"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          View User Validation Requests
        </Link>
        <Link
          href="/admin/upload-spreadsheet"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Upload Spreadsheet
        </Link>
        <button
          onClick={sendTestEmail}
          className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Send Test Email
        </button>
      </div>

      <section className="mb-16">
        <h2 className="text-xl font-semibold mb-4">
          {editing ? "Edit Blog Post" : "New Blog Post"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white/70 p-4 rounded border"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Author Name
              </label>
              <input
                value={form.authorName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, authorName: e.target.value }))
                }
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Tags (comma separated)
              </label>
              <input
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                className="w-full rounded border px-3 py-2"
                placeholder="civics, elections"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as "DRAFT" | "PUBLISHED",
                }))
              }
              className="rounded border px-3 py-2"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-4">
              Content (Markdown)
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className="text-xs text-purple-600 underline"
              >
                {preview ? "Edit" : "Preview"}
              </button>
            </label>
            {!preview ? (
              <textarea
                value={form.contentMd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contentMd: e.target.value }))
                }
                className="w-full h-64 rounded border px-3 py-2 font-mono text-sm"
                required
              />
            ) : (
              <MarkdownPreview source={form.contentMd} />
            )}
          </div>
          <div className="flex gap-3">
            <button
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              type="submit"
            >
              {saving ? "Saving..." : editing ? "Update Post" : "Create Post"}
            </button>
            {editing && (
              <button
                onClick={() => {
                  setEditing(null);
                  setForm({ ...emptyForm });
                }}
                type="button"
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        {loadingPosts ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-sm border rounded overflow-hidden">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Title</th>
                <th className="p-2">Status</th>
                <th className="p-2">Published</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.title}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        p.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-2">
                    {p.publishedAt
                      ? new Date(p.publishedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-purple-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => togglePublish(p)}
                      className="text-blue-600 hover:underline"
                    >
                      {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => deletePost(p)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                    {p.status === "PUBLISHED" && (
                      <a
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function MarkdownPreview({ source }: { source: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    (async () => {
      const { marked } = await import("marked");
      marked.setOptions({ gfm: true, breaks: true });
      const DOMPurify = (await import("isomorphic-dompurify")).default;
      const parsed = marked.parse(source);
      if (parsed instanceof Promise) {
        parsed.then((resolved) => setHtml(DOMPurify.sanitize(resolved)));
      } else {
        setHtml(DOMPurify.sanitize(parsed as string));
      }
    })();
  }, [source]);
  return (
    <div
      className="prose max-w-none border rounded p-4 bg-white/50 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
