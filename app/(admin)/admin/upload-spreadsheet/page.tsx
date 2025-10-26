import { Suspense } from "react";
import UploadSpreadsheetClient from "./UploadSpreadsheetClient";

export default function UploadSpreadsheetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading upload tools…</div>}>
      <UploadSpreadsheetClient />
    </Suspense>
  );
}
