import { eq, desc } from "drizzle-orm";
import {
  db,
  resumesTable,
  skillGapsTable,
  mockInterviewsTable,
  roadmapsTable,
} from "@workspace/db";

/**
 * Career readiness is a 0-100 composite score derived from the user's real
 * activity: latest resume ATS score, skill-gap coverage, completed mock
 * interview performance, and roadmap progress. Recomputed on read so it
 * never drifts from underlying records.
 */
export async function computeCareerReadiness(userId: string): Promise<number> {
  const [latestResume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, userId))
    .orderBy(desc(resumesTable.createdAt))
    .limit(1);

  const [latestSkillGap] = await db
    .select()
    .from(skillGapsTable)
    .where(eq(skillGapsTable.userId, userId))
    .orderBy(desc(skillGapsTable.createdAt))
    .limit(1);

  const completedInterviews = await db
    .select()
    .from(mockInterviewsTable)
    .where(eq(mockInterviewsTable.userId, userId));

  const [latestRoadmap] = await db
    .select()
    .from(roadmapsTable)
    .where(eq(roadmapsTable.userId, userId))
    .orderBy(desc(roadmapsTable.createdAt))
    .limit(1);

  const resumeComponent = latestResume ? latestResume.atsScore : 0;

  let skillGapComponent = 0;
  if (latestSkillGap) {
    const total =
      latestSkillGap.requiredSkills.length || latestSkillGap.currentSkills.length || 1;
    const covered = Math.max(total - latestSkillGap.missingSkills.length, 0);
    skillGapComponent = Math.round((covered / total) * 100);
  }

  const finishedInterviews = completedInterviews.filter(
    (i) => i.status === "completed" && i.overallScore != null,
  );
  const interviewComponent =
    finishedInterviews.length > 0
      ? Math.round(
          finishedInterviews.reduce((sum, i) => sum + (i.overallScore ?? 0), 0) /
            finishedInterviews.length,
        )
      : 0;

  let roadmapComponent = 0;
  if (latestRoadmap && latestRoadmap.steps.length > 0) {
    const completed = latestRoadmap.steps.filter((s) => s.completed).length;
    roadmapComponent = Math.round((completed / latestRoadmap.steps.length) * 100);
  }

  const weights: { value: number; weight: number }[] = [];
  if (latestResume) weights.push({ value: resumeComponent, weight: 0.3 });
  if (latestSkillGap) weights.push({ value: skillGapComponent, weight: 0.25 });
  if (finishedInterviews.length > 0)
    weights.push({ value: interviewComponent, weight: 0.25 });
  if (latestRoadmap) weights.push({ value: roadmapComponent, weight: 0.2 });

  if (weights.length === 0) return 0;

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const score =
    weights.reduce((sum, w) => sum + w.value * w.weight, 0) / totalWeight;

  return Math.round(Math.min(Math.max(score, 0), 100));
}
