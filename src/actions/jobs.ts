"use server";

import { z } from "zod";
import { db } from "@/db";
import { jobApplications, APPLICATION_STATUSES } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const jobSchema = z.object({
  role: z.string().min(1, "Role title is required").max(150),
  company: z.string().min(1, "Company name is required").max(150),
  status: z.enum(APPLICATION_STATUSES, {
    message: "Invalid status value",
  }),
  applicationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)")
    .optional()
    .default(() => new Date().toISOString().split("T")[0]),
  link: z
    .string()
    .transform((val) => (val?.trim() ? val.trim() : null))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "Link must be a valid URL starting with http:// or https://",
    })
    .nullable()
    .optional(),
  interviewCount: z.coerce.number().int().min(0, "Interview count cannot be negative").default(0),
  notes: z
    .string()
    .transform((val) => (val?.trim() ? val.trim() : null))
    .nullable()
    .optional(),
});

export type JobActionResult = {
  success?: boolean;
  error?: string;
};

export async function createJobAction(formData: FormData): Promise<JobActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to create a job application" };
  }

  const raw = {
    role: formData.get("role"),
    company: formData.get("company"),
    status: formData.get("status") || "applied",
    applicationDate:
      formData.get("applicationDate") || new Date().toISOString().split("T")[0],
    link: formData.get("link") || "",
    notes: formData.get("notes") || "",
    interviewCount: formData.get("interviewCount") ?? 0,
  };

  const validated = jobSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid input data" };
  }

  try {
    await db.insert(jobApplications).values({
      userId: session.userId,
      role: validated.data.role,
      company: validated.data.company,
      status: validated.data.status,
      applicationDate: validated.data.applicationDate,
      link: validated.data.link || null,
      notes: validated.data.notes || null,
      interviewCount: validated.data.interviewCount,
    });

    revalidatePath("/applications");
    revalidatePath("/stats");
    return { success: true };
  } catch (error) {
    console.error("Failed to create job:", error);
    return { error: "Failed to save job application" };
  }
}

export async function updateJobAction(id: string, formData: FormData): Promise<JobActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const raw = {
    role: formData.get("role"),
    company: formData.get("company"),
    status: formData.get("status"),
    applicationDate: formData.get("applicationDate"),
    link: formData.get("link") || "",
    notes: formData.get("notes") || "",
    interviewCount: formData.get("interviewCount") ?? 0,
  };

  const validated = jobSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid input data" };
  }

  try {
    await db
      .update(jobApplications)
      .set({
        role: validated.data.role,
        company: validated.data.company,
        status: validated.data.status,
        applicationDate: validated.data.applicationDate,
        link: validated.data.link || null,
        notes: validated.data.notes || null,
        interviewCount: validated.data.interviewCount,
        updatedAt: new Date(),
      })
      .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, session.userId)));

    revalidatePath("/applications");
    revalidatePath("/stats");
    return { success: true };
  } catch (error) {
    console.error("Failed to update job:", error);
    return { error: "Failed to update job application" };
  }
}

export async function updateInterviewCountAction(id: string, count: number): Promise<JobActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const validatedCount = Math.max(0, Math.floor(count));

  try {
    await db
      .update(jobApplications)
      .set({
        interviewCount: validatedCount,
        updatedAt: new Date(),
      })
      .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, session.userId)));

    revalidatePath("/applications");
    revalidatePath("/stats");
    return { success: true };
  } catch (error) {
    console.error("Failed to update interview count:", error);
    return { error: "Failed to update interview count" };
  }
}

export async function deleteJobAction(id: string): Promise<JobActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await db
      .delete(jobApplications)
      .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, session.userId)));

    revalidatePath("/applications");
    revalidatePath("/stats");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete job:", error);
    return { error: "Failed to delete job application" };
  }
}
