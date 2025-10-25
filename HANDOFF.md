# Gemini Queue Handoff

## Overview
The Gemini queue converts the admin spreadsheet upload flow into an asynchronous, rate-limited pipeline. Uploads are persisted in Prisma, broken into batches, and processed by a cron-driven dispatcher that runs Gemini analyze → structure → insert jobs. Each phase updates stored status, sends notifications, and, upon completion, generates a workbook attachment for the final email. Admins can now retry or mark failing batches for manual review from the UI.

## Architecture
- **Data models**
  - `SpreadsheetUpload`: overall upload metadata, status, summary JSON, workbook URL placeholder, timestamps.
  - `UploadElectionBatch`: per-batch state, raw rows, Gemini outputs, job IDs.
  - `GeminiJob` / `GeminiJobAttempt`: queue jobs & per-run metadata (model used, tokens, fallbacks, errors).
  - `GeminiRateWindow`: per-model usage counters (RPM/TPM/RPD enforcement).
  - `UploadNotificationLog`: tracks notification emails sent for each stage/failure.

- **Workflow**
  1. **Upload submission** (`/api/gemini/uploads`) persists the upload + batches and seeds analyze/structure/insert jobs. The UI now polls `/api/gemini/uploads/[uploadId]` for status.
  2. **Dispatcher** (`/api/cron/gemini-dispatch`) loops: reset stale jobs, reserve rate capacity, mark in-progress, execute job, record success/failure, enqueue dependents.
  3. **Structure stage** uses flash models (primary `gemini-2.5-flash`, fallback `gemini-2.0-flash`); analyze uses `gemini-2.5-pro` with `gemini-1.5-pro` fallback.
  4. **Insert stage** runs the existing seed logic; upon success, we append results to `summaryJson` and enqueue workbook + notification jobs.
  5. **Workbook + final notification**: workbook job produces XLSX buffer, notification job emails uploader + `team@elevracommunity.com`, attaching the workbook.

- **Notifications**
  - Stages: queued, analyze complete, structure complete, insert complete, final, batch failure. Each stored in `UploadNotificationLog` and deduped.
  - Templates generated inline (subject + HTML). Fallback counts & failure metrics pulled from `summaryJson`.
  - `EMAIL_DRY_RUN` (default "1" in development) prevents actual sends; logs go to console or `lib/email/logs/.test-emails.log`.

- **Admin UI enhancements** (`app/(admin)/admin/upload-spreadsheet/page.tsx`)
  - Shows batches grouped by status with job attempt info (model used, fallback, errors).
  - Adds "Retry" button for failed/needs-reupload batches; "Mark for Re-upload" to skip ongoing batches. Actions hit new endpoint `/api/gemini/uploads/[uploadId]/batches/[batchId]` with `action` set to `retry` or `skip`.

## Workflows & Operational Notes
- **Cron**: `vercel.json` cron entry POSTs `/api/cron/gemini-dispatch` every minute, including `x-cron-secret`. Set `GEMINI_CRON_SECRET` as a Vercel env var.
- **Env requirements**
  - Database: `DATABASE_URL`, `SHADOW_DATABASE_URL` (use direct Neon host, not `-pooler`, or disable interactive transactions).
  - Gemini: `GEMINI_ENABLED`, `GEMINI_API_KEY`, optional `GEMINI_MODEL` overrides.
  - Email: `RESEND_API_KEY`, `RESEND_FROM`, `EMAIL_DRY_RUN` (0 to send real emails), `ADMIN_EMAIL` for reply-to.
- **Rate limits** enforced via `GeminiRateWindow`: per-model counters for RPM/TPM/RPD. `reserveModelCapacity` increments/updates before job execution.
- **Summary JSON** keeps updated counts, stage timestamps, fallback counts, failure count, and `cleanedAt` timestamp after cleanup.
- **Cleanup**: `cleanupUploadData` zeroes out `rawRows`, `analysisJson`, `structuredJson` once an upload finishes and final notification is sent.
- **Failure semantics**
  - Jobs hitting retry limit or marked manually are set to `UploadBatchStatus.NEEDS_REUPLOAD`.
  - Batch failures trigger an email and keep the batch flagged until rerun.
  - Retries reset job attempts, statuses, and remove parsed JSON to re-enter the queue.

## Testing
- `npm run dev` + admin UI to upload CSV/Excel, check status, and trigger dispatcher (curl or rely on cron).
- `npm run lint` / `npm run build` to confirm types.
- Prisma Studio to inspect `SpreadsheetUpload`, `UploadElectionBatch`, `GeminiJob*`, `UploadNotificationLog`.
  - Note: With `EMAIL_DRY_RUN=1`, no real sends occur; final email payload logged to console/log file.
- Use `.env.local` to override DB and Gemini keys; ensure XXL CSVs still process (transaction timeout bumped to 30s).

## Deployment Steps
1. Ensure migrations applied (`prisma migrate dev --name gemini_queue`).
2. Configure env vars on Vercel:
   - `DATABASE_URL` (non-pooler), `SHADOW_DATABASE_URL`
   - `GEMINI_API_KEY`, `GEMINI_ENABLED`, `GEMINI_CRON_SECRET`
   - `RESEND_API_KEY`, `RESEND_FROM`, `EMAIL_DRY_RUN` (0 or 1), `ADMIN_EMAIL`
3. Deploy; Vercel cron starts hitting `/api/cron/gemini-dispatch` automatically.
4. Monitor logs for dispatcher stats and Resend failures; `UploadNotificationLog` shows email state.

## Follow-up / Backlog
- (Optional) Persist workbook to object storage instead of in-memory attachment.
- Consider daily digest email rather than per-phase once reliability is confirmed.
- Enhance failure diagnostics (e.g., store sanitized Gemini outputs in a separate column, add rerun reason tracking).
- Expand automated tests for queue/dispatcher flows.

Feel free to reach out for help tracing specific batches or extending the UI.
