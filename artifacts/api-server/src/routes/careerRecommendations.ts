import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, careerRecommendationsTable, type CareerPathEntry } from "@workspace/db";
import {
  CreateCareerRecommendationBody,
  CreateCareerRecommendationResponse,
  ListCareerRecommendationsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { generateJson } from "../lib/openaiClient";
import { awardXp } from "../lib/profile";

const router: IRouter = Router();

interface CareerRecommendationAnalysis {
  careerPaths: CareerPathEntry[];
  salaryRange: string;
  certifications: string[];
  trendingTechnologies: string[];
  learningResources: string[];
  difficultyLevel: string;
}

router.get(
  "/career-recommendations",
  requireAuth,
  async (req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(careerRecommendationsTable)
      .where(eq(careerRecommendationsTable.userId, req.userId!))
      .orderBy(desc(careerRecommendationsTable.createdAt));
    res.json(ListCareerRecommendationsResponse.parse(rows));
  },
);

router.post(
  "/career-recommendations",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateCareerRecommendationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    req.log.info("Generating AI career recommendations");
    const analysis = await generateJson<CareerRecommendationAnalysis>({
      system:
        "You are a career strategist AI. Given a person's interests and background, suggest career paths. " +
        "Return a JSON object with exactly these keys: " +
        "careerPaths (array of 3-5 objects with title, description, matchScore [0-100 integer]), " +
        "salaryRange (string, e.g. '$70,000 - $110,000'), " +
        "certifications (array of strings - relevant certifications to pursue), " +
        "trendingTechnologies (array of strings), " +
        "learningResources (array of strings - courses/books/platforms), " +
        "difficultyLevel (string: 'Beginner', 'Intermediate', or 'Advanced'). " +
        "Return ONLY valid JSON.",
      user: `Interests: ${parsed.data.interests}\nBackground: ${parsed.data.background ?? "not specified"}`,
    });

    const [row] = await db
      .insert(careerRecommendationsTable)
      .values({
        userId: req.userId!,
        careerPaths: analysis.careerPaths,
        salaryRange: analysis.salaryRange,
        certifications: analysis.certifications,
        trendingTechnologies: analysis.trendingTechnologies,
        learningResources: analysis.learningResources,
        difficultyLevel: analysis.difficultyLevel,
      })
      .returning();

    await awardXp(req.userId!, 20);

    res.status(201).json(CreateCareerRecommendationResponse.parse(row));
  },
);

export default router;
