import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, skillGapsTable } from "@workspace/db";
import {
  CreateSkillGapAnalysisBody,
  CreateSkillGapAnalysisResponse,
  ListSkillGapAnalysesResponse,
  GetSkillGapAnalysisParams,
  GetSkillGapAnalysisResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { generateJson } from "../lib/openaiClient";
import { awardXp } from "../lib/profile";

const router: IRouter = Router();

interface SkillGapAnalysis {
  requiredSkills: string[];
  missingSkills: string[];
  prioritySkills: string[];
  recommendations: string[];
}

router.get("/skill-gaps", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(skillGapsTable)
    .where(eq(skillGapsTable.userId, req.userId!))
    .orderBy(desc(skillGapsTable.createdAt));
  res.json(ListSkillGapAnalysesResponse.parse(rows));
});

router.post("/skill-gaps", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSkillGapAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  req.log.info("Running AI skill gap analysis");
  const analysis = await generateJson<SkillGapAnalysis>({
    system:
      "You are a career skills advisor. Given a target job role and the candidate's current skills, " +
      "return a JSON object with exactly these keys: " +
      "requiredSkills (array of strings - key skills required for the target role), " +
      "missingSkills (array of strings - subset of requiredSkills the candidate lacks), " +
      "prioritySkills (array of strings - which missing skills to learn first, ordered by priority), " +
      "recommendations (array of strings - concrete actionable advice to close the gaps). " +
      "Return ONLY valid JSON.",
    user: `Target role: ${parsed.data.targetRole}\nCurrent skills: ${parsed.data.currentSkills.join(", ") || "none listed"}`,
  });

  const [row] = await db
    .insert(skillGapsTable)
    .values({
      userId: req.userId!,
      targetRole: parsed.data.targetRole,
      currentSkills: parsed.data.currentSkills,
      requiredSkills: analysis.requiredSkills,
      missingSkills: analysis.missingSkills,
      prioritySkills: analysis.prioritySkills,
      recommendations: analysis.recommendations,
    })
    .returning();

  await awardXp(req.userId!, 20);

  res.status(201).json(CreateSkillGapAnalysisResponse.parse(row));
});

router.get("/skill-gaps/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetSkillGapAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(skillGapsTable)
    .where(
      and(
        eq(skillGapsTable.id, params.data.id),
        eq(skillGapsTable.userId, req.userId!),
      ),
    );

  if (!row) {
    res.status(404).json({ error: "Skill gap analysis not found" });
    return;
  }

  res.json(GetSkillGapAnalysisResponse.parse(row));
});

export default router;
