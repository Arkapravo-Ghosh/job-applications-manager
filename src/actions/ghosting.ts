"use server";

import { refresh, revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { ghostingSettingsSchema } from "@/lib/ghosting";
import { reconcileGhostedApplications, saveGhostingSettings } from "@/lib/ghosting-server";

function refreshApplications() {
  revalidatePath("/applications");
  revalidatePath("/stats");
}
export async function saveGhostingSettingsAction(input: unknown) {
  const session = await getSession();
  if (!session) return { error: "Please log in to save your settings." };
  const parsed = ghostingSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid duration." };
  try {
    const changed = await saveGhostingSettings(session.userId, parsed.data);
    refreshApplications();
    return { success: true, changed };
  } catch (error) {
    console.error("Failed to save ghosting settings:", error);
    return { error: "Could not save settings. Please try again." };
  }
}
export async function reconcileGhostedApplicationsAction() {
  const session = await getSession();
  if (!session) return { error: "Please log in to refresh your applications." };
  try {
    const changed = await reconcileGhostedApplications(session.userId);
    if (changed) refreshApplications();
    else refresh(); // Also show changes already persisted by pg_cron.
    return { success: true, changed };
  } catch (error) {
    console.error("Failed to check overdue applications:", error);
    return { error: "Could not check for ghosted applications. Try refreshing the page." };
  }
}
