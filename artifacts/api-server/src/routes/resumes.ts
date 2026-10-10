import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, resumesTable } from "@workspace/db";
import {
  CreateResumeBody,
  CreateResumeResponse,
  ListResumesResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { generateJson } from "../lib/openaiClient";
import { awardXp } from "../lib/profile";

const router: IRouter = Router();

interface ResumeAnalysis {
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  grammarSuggestions: string[];
  improvementTips: string[];
  recommendedSkills: string[];
}

router.get("/resumes", requireAuth, async (req, res): Promise<void> => {
  const resumes = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, req.userId!))
    .orderBy(desc(resumesTable.createdAt));
  res.json(ListResumesResponse.parse(resumes));
});

router.post("/resumes", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  req.log.info("Analyzing resume with AI");
  const analysis = await generateJson<ResumeAnalysis>({
    system:
      "You are an expert ATS (Applicant Tracking System) resume reviewer and career coach. " +
      "Analyze the given resume text thoroughly and return a JSON object with exactly these keys: " +
      "atsScore (integer 0-100 reflecting ATS-friendliness and overall quality), " +
      "strengths (array of strings), weaknesses (array of strings), " +
      "missingKeywords (array of strings - important industry keywords missing), " +
      "formattingIssues (array of strings), grammarSuggestions (array of strings), " +
      "improvementTips (array of strings, actionable), " +
      "recommendedSkills (array of strings - skills worth adding/learning). " +
      "Be specific and reference the actual resume content. Return ONLY valid JSON.",
    user: `Resume file name: ${parsed.data.fileName}\n\nResume text:\n${parsed.data.resumeText}`,
  });

  const [resume] = await db
    .insert(resumesTable)
    .values({
      userId: req.userId!,
      fileName: parsed.data.fileName,
      resumeText: parsed.data.resumeText,
      atsScore: analysis.atsScore,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      missingKeywords: analysis.missingKeywords,
      formattingIssues: analysis.formattingIssues,
      grammarSuggestions: analysis.grammarSuggestions,
      improvementTips: analysis.improvementTips,
      recommendedSkills: analysis.recommendedSkills,
    })
    .returning();

  await awardXp(req.userId!, 25);

  res.status(201).json(CreateResumeResponse.parse(resume));
});

export default router;
