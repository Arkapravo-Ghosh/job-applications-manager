import * as dotenv from "dotenv";
dotenv.config();

import { db } from "./index";
import { users, jobApplications } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting seed...");

  const sampleUsername = "sample";
  const samplePassword = "sample123";
  const hashedPassword = await bcrypt.hash(samplePassword, 10);

  // Check if sample user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, sampleUsername))
    .limit(1);

  let userId: string;

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    // Update password hash just in case
    await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.id, userId));
    console.log(`User '${sampleUsername}' already exists. Re-using ID: ${userId}`);

    // Clear previous seed jobs for clean state
    await db.delete(jobApplications).where(eq(jobApplications.userId, userId));
  } else {
    const [newUser] = await db
      .insert(users)
      .values({
        username: sampleUsername,
        passwordHash: hashedPassword,
      })
      .returning();
    userId = newUser.id;
    console.log(`Created user '${sampleUsername}' with ID: ${userId}`);
  }

  // Realistic sample applications across statuses, dates, roles, and links
  const sampleJobs = [
    {
      userId,
      role: "Senior Full Stack Engineer",
      company: "Vercel",
      status: "interviewing",
      applicationDate: "2026-09-15",
      link: "https://vercel.com/careers/senior-fullstack",
      notes: "Technical interview scheduled with Lead Architect on React 19 / Next.js SSR.",
      interviewCount: 2,
    },
    {
      userId,
      role: "Frontend Engineer (Design Systems)",
      company: "Stripe",
      status: "selected",
      applicationDate: "2026-08-28",
      link: "https://stripe.com/jobs/frontend-design-systems",
      notes: "Offer received! Negotiating base salary and equity package.",
      interviewCount: 4,
    },
    {
      userId,
      role: "Software Engineer - Infrastructure",
      company: "Cloudflare",
      status: "interviewing",
      applicationDate: "2026-09-20",
      link: "https://cloudflare.com/careers/infra-swe",
      notes: "Passed recruiter phone screen, system design round next week.",
      interviewCount: 2,
    },
    {
      userId,
      role: "Fullstack Developer",
      company: "Linear",
      status: "applied",
      applicationDate: "2026-10-01",
      link: "https://linear.app/careers",
      notes: "Applied via referral from former colleague.",
      interviewCount: 0,
    },
    {
      userId,
      role: "Backend Engineer (Go / PostgreSQL)",
      company: "Supabase",
      status: "applied",
      applicationDate: "2026-10-03",
      link: "https://supabase.com/careers",
      notes: "Application submitted through career portal.",
      interviewCount: 0,
    },
    {
      userId,
      role: "Product Engineer",
      company: "Notion",
      status: "rejected",
      applicationDate: "2026-08-10",
      link: "https://notion.so/careers",
      notes: "Rejection email received after portfolio review round.",
      interviewCount: 1,
    },
    {
      userId,
      role: "Senior React Engineer",
      company: "Airbnb",
      status: "rejected",
      applicationDate: "2026-08-05",
      link: "",
      notes: "Position put on freeze according to recruiter.",
      interviewCount: 0,
    },
    {
      userId,
      role: "DevOps / SRE Engineer",
      company: "Datadog",
      status: "withdrawn",
      applicationDate: "2026-08-22",
      link: "https://datadog.com/careers",
      notes: "Withdrawn due to relocation requirements.",
      interviewCount: 1,
    },
    {
      userId,
      role: "AI Platform Engineer",
      company: "OpenAI",
      status: "applied",
      applicationDate: "2026-10-04",
      link: "https://openai.com/careers",
      notes: "Submitted with custom cover letter and AI project links.",
      interviewCount: 0,
    },
    {
      userId,
      role: "Full Stack Engineer",
      company: "GitHub",
      status: "interviewing",
      applicationDate: "2026-09-12",
      link: "https://github.com/careers",
      notes: "Pair programming coding challenge round completed.",
      interviewCount: 3,
    },
    {
      userId,
      role: "Staff Software Engineer",
      company: "Figma",
      status: "applied",
      applicationDate: "2026-10-05",
      link: "https://figma.com/careers",
      notes: "Applied directly on website.",
      interviewCount: 0,
    },
    {
      userId,
      role: "Frontend Architect",
      company: "Canva",
      status: "withdrawn",
      applicationDate: "2026-09-02",
      link: "",
      notes: "Withdrew candidacy after prioritizing Stripe offer.",
      interviewCount: 1,
    },
    {
      userId,
      role: "Core Systems Engineer",
      company: "Postman",
      status: "rejected",
      applicationDate: "2026-08-18",
      link: "https://postman.com/careers",
      notes: "Feedback: decided to proceed with internal candidate.",
      interviewCount: 1,
    },
    {
      userId,
      role: "Senior Cloud Engineer",
      company: "MongoDB",
      status: "applied",
      applicationDate: "2026-10-06",
      link: "https://mongodb.com/careers",
      notes: "Applied today.",
      interviewCount: 0,
    },
    {
      userId,
      role: "TypeScript / Node Developer",
      company: "Shopify",
      status: "interviewing",
      applicationDate: "2026-09-25",
      link: "https://shopify.com/careers",
      notes: "Take-home assessment passed, final managerial chat upcoming.",
      interviewCount: 2,
    },
    {
      userId,
      role: "Lead Platform Engineer",
      company: "Docker",
      status: "selected",
      applicationDate: "2026-08-15",
      link: "https://docker.com/careers",
      notes: "Received competitive offer. Evaluating team fit.",
      interviewCount: 3,
    },
  ];

  await db.insert(jobApplications).values(sampleJobs);

  console.log(`✅ Successfully seeded ${sampleJobs.length} job applications for user 'sample'!`);
  console.log("Credentials:");
  console.log("Username: sample");
  console.log("Password: sample123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
