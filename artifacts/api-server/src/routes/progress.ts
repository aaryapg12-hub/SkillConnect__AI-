import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  resumesTable,
  mockInterviewsTable,
  jobBookmarksTable,
  roadmapsTable,
} from "@workspace/db";
import { GetProgressResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateProfile } from "../lib/profile";
import { computeCareerReadiness } from "../lib/careerReadiness";

const router: IRouter = Router();

router.get("/progress", requireAuth, async (req, res): Promise<void> => {
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

  const roadmaps = await db
    .select()
    .from(roadmapsTable)
    .where(eq(roadmapsTable.userId, userId));

  const completedInterviews = interviews.filter((i) => i.status === "completed");
  const coursesCompleted = roadmaps.reduce(
    (sum, r) => sum + r.steps.filter((s) => s.completed).length,
    0,
  );
  const learningHours = coursesCompleted * 2;

  const careerReadiness = await computeCareerReadiness(userId);

  const achievements = [
    {
      id: "first-resume",
      title: "Resume Ready",
      description: "Analyzed your first resume",
      unlocked: !!latestResume,
    },
    {
      id: "first-interview",
      title: "Interview Warm-Up",
      description: "Completed your first mock interview",
      unlocked: completedInterviews.length > 0,
    },
    {
      id: "interview-pro",
      title: "Interview Pro",
      description: "Completed 5 mock interviews",
      unlocked: completedInterviews.length >= 5,
    },
    {
      id: "roadmap-starter",
      title: "Roadmap Starter",
      description: "Generated your first learning roadmap",
      unlocked: roadmaps.length > 0,
    },
    {
      id: "job-hunter",
      title: "Job Hunter",
      description: "Bookmarked 3 job listings",
      unlocked: bookmarks.length >= 3,
    },
    {
      id: "streak-3",
      title: "On a Roll",
      description: "Reached a 3-day activity streak",
      unlocked: profile.streak >= 3,
    },
    {
      id: "streak-7",
      title: "Consistency Champion",
      description: "Reached a 7-day activity streak",
      unlocked: profile.streak >= 7,
    },
  ];

  res.json(
    GetProgressResponse.parse({
      careerReadiness,
      resumeScore: latestResume?.atsScore ?? null,
      coursesCompleted,
      mockInterviewsCompleted: completedInterviews.length,
      applicationsSubmitted: bookmarks.length,
      learningHours,
      xp: profile.xp,
      streak: profile.streak,
      achievements,
    }),
  );
});

export default router;
