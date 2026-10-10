import { Router, type IRouter } from "express";
import { eq, and, ilike, inArray } from "drizzle-orm";
import { db, jobListingsTable, jobBookmarksTable } from "@workspace/db";
import {
  ListJobsQueryParams,
  ListJobsResponse,
  GetJobParams,
  GetJobResponse,
  ToggleJobBookmarkParams,
  ToggleJobBookmarkResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/jobs", requireAuth, async (req, res): Promise<void> => {
  const query = ListJobsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.role) conditions.push(ilike(jobListingsTable.role, `%${query.data.role}%`));
  if (query.data.location)
    conditions.push(ilike(jobListingsTable.location, `%${query.data.location}%`));
  if (query.data.experienceLevel)
    conditions.push(eq(jobListingsTable.experienceLevel, query.data.experienceLevel));

  const jobs = await db
    .select()
    .from(jobListingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const bookmarks = await db
    .select()
    .from(jobBookmarksTable)
    .where(eq(jobBookmarksTable.userId, req.userId!));
  const bookmarkedIds = new Set(bookmarks.map((b) => b.jobId));

  let result = jobs.map((j) => ({ ...j, isBookmarked: bookmarkedIds.has(j.id) }));
  if (query.data.bookmarkedOnly) {
    result = result.filter((j) => j.isBookmarked);
  }

  res.json(ListJobsResponse.parse(result));
});

router.get("/jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .select()
    .from(jobListingsTable)
    .where(eq(jobListingsTable.id, params.data.id));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [bookmark] = await db
    .select()
    .from(jobBookmarksTable)
    .where(
      and(
        eq(jobBookmarksTable.userId, req.userId!),
        eq(jobBookmarksTable.jobId, job.id),
      ),
    );

  res.json(GetJobResponse.parse({ ...job, isBookmarked: !!bookmark }));
});

router.post(
  "/jobs/:id/bookmark",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ToggleJobBookmarkParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [job] = await db
      .select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, params.data.id));

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const [existing] = await db
      .select()
      .from(jobBookmarksTable)
      .where(
        and(
          eq(jobBookmarksTable.userId, req.userId!),
          eq(jobBookmarksTable.jobId, job.id),
        ),
      );

    if (existing) {
      await db.delete(jobBookmarksTable).where(eq(jobBookmarksTable.id, existing.id));
      res.json(ToggleJobBookmarkResponse.parse({ ...job, isBookmarked: false }));
      return;
    }

    await db.insert(jobBookmarksTable).values({ userId: req.userId!, jobId: job.id });
    res.json(ToggleJobBookmarkResponse.parse({ ...job, isBookmarked: true }));
  },
);

export default router;
