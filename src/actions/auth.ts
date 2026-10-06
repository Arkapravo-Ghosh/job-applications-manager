"use server";

import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, deleteSession, hashPassword, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

const authSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AuthActionResult = {
  success?: boolean;
  error?: string;
};

export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawUsername = formData.get("username");
  const rawPassword = formData.get("password");

  const validated = authSchema.safeParse({
    username: rawUsername,
    password: rawPassword,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid input" };
  }

  const { username, password } = validated.data;

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    if (existing.length === 0) {
      return { error: "Invalid username or password" };
    }

    const user = existing[0];
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return { error: "Invalid username or password" };
    }

    await createSession(user.id, user.username);
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred during login" };
  }

  redirect("/applications");
}

export async function registerAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawUsername = formData.get("username");
  const rawPassword = formData.get("password");

  const validated = authSchema.safeParse({
    username: rawUsername,
    password: rawPassword,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid input" };
  }

  const { username, password } = validated.data;

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return { error: "Username is already taken" };
    }

    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        username: username.toLowerCase(),
        passwordHash: hashedPassword,
      })
      .returning();

    await createSession(newUser.id, newUser.username);
  } catch (error) {
    console.error("Register error:", error);
    return { error: "Failed to create account" };
  }

  redirect("/applications");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
