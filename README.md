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
  </p>
</div>

---

## ✨ Features

- 📋 **Application Lifecycle Management**
  - Track stages: **Applied**, **Interviewing**, **Selected**, **Rejected**, and **Withdrawn**.
  - **Smart Autocomplete**: Dynamic typeahead suggestions for Company and Role titles based on your previous applications to prevent duplicate entries (e.g., "amex" vs "Amex").
  - **Interview Stepper**: Interactive `[-] count [+]` stepper directly in the table row to easily log rounds of interviews given, with instant optimistic UI updates.
  - Direct application links, customizable application dates, compensation/salary notes, and custom notes.

- 🔍 **Interactive Table & Multi-Filtering**
  - **Instant Search**: Search across job title, company name, and location.
  - **Multi-Select Filters**: Filter simultaneously across multiple statuses and companies with an in-filter search input.
  - **Sorting & Pagination**: Sort by date, company, role, status, or interview rounds with clean pagination controls.

- 📊 **Visual Analytics (`/stats`)**
  - **KPI Metrics**: Overview cards for Total Applications, Active Pipeline, Offers Received, Rejection Rate, and Total Interview Rounds.
  - **Application Funnel**: Track conversion rates at every stage of your hiring pipeline.
  - **Cadence & Timeline**: Interactive timeline chart depicting application activity over time.
  - **Status & Company Breakdowns**: Visual distribution across stages and top applied companies using Recharts.

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
git clone https://github.com/arkapravoghosh/job-applications-manager.git
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

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the production bundle |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint checks across the codebase |
| `npm run db:push` | Pushes the Drizzle ORM schema directly to the database |
| `npm run db:seed` | Seeds database with initial data |

---

## 📄 License & Author

Created and maintained by **Arkapravo Ghosh**.

© 2026 Arkapravo Ghosh. All rights reserved.
