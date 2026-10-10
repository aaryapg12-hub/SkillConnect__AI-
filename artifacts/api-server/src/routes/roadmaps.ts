import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, roadmapsTable, type RoadmapStepEntry } from "@workspace/db";
import {
  CreateRoadmapBody,
  CreateRoadmapResponse,
  ListRoadmapsResponse,
  UpdateRoadmapProgressParams,
  UpdateRoadmapProgressBody,
  UpdateRoadmapProgressResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { generateJson } from "../lib/openaiClient";
import { awardXp } from "../lib/profile";

const router: IRouter = Router();

interface RoadmapPlan {
  steps: Omit<RoadmapStepEntry, "completed">[];
}

router.get("/roadmaps", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(roadmapsTable)
    .where(eq(roadmapsTable.userId, req.userId!))
    .orderBy(desc(roadmapsTable.createdAt));
  res.json(ListRoadmapsResponse.parse(rows));
});

router.post("/roadmaps", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateRoadmapBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  req.log.info("Generating AI learning roadmap");
  const plan = await generateJson<RoadmapPlan>({
    system:
      "You are a learning path designer. Given a target career role, design a step-by-step learning roadmap. " +
      "Return a JSON object with exactly one key: steps, an array of 6-10 objects each with: " +
      "order (integer starting at 1), title (string), description (string), resources (array of strings - " +
      "specific courses, books, or sites). Return ONLY valid JSON.",
    user: `Target role: ${parsed.data.targetRole}`,
  });

  const steps: RoadmapStepEntry[] = plan.steps.map((s) => ({
    ...s,
    completed: false,
  }));

  const [row] = await db
    .insert(roadmapsTable)
    .values({
      userId: req.userId!,
      targetRole: parsed.data.targetRole,
      steps,
    })
    .returning();

  await awardXp(req.userId!, 20);

  res.status(201).json(CreateRoadmapResponse.parse(row));
});

router.patch(
  "/roadmaps/:id/progress",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpdateRoadmapProgressParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateRoadmapProgressBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(roadmapsTable)
      .where(
        and(
          eq(roadmapsTable.id, params.data.id),
          eq(roadmapsTable.userId, req.userId!),
        ),
      );

    if (!existing) {
      res.status(404).json({ error: "Roadmap not found" });
      return;
    }

    const completedSet = new Set(parsed.data.completedSteps);
    const updatedSteps: RoadmapStepEntry[] = existing.steps.map((s) => ({
      ...s,
      completed: completedSet.has(s.order),
    }));

    const [row] = await db
      .update(roadmapsTable)
      .set({ steps: updatedSteps })
      .where(eq(roadmapsTable.id, params.data.id))
      .returning();

    await awardXp(req.userId!, 5);

    res.json(UpdateRoadmapProgressResponse.parse(row));
  },
);

export default router;
