"use client";
import { useEffect, useMemo, useState } from "react";

type Param = { name: string; label?: string; type: "string" | "number" | "boolean"; placeholder?: string };
type Example = { label: string; args: Record<string, unknown> };
type Task = { key: string; title: string; description?: string; params: Param[]; examples?: Example[] };

export default function ScriptsClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const res = await fetch("/api/admin/scripts", { cache: "no-store" });
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (!res.ok) throw new Error(`Load failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setTasks(data.tasks as Task[]);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  if (forbidden) return <div className="text-sm text-red-600">Admins only.</div>;
  if (loading) return <div>Loading tasks…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      {tasks.map((t) => (
        <TaskCard key={t.key} task={t} />
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Reset on task change
    setForm({});
    setResult(null);
    setErr(null);
  }, [task.key]);

  const onChange = (name: string, value: any) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const body = useMemo(() => ({ key: task.key, args: form }), [task.key, form]);

  const run = async () => {
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data?.error || `HTTP ${res.status}`);
      setResult(data.result);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 md:p-5 bg-background">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium leading-tight">{task.title}</h2>
          {task.description ? (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          ) : null}
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="shrink-0 h-9 rounded-md px-3 text-sm font-medium bg-purple-600 text-white disabled:opacity-50"
        >
          {busy ? "Running…" : "Run"}
        </button>
      </div>

      {task.params?.length ? (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {task.params.map((p) => (
            <ParamField key={p.name} param={p} value={form[p.name]} onChange={onChange} />
          ))}
        </div>
      ) : null}

      {task.examples && task.examples.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {task.examples.map((ex) => (
            <button
              key={ex.label}
              className="h-8 rounded-md border px-2 text-xs bg-white"
              onClick={() => setForm(ex.args)}
              type="button"
            >
              Load: {ex.label}
            </button>
          ))}
        </div>
      ) : null}

      {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}

      {result != null ? (
        <div className="mt-3 overflow-auto rounded border bg-muted/30">
          <pre className="text-xs p-3 whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

function ParamField({
  param,
  value,
  onChange,
}: {
  param: Param;
  value: any;
  onChange: (name: string, value: any) => void;
}) {
  const id = `${param.name}`;
  const label = param.label || param.name;
  if (param.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(param.name, e.target.checked)}
          className="h-4 w-4"
        />
        <span>{label}</span>
      </label>
    );
  }
  return (
    <div className="grid gap-1 text-sm">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label} <span className="opacity-70">({param.type})</span>
      </label>
      <input
        id={id}
        type={param.type === "number" ? "number" : "text"}
        inputMode={param.type === "number" ? "numeric" : undefined}
        placeholder={param.placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(param.name, param.type === "number" ? e.target.valueAsNumber : e.target.value)}
        className="h-9 rounded-md border px-3 bg-background"
      />
    </div>
  );
}
