import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  resumesTable,
  mockInterviewsTable,
  jobBookmarksTable,
  roadmapsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateProfile } from "../lib/profile";
import { computeCareerReadiness } from "../lib/careerReadiness";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const profile = await getOrCreateProfile(userId);

  const [latestResume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, userId))
    .orderBy(desc(resumesTable.createdAt))
    .limit(1);

  const interviews = await db
    .select()
    .from(mockInterviewsTable)
    .where(eq(mockInterviewsTable.userId, userId));

  const bookmarks = await db
    .select()
    .from(jobBookmarksTable)
    .where(eq(jobBookmarksTable.userId, userId));

  const [latestRoadmap] = await db
    .select()
    .from(roadmapsTable)
    .where(eq(roadmapsTable.userId, userId))
    .orderBy(desc(roadmapsTable.createdAt))
    .limit(1);

  const learningProgressPercent =
    latestRoadmap && latestRoadmap.steps.length > 0
      ? Math.round(
          (latestRoadmap.steps.filter((s) => s.completed).length /
            latestRoadmap.steps.length) *
            100,
        )
      : 0;

  const careerReadiness = await computeCareerReadiness(userId);

  const tasksToday = [
    {
      id: "resume",
      label: "Upload or refresh your resume analysis",
      done: !!latestResume,
    },
    {
      id: "roadmap",
      label: "Review today's roadmap step",
      done: !!latestRoadmap,
    },
    {
      id: "interview",
      label: "Practice a mock interview question",
      done: interviews.some((i) => i.status === "completed"),
    },
  ];

  const recentActivity = [
    ...(latestResume
      ? [
          {
            id: `resume-${latestResume.id}`,
            type: "resume",
            title: `Analyzed resume: ${latestResume.fileName}`,
            createdAt: latestResume.createdAt,
          },
        ]
      : []),
    ...interviews.slice(-3).map((i) => ({
      id: `interview-${i.id}`,
      type: "interview",
      title: `${i.interviewType} interview for ${i.jobRole}`,
      createdAt: i.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  res.json(
    GetDashboardSummaryResponse.parse({
      careerReadiness,
      latestAtsScore: latestResume?.atsScore ?? null,
      tasksToday,
      learningProgressPercent,
      upcomingInterviews: interviews.filter((i) => i.status === "in_progress")
        .length,
      applicationsSubmitted: bookmarks.length,
      currentStreak: profile.streak,
      recentActivity,
    }),
  );
});

export default router;
