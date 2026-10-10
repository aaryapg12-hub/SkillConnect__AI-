import { eq, sql } from "drizzle-orm";
import { db, profilesTable, type Profile } from "@workspace/db";

export async function getOrCreateProfile(userId: string): Promise<Profile> {
  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(profilesTable)
    .values({ userId, name: "New Member" })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return created;
  }

  const [fetched] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));

  if (!fetched) {
    throw new Error("Failed to create or fetch profile");
  }
  return fetched;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Awards XP for an activity and updates the daily streak. Call this whenever
 * the user completes a meaningful action (resume analysis, interview, etc.)
 */
export async function awardXp(userId: string, amount: number): Promise<void> {
  const profile = await getOrCreateProfile(userId);
  const today = todayIso();
  const yesterday = yesterdayIso();

  let nextStreak = profile.streak;
  if (profile.lastActiveDate === today) {
    // already active today, streak unchanged
  } else if (profile.lastActiveDate === yesterday) {
    nextStreak = profile.streak + 1;
  } else {
    nextStreak = 1;
  }

  await db
    .update(profilesTable)
    .set({
      xp: sql`${profilesTable.xp} + ${amount}`,
      streak: nextStreak,
      lastActiveDate: today,
      updatedAt: new Date(),
    })
    .where(eq(profilesTable.userId, userId));
}
