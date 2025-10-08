# Gemini Queue Orchestration Plan

## Goals
- Convert the synchronous spreadsheet ingestion flow at `/admin/upload-spreadsheet` into an asynchronous queue that respects Google Gemini model rate limits.
- Persist progress in Prisma so the admin UI, cron dispatcher, and notification emails have a single source of truth.
- Guarantee uploads generate result workbooks and candidate/election links whenever possible, while clearly marking batches that need re-uploading.

## Data Modeling (Prisma)
1. **SpreadsheetUpload**
   - Add fields: `status`, `failureReason`, `originalFilename`, `uploaderEmail`, `summaryJson`, `resultWorkbookUrl` (if we store in object storage), timestamps.
2. **UploadElectionBatch**
   - `id`, `uploadId`, grouped location/position metadata, raw serialized rows, `status`, `errorReason`, `analyzeJobId`, `structureJobId`, `insertJobId`, timestamps.
3. **GeminiJob**
   - `id`, `uploadId`, `batchId`, `type` (`analyze`, `structure`, `insert`), `status`, `priority`, `dependencyJobId`, `preferredModels` (JSON array), `fallbackModels` (JSON array), `nextRunAt`, `retryCount`, timestamps.
4. **GeminiJobAttempt**
   - `id`, `jobId`, `modelUsed`, `startedAt`, `completedAt`, `requestTokens`, `responseTokens`, `statusCode`, `responseBody`, `errorType`, `createdAt`.
5. **UploadNotificationLog** (optional)
   - Track each email send to uploader/team for auditing and retry logic.

## Rate Limit Tiers & Dispatch Logic
- Encode the clarified limits:  
  - Gemini 2.5 Pro: 150 RPM, 2M TPM, 10K RPD, 5M batch enqueued tokens.  
  - Gemini 1.5 Pro (deprecated fallback): 1000 RPM, 4M TPM.  
  - Gemini 2.5 Flash (primary for structure): 1000 RPM, 1M TPM, 10K RPD.  
  - Gemini 2.0 Flash (backup for structure jobs): 2000 RPM, 4M TPM, 3M batch enqueued tokens.
- Maintain per-model usage counters in the dispatcher (shared via database row or redis-like table) to coordinate concurrent cron invocations.
- Dispatcher steps per cron run:  
  1. Load pending jobs ordered by `nextRunAt`, `priority`, `createdAt`.  
  2. For each job, confirm rate capacity for its preferred model. If insufficient, defer to fallback model list (update job metadata when fallback chosen).  
  3. Mark job `in_progress`, write start attempt row, execute Gemini call.  
  4. On quota error, update attempt, increment retry/backoff, switch to next fallback (2.5 → 1.5 for analyze; 2.0 flash primary, fallback to 2.5 flash if requested).  
  5. Persist structured outputs (analysis JSON, structured prompt results) directly on `UploadElectionBatch`.  
  6. When both analyze & structure succeed, enqueue `insert` job that calls existing insertion helpers.

## Workflow Breakdown
1. **Upload Submission**
   - Store parsed spreadsheet rows and metadata in `SpreadsheetUpload`.
   - Group by election (existing helper) to create `UploadElectionBatch` records with `status='queued'`.
   - Enqueue Gemini jobs per batch: analyze then structure. Each structure job depends on its analyze job.
   - UI immediately returns `uploadId`; client polls new status endpoint or subscribes via SSE.

2. **Admin Controls**
   - Add ability in UI to rerun failed batches: resetting job statuses, pushing new job attempts, or allowing skip with reason.
   - Present per-batch statuses, attempt counts, last error.

3. **Cron Dispatcher**
   - Vercel cron (e.g., every minute) invokes `/api/cron/gemini-dispatch`. Handler:  
     - Resets timed-out jobs (in progress > configured window).  
     - Dispatches jobs until time budget (e.g., 20 executions) or rate budget exhausted.  
     - Kicks off insert jobs once Gemini outputs stored.  
     - After all batches inserted, triggers workbook build + final email send.

4. **Workbook Generation & Persistence**
   - Rework existing `buildAndDownloadResultSheet` to read from database (e.g., `Election`, `Candidate`, `ElectionLink`) instead of in-memory results.  
   - Run workbook build after insertion jobs succeed.  
   - Store workbook file temporarily (e.g., S3) and record URL in `SpreadsheetUpload.resultWorkbookUrl`.  
   - Include workbook attachment or link in final email to uploader and team.

5. **Candidate & Election Links**
   - Ensure insert job populates both `CandidateLink` and `ElectionLink` entries for successfully processed rows.  
   - If any batch fails, mark `UploadElectionBatch.status='needs_reupload'` and include reason.  
   - In final summary email, highlight elections needing re-upload and the ones successfully inserted (with direct URLs).

6. **Email Notifications**
   - Send emails to uploader + `team@elevracommunity.com` at:  
     1. Upload queued (include queue depth estimate).  
     2. Analyze phase complete (note any model fallbacks).  
     3. Structure phase complete (note fallbacks).  
     4. Final insertion & workbook ready (attach or link workbook; summarize successes, failures, fallback usage).  
     5. Failure alerts per batch as they occur.
   - Emails should pull data from `SpreadsheetUpload.summaryJson` to avoid recomputing.
workbooks should be sent as an attachment to the final email with resend.


7. **Error Handling & Retries**
   - Apply exponential backoff with max retry count per job (e.g., 5).  
   - Record final failure state; allow manual admin rerun via UI.  
   - Log fallback usage in `GeminiJobAttempt` to surface in UI and emails.

8. **Security & Cleanup**
   - Guard new APIs with `requireAdminOrSubAdmin`.  
   - Since parsed data suffices, purge raw uploads after jobs complete unless flagged for debugging.  
   - Sanitize AI outputs before storing/displaying.



