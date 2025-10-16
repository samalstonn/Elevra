import { Suspense } from 'react';
import ScriptsClient from './scriptsClient';

export const metadata = {
  title: 'Admin • Scripts Runner',
};

export default async function Page() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Scripts Runner</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Run admin tasks with parameters. Admin-only. Results render below each task.
      </p>
      <Suspense fallback={<div>Loading…</div>}>
        {/* Client component fetches task list and runs tasks via API */}
        <ScriptsClient />
      </Suspense>
    </div>
  );
}

