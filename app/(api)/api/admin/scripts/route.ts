import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getAdminFlags } from '@/lib/admin-auth';
import { tasks, getTask } from '@/lib/admin-tasks/registry';

export async function GET() {
  const { userId } = await auth();
  const flags = await getAdminFlags(userId);
  if (!flags.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const summary = tasks.map((t) => ({
    key: t.key,
    title: t.title,
    description: t.description,
    params: t.params ?? [],
    examples: t.examples ?? [],
  }));
  return NextResponse.json({ tasks: summary });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const flags = await getAdminFlags(userId);
  if (!flags.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const key = String(body?.key || '');
  const args = (body?.args as Record<string, unknown>) || {};
  const task = getTask(key);
  if (!task) {
    return NextResponse.json({ error: `Unknown task: ${key}` }, { status: 404 });
  }
  try {
    const result = await task.run(args);
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    console.error('Task run error', key, error);
    return NextResponse.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}
