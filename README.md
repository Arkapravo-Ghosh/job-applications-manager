# JobTrack

<div align="center">
  <img src="src/app/opengraph-image.png" alt="JobTrack — Track your job hunt without the clutter" width="100%" />

  <br />
  <br />

  <p align="center">
    <strong>Track your job hunt without the clutter.</strong><br />
    A fast, modern job application tracker and analytics platform with instant search, multi-faceted filtering, and interview round tracking.
  </p>

  <p align="center">
    <a href="https://jobtrack.arkapravo.in"><strong>🌐 Live App: jobtrack.arkapravo.in</strong></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=flat-square&logo=drizzle" alt="Drizzle ORM" />
    <img src="https://img.shields.io/badge/shadcn%2Fui-Components-black?style=flat-square" alt="shadcn/ui" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL_3.0-blue.svg?style=flat-square" alt="AGPL-3.0 License" /></a>
  </p>
</div>

---

## ✨ Features

- 📋 **Application Lifecycle Management**
  - Track stages: **Applied**, **Interviewing**, **Selected**, **Rejected**, **Withdrawn**, and **Ghosted**.
  - **Smart Autocomplete**: Dynamic typeahead suggestions for Company and Role titles based on your previous applications to prevent duplicate entries (e.g., "amex" vs "Amex").
  - **Interview Stepper**: Interactive `[-] count [+]` stepper directly in the table row to easily log rounds of interviews given, with instant optimistic UI updates.
  - Every interview `+` sets the status to **Interviewing**, including from closed or Ghosted applications. Decrementing does not change status.
  - **Auto-ghosting**: a compact button opens responsive settings with an opt-in toggle, six presets (default 3 months), and combined custom years/months/weeks/days.
  - Direct application links, customizable application dates, compensation/salary notes, and custom notes.

- 🔍 **Interactive Table & Multi-Filtering**
  - **Instant Search**: Search across job title, company name, and location.
  - **Multi-Select Filters**: Filter simultaneously across multiple statuses and companies with an in-filter search input.
  - **Sorting & Pagination**: Sort by date, company, role, status, or interview rounds with clean pagination controls.

- 📊 **Visual Analytics (`/stats`)**
  - **Shared reporting period**: Last week, month, 3 months (default), 6 months, year, or an inclusive custom date range. Every view filters by application submission date; current outcomes and interview counts are attached to those applications, not necessarily events that occurred in that period.
  - **Three focused charts**: Current pipeline (ring by default, switchable to bar), application cadence (bar or line, including zero periods), and interview workload (1, 2, 3, 4, 5+ recorded interviews; no assumed interview types).
  - **Useful summaries**: Applications, distinct companies, total recorded interviews, and applications with recorded interviews, including subsequently rejected, withdrawn, or ghosted applications.
  - **Needs attention**: Applied/Interviewing opportunities sorted by inactivity, with automatic ghosting deadlines when enabled. Inactivity measures the last recorded status change or interview addition, not recruiter contact.
  - **Company / role comparisons**: Sortable counts and clearly defined rates, with cards on mobile/tablet and a desktop table. Drill-downs preserve the reporting period, chart choices, comparison settings, and scroll position when returning to stats.
  - **Honest definitions**: Selected / Offer does not imply acceptance. Historical conversion and response times are not inferred from current statuses. Charts use existing shadcn components without modifying their source.

- 🌓 **Modern Aesthetics & Dark Mode**
  - Clean, distraction-free interface built with Tailwind CSS and shadcn/ui.
  - Seamless Light, Dark, and System theme switching.
  - Custom SVG favicon matching the application navbar badge.

- 🔒 **Authentication & Privacy**
  - Secure credential-based authentication using HTTP-only session cookies and password hashing.
  - Multi-tenant architecture with strict per-user data isolation.

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, Turbopack)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Charts & Visualizations**: [Recharts](https://recharts.org/)
- **Database & ORM**: [PostgreSQL (Neon Serverless)](https://neon.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: JWT session tokens via [jose](https://github.com/panva/jose) & password hashing via [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Forms & Validation**: [Zod](https://zod.dev/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- A PostgreSQL database (e.g. [Neon](https://neon.tech), Supabase, or local PostgreSQL)

### 1. Clone the repository

```bash
git clone https://github.com/Arkapravo-Ghosh/job-applications-manager.git
cd job-applications-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXT_PUBLIC_APP_URL="https://jobtrack.arkapravo.in"
```

### 4. Push database schema

Push the Drizzle schema to your PostgreSQL database:

```bash
npm run db:push
npm run db:migrate:ghosting
```

*(Optional) Seed sample data:*

```bash
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---


### Existing installations: timestamp backfill

Run `npm run db:migrate:ghosting` **before serving the updated app or running `db:push` against an existing database**. The transactional, repeatable migration adds missing columns and populates `status_updated_at` from `updated_at`, falling back to `created_at`. Missing `updated_at` values are filled from `created_at`. Existing non-null timestamps, statuses, counts, and application dates are preserved.

New applications initialize all three timestamps to the creation instant. The migration installs a `BEFORE INSERT` trigger so direct database inserts that supply a historical `created_at` also inherit that value for omitted update timestamps. Do not skip the migration on a new database: `db:push` alone does not install this trigger.

Only a status change or interview `+` resets the inactivity clock. Editing notes or other details and decrementing interviews do not reset it. Historical status-change dates cannot be recovered; backfilled `updated_at` may reflect a later ordinary edit.

### Daily background checks with pg_cron

All ghosting rules live in PostgreSQL functions installed by `npm run db:migrate:ghosting`. Both the web app and `pg_cron` call these functions, so calendar arithmetic, eligibility, locking, and batching use one implementation.

Enable the scheduler once per database:

1. Load `pg_cron` on the PostgreSQL compute and set `cron.database_name` to the application database. On Neon, use the endpoint's `settings.pg_settings` configuration and restart the compute to apply it; preserve other endpoint settings. See [Neon's pg_cron setup](https://neon.com/docs/extensions/pg_cron).
2. Run `npm run db:enable:ghosting-cron`. This installs the extension and creates/updates the named job **jobtrack-auto-ghosting**, running `SELECT public.jobtrack_reconcile_all();` daily at `0 0 * * *` (UTC, 05:30 IST). Re-running the command updates the same job rather than duplicating it.
3. Verify the job and its execution history:

```sql
SELECT jobid, jobname, schedule, database, active
FROM cron.job WHERE jobname = 'jobtrack-auto-ghosting';
SELECT status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'jobtrack-auto-ghosting')
ORDER BY start_time DESC LIMIT 5;
```

This scheduler requires no Vercel cron configuration, HTTP endpoint, or `CRON_SECRET`. It runs independently of the website deployment. Functions use caller privileges, and execution is revoked from PUBLIC; schedule the job as the application database role that owns them. On Neon, jobs execute while the compute is active. The configured app endpoint was verified to have `suspend_timeout_seconds = 0` when this integration was installed.

Applications and stats also catch up through authenticated Server Actions on open/focus, including refreshing changes that the database scheduler already made; no database writes occur during page rendering. Only overdue Applied/Interviewing applications for enabled users become Ghosted. Disabling automation does not restore past statuses; a manual status change or interview `+` can reopen them. Settings default to off and 3 months per user. Calendar years/months clamp to month end before adding weeks/days, using UTC.

Sweeps use locked, conditional updates in batches of 500 (up to 2,000 per user per invocation, 100 overdue users per cron invocation). Repeated or overlapping invocations are safe; unusually large backlogs or skipped busy rows may require further invocations. Ordinary background transitions can occur after the deadline on the next successful daily run; open/focus checks catch up sooner.

### Verification

```bash
npm test
TEST_DATABASE_URL=postgresql://user@127.0.0.1:5432/test_database npm run test:integration
npm run lint
npx tsc --noEmit
npm run build
```

Integration tests require a separate local PostgreSQL connection via `TEST_DATABASE_URL`, create disposable schemas, and never modify the configured application's tables. They cover legacy backfills, duration arithmetic, exact deadline boundaries, account isolation, optimistic-write conflict protection, concurrent increments and reconciliation, and scheduled execution without a UI.

For an isolated verification build alongside a running dev server, set `NEXT_DIST_DIR=.next-qa-build` for both `npm run build` and `npm start -- --port 3001`, along with a separate test `DATABASE_URL`. This leaves the normal `.next` dev build running.

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the production bundle |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint checks across the codebase |
| `npm run db:push` | Pushes the Drizzle ORM schema directly to the database |
| `npm run db:migrate:ghosting` | Add ghosting preferences and backfill status timestamps safely |
| `npm run db:enable:ghosting-cron` | Install pg_cron and register the daily database job |
| `npm test` | Run duration and validation unit tests |
| `npm run test:integration` | Run database integration tests using local TEST_DATABASE_URL |
| `npm run db:seed` | Seeds database with initial data |

---

## 📄 License & Author

Created and maintained by **[Arkapravo Ghosh](https://github.com/Arkapravo-Ghosh)**.

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see the [LICENSE](LICENSE) file for the full text.

© 2026 Arkapravo Ghosh. All rights reserved.
