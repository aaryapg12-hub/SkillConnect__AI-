import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { GetProfileResponse, UpdateProfileBody, UpdateProfileResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { getOrCreateProfile } from "../lib/profile";
import { computeCareerReadiness } from "../lib/careerReadiness";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile(req.userId!);
  const careerReadiness = await computeCareerReadiness(req.userId!);
  res.json(GetProfileResponse.parse({ ...profile, careerReadiness }));
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateProfile(req.userId!);

  const [updated] = await db
    .update(profilesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(profilesTable.userId, req.userId!))
    .returning();

  const careerReadiness = await computeCareerReadiness(req.userId!);
  res.json(UpdateProfileResponse.parse({ ...updated, careerReadiness }));
});

export default router;
