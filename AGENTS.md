# Agents Playbook

## Core Principles
- Preserve React’s rules of hooks. Never introduce conditional hook calls or reorder existing hooks when modifying client components.
- After substantial edits or refactors run `npm run build` to ensure Next.js, TypeScript, and Prisma code still compile together.
- Follow project conventions: TypeScript everywhere, Tailwind CSS utility-first styling, and the shadcn-derived UI primitives under `components/ui`.
- Assume the app runs in production on Vercel with serverless Next.js routes; optimize for edge-safe code (no long-lived connections in route handlers).

## Technology Stack
- **Framework**: Next.js 15 (app router) with server and client components, React 19, Suspense/streaming enabled.
- **Auth**: Clerk for authentication, session management, and metadata-backed roles.
- **Database**: PostgreSQL accessed through Prisma Client (`prisma/schema.prisma`).
- **Styling**: Tailwind CSS, shadcn/ui variants, Framer Motion for animation flourishes.
- **Forms & Validation**: React Hook Form + Zod (see candidate/vendor dashboards).
- **APIs & Integrations**: Mapbox (geocoding & autocomplete), Resend (email), Stripe (checkout webhooks), Google GenAI (candidate import automation).
- **Tooling**: Playwright for E2E tests, ESLint 9, TypeScript 5.8, Turbopack dev server.

## High-Level Application Domains
- **Public Voter Experience** (`app/page.tsx`, `app/(voters)`): homepage search, election results, live election listings, submission workflows.
- **Candidate Experience** (`app/(candidates)/candidates`): marketing page, login CTA, dashboard (`candidate-dashboard`) for managing profile data and analytics.
- **Vendor Experience** (`app/(vendors)/vendors`): vendor onboarding and dashboard with service listings and testimonials.
- **Admin And Sub-Admin Tools** (`app/(admin)/admin`): full admin dashboard, blog management, data import, outreach, cascade delete safeguards.
- **Content And Marketing** (`app/(blog)`, `components/FeatureCards.tsx`, `components/AboutUs.tsx`): blog posts, feature highlights, guided tours.

## Directory Overview
| Path | Description |
| --- | --- |
| `app` | App router segments grouped by audience (`(voters)`, `(candidates)`, `(vendors)`, `(admin)`, plus shared layout & marketing pages). |
| `components` | Feature components (search, analytics, onboarding, shared UI) plus `components/ui` shadcn primitives and `components/tour` modal. |
| `hooks` | Client hooks; currently `use-toast` for global toast state. |
| `lib` | Utilities (admin auth, debounce, geocoding, Stripe, email templates, Prisma singleton, etc.). |
| `prisma` | Prisma schema, generated client setup, and multiple seed scripts. |
| `election-source` | Spreadsheet ingestion helpers, AI prompt templates, and structured output references for bulk candidate loading. |
| `tests` | Playwright end-to-end specs plus supporting fixtures. |
| `public` | Static assets, marketing images, favicons. |
| `types` | Shared TypeScript interfaces for geocoding, candidates, vendors, search responses. |

## Routing And Layout
- `app/layout.tsx` wraps the entire tree with `LayoutClient`, delegating metadata to a static export and pushing Clerk providers down to the client boundary.
- `app/(layout)/LayoutClient.tsx` sets up the `<ClerkProvider>`, global header/footer, toasts, and Vercel analytics. It uses Suspense around `HeaderNav` to allow `useSearchParams`.
- `app/(layout)/HeaderButtons.tsx` renders top-level navigation with responsive icons; `My Dashboard` routes change based on pathname (candidate vs vendor).
- `app/(footer-pages)/Footer.tsx` provides legal links (`/terms`, `/privacy`, `/feedback`) and submission CTA.
- Not found states are handled via `app/not-found.tsx` (check for custom UX before adding new 404 pages).

## Authentication And Authorization
- Clerk middleware (`middleware.ts`) protects dashboard, vendor, and admin routes. It redirects unauthenticated users to `/sign-in?redirect_url=…`.
- Admin enforcement:
  - Server-side helpers live in `lib/admin-auth.ts` (`getAdminFlags`, `requireAdminOrSubAdmin`).
  - Middleware restricts `/admin` paths: full admins can access everything, sub-admins are limited to `/admin/sub-admin`, `/admin/upload-spreadsheet`, `/admin/candidate-outreach`, and `/admin/search`.
  - Client components must double-check visibility with `user.privateMetadata?.isAdmin || user.privateMetadata?.isSubAdmin` before rendering privileged UI.
- Other protected handlers (e.g., `/api/admin/*`, `/api/candidate`) call `auth()` from `@clerk/nextjs/server` and gate execution via `requireAdminOrSubAdmin` or direct user matching.

## Data Models (Prisma)
- **Candidate**: Primary profile including bio, links, Clerk user link (`clerkUserId`), slug, donation stats, relation to `ElectionLink`, `Endorsement`, `Vendor`.
- **Election**: Stores municipal context, positions, type (enum `ElectionType`), hidden flag, `uploadedBy` audit email.
- **ElectionLink**: Join table between candidates and elections with per-election content configuration (policies, sources, `ContentBlock`).
- **ContentBlock**: Rich content segments (heading, text, list, image, video) powering candidate microsites.
- **Donation**: Stripe-backed donation records with compliance data (`isRetiredOrUnemployed`, occupation, etc.).
- **Vendor** + related tables: support marketplace listings with service categories, testimonials, portfolio entries.
- **BlogPost**: Admin-managed blog entries with Markdown content (`contentMd`) and status (`BlogStatus`).
- **Submission Models**: Pending candidate/election submissions, validation requests, and onboarding flows for moderation.
- **Photo**: Uploaded asset tracking (key + url).

Seed scripts (`prisma/seed.ts`, `seedSchoolBoard.ts`, etc.) populate initial elections, vendors, and photo references. Use `prisma/seed.ts` via `npx prisma db seed` when needed.

## API Surface
_All routes live under `app/(api)/api` and use Next.js route handlers._
- **Public APIs**:
  - `/api/candidates` & `/api/elections`: list visible records for search and UI hydration.
  - `/api/candidateViews`: track and aggregate candidate profile view counts.
  - `/api/endorsement`, `/api/feedback`: create new endorsements/feedback submissions.
  - `/api/universities`: return normalized university data (see `lib/universities.ts`).
  - `/api/photos`: upload/list candidate photos with Clerk auth checks.
  - `/api/checkout_sessions`: Stripe checkout session creation; ensures `candidateId` lookup before redirect.
  - `/api/send-email`: public contact form submissions (rate-limit and captcha recommended for future).
  - `/api/session-info`: exposes session role flags to clients that cannot call Clerk directly.
- **Candidate Self-Service** (`/api/candidate`): GET returns candidate dashboard data, POST creates an approved-but-hidden candidate linked to the Clerk user, PUT updates key profile fields.
- **Admin APIs** (`/api/admin/*`):
  - `email-proxy`, `email` send templated Resend emails; respect dry-run logs when `EMAIL_DRY_RUN=1`.
  - `candidate-outreach` streams AI-personalized messages.
  - `search` provides faceted search over candidates/elections with visibility filters.
  - `cascade-delete` inspects & deletes candidate hierarchies; includes GET preview for bulk operations.
  - `backfill-contentblocks`, `seed-structured` mutate content blocks from structured JSON.
  - `email-template-preview` renders HTML previews for the outreach templates.
  - `approve-request` flips validation requests to approved, triggers email notifications, and toggles `hidden` flags.
- **Vendor APIs**: look for routes under `/api/vendor` to manage vendor CRUD and discovery.
- **Stripe Webhooks** (`/api/webhooks/stripe`): validates signature with `STRIPE_WEBHOOK_SECRET` and notifies admins of payments via email.

## Key Components And Features
- **Homepage (`app/page.tsx`)**: hero with animated search (`components/SearchBar.tsx`), `LiveElectionBanner`, `Showcase`, `AboutUs`, and `FeatureCards`.
- **Search Bar** (`components/SearchBar.tsx`): progressive enhancement with animated placeholder, Mapbox autocomplete, election-aware suggestions, error handling via `ErrorPopup` and `components/ui/Autocomplete.tsx`.
- **Showcase** (`components/Showcase.tsx`): tabbed image carousel for voters/campaigns/vendors with fallback text block when assets fail.
- **Election Results** (`app/(voters)/results`): server component fetches elections via Prisma; `ElectionResultsClient` handles filtering, sticky tab buttons, and fallback CTA when no data.
- **Live Elections** (`app/(voters)/live-elections/page.tsx`): groups active elections by location using `isElectionActive` helper.
- **Submissions** (`app/(voters)/submit`): tabbed forms. `CandidateSubmissionForm` persists drafts to localStorage, enforces policy count, fetches election context, and posts to `/api/candidateSubmission`. `ElectionSubmissionForm` mirrors structure for election proposals.
- **Candidate Dashboard** (`app/(candidates)/candidates/candidate-dashboard`): layout with analytics (`components/AnalyticsChart.tsx`, `components/StatsCard.tsx`), profile editors, donation imports, and vendor marketplace entry points.
- **Vendor Marketplace**: `VendorGrid`, `VendorCard`, filters by category/location, reuses types from `types/vendor.ts`.
- **Admin Dashboard** (`app/(admin)/admin/page.tsx`): blog management interface (Markdown preview via dynamic `marked` import and DOMPurify), email test button, cascade delete UI with slug previews, bulk operations.
- **Sub Admin Hub** (`app/(admin)/admin/sub-admin/page.tsx`): quick links to CSV upload, directory search, outreach tool.
- **Spreadsheet Upload** (`app/(admin)/admin/upload-spreadsheet/page.tsx`): heavy client workflow orchestrating CSV parsing, Gemini analysis/structure endpoints, go-live steps, and `buildAndDownloadResultSheet` export.
- **Tour Modal** (`components/tour/TourModal.tsx`): interactive onboarding overlay.

## UI Primitives And Styling
- shadcn-based primitives live under `components/ui` (buttons, cards, tabs, toast, dialog, select, charts). `components/ui/button.tsx` defines variants (`purple`, `whitePrimaryOutline`, etc.) used widely across marketing pages.
- Tailwind utilities drive layout; `globals.css` sets theme tokens (`bg-background`, `text-foreground`). Respect responsive patterns already established (mobile-first, with `md:` breakpoints for toggling text vs icon buttons).
- Animations rely on Framer Motion (`motion.div` wrappers). When adding motion, keep transitions consistent with existing `easeOut` / `duration: 0.6` patterns.

## Hooks And State Utilities
- `lib/usePageTitle.ts`: sets document title on client fallback pages; avoid redundant updates by passing fully formatted titles.
- `hooks/use-toast.ts`: custom toast reducer inspired by react-hot-toast. Access via `useToast` or `toast` helper; view renders through `components/ui/toaster.tsx` mounted in layout.
- `lib/debounce.ts`: safe debounce helper for client fetch endpoints (used in search bars).
- `lib/useCandidate.ts`: fetches candidate data with SWR-style caching (review before adding new candidate-specific hooks).

## Email And Notification System
- `lib/email/resend.ts` centralizes Resend calls with in-process rate limiting, dry-run defaults, optional disk logging, and batch send helper (`sendEmailBatch`). Respect `EMAIL_DRY_RUN`/`EMAIL_DRY_RUN_LOG` toggles during development/testing.
- Templates under `lib/email/templates`:
  - `adminNotification.ts`: renders HTML table-based summaries for admin alerts (e.g., new candidate signup).
  - `render.ts`: handles candidate outreach templates (`initial`, `followup`, `followup2`, `verifiedUpdate`) with interpolation helpers.
  - HTML fragments live in `lib/email/templates/html/*.html` for easier copy updates.
- Admin outreach flows use `/api/admin/email` + `/api/admin/email-proxy` to send or preview messages without exposing Resend keys to the client.

## Data Import And AI Assistance
- `election-source/build-spreadsheet.ts` builds result spreadsheets linking candidates and elections, generating attachments via the XLSX library.
- `election-source/helpers.ts` normalizes headers, extracts raw values, validates email formats/duplications.
- Gemini endpoints (`/api/gemini/analyze`, `/api/gemini/structure`) provide structured content from CSV rows; the upload page orchestrates confirmation prompts when fallback models are used.
- Structured templates (`app/(templates)/basicwebpage.ts`) seed `ContentBlock` arrays for candidate microsites.

## External Services
- **Mapbox**: `lib/geocoding.ts` for search suggestions and normalization. Requires `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- **Stripe**: `lib/get-stripe.ts` lazy-loads publishable key, `app/(api)/api/checkout_sessions` & webhook handle payments; fixed fee calculation lives in `lib/functions.ts` (`calculateFee`).
- **Resend**: API key via `RESEND_API_KEY`; from address default defined in code. Admin email notifications require `ADMIN_EMAIL`.
- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` enforced at layout load time, `CLERK_SECRET_KEY` server-side for route handlers.
- **Vercel Analytics / Speed Insights**: automatically injected by layout for runtime metrics.

## Testing And Quality Assurance
- Playwright config (`playwright.config.ts`) runs `npm run dev` for tests, sets `EMAIL_DRY_RUN=1`, and defines projects for login flows, outreach, admin email smoke tests.
- Test utilities: `tests/e2e/global.setup.ts` seeds data and stores session state; `tests/files` contains fixture spreadsheets.
- When modifying login flows, update selectors in `tests/e2e/login-with-clerk.ts` and `tests/e2e/this-is-me.ts`.
- Use `npm run lint` before committing to catch TypeScript/ESLint issues; add targeted unit tests where logic becomes complex (e.g., helper utilities).

## Environment Configuration
- Required env vars (non-exhaustive):
  - `DATABASE_URL`, `SHADOW_DATABASE_URL` for Prisma.
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
  - `NEXT_PUBLIC_APP_URL` (used in emails and Playwright).
  - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for geocoding.
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
  - `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_EMAIL`.
  - `EMAIL_DRY_RUN`, `EMAIL_DRY_RUN_LOG`, `EMAIL_RATE_LIMIT_PER_SEC` for email behavior.
  - Testing secrets: `E2E_SEED_SECRET`, `E2E_CLERK_USER_USERNAME`, `E2E_CLERK_USER_PASSWORD`, etc.
- Prisma generates clients via `prisma generate`; `npm run build` automatically triggers this before Next build.

## Build, Deploy, And Verification
- Development: `npm run dev` (Turbopack). Keep `.env.local` with required keys.
- Production build: `npm run build` runs Prisma generate then `next build`. Always run it after non-trivial changes to confirm TS types, Prisma queries, and route handlers compile.
- Start: `npm run start` in production mode.
- Linting: `npm run lint` uses Next lint rules plus `eslint-plugin-unused-imports`.

## Observability And Logging
- Client instrumentation through Vercel Analytics and Speed Insights (enabled in layout).
- Server logging: critical errors are logged via `console.error` in API handlers. Email dry-run logs append to `lib/email/logs/.test-emails.log` when enabled.
- Consider centralizing logging later (cloud logging provider) if noise increases; currently manual inspection suffices.

## Contribution Guidelines
- Respect the existing folder segmentation; add new user-facing flows inside the appropriate audience segment.
- Prefer server components for data-fetching pages; isolate client-only interactivity into child components.
- Use Prisma selects to limit payload size and avoid leaking hidden data (e.g., filter on `hidden: false` for public endpoints).
- Sanitize user-generated markdown via DOMPurify before rendering (see admin blog preview).
- When introducing new admin features, wire both middleware authorization and client-side metadata checks.

## Open Considerations
- Verify if middleware’s unused `m` import from `framer-motion` can be cleaned up (currently unused).
- Evaluate rate limits on public submission endpoints; consider adding reCAPTCHA or clerk rate limiting.
- Admin dashboard contains large client bundle; future work could split views into dynamic imports.

## Quick Reference Checklist For Agents
- [ ] Keep hook call order untouched when editing existing React components.
- [ ] Run `npm run build` after significant edits to validate types, Prisma, and route handlers.
- [ ] Update Playwright specs if changing auth flows or admin tooling.
- [ ] Document new APIs/components here to keep the playbook current.
