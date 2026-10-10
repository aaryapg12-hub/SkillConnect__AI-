import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, coverLettersTable, resumesTable } from "@workspace/db";
import {
  CreateCoverLetterBody,
  CreateCoverLetterResponse,
  ListCoverLettersResponse,
  GetCoverLetterParams,
  GetCoverLetterResponse,
  DeleteCoverLetterParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { openai, CHAT_MODEL } from "../lib/openaiClient";
import { awardXp } from "../lib/profile";

const router: IRouter = Router();

router.get("/cover-letters", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(coverLettersTable)
    .where(eq(coverLettersTable.userId, req.userId!))
    .orderBy(desc(coverLettersTable.createdAt));
  res.json(ListCoverLettersResponse.parse(rows));
});

router.post("/cover-letters", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCoverLetterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [latestResume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, req.userId!))
    .orderBy(desc(resumesTable.createdAt))
    .limit(1);

  req.log.info("Generating AI cover letter");
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an expert cover letter writer. Write a compelling, specific, professional cover letter " +
          "of 3-4 paragraphs. Do not use placeholder brackets - write it ready to send. Return plain text only, no markdown.",
      },
      {
        role: "user",
        content:
          `Job title: ${parsed.data.jobTitle}\nCompany: ${parsed.data.company}\n` +
          `Job description: ${parsed.data.jobDescription ?? "not provided"}\n` +
          (latestResume
            ? `Candidate resume:\n${latestResume.resumeText}`
            : "No resume on file - write a strong general cover letter based on the job details."),
      },
    ],
  });

  const content =
    completion.choices[0]?.message?.content ?? "Unable to generate cover letter.";

  const [row] = await db
    .insert(coverLettersTable)
    .values({
      userId: req.userId!,
      jobTitle: parsed.data.jobTitle,
      company: parsed.data.company,
      content,
    })
    .returning();

  await awardXp(req.userId!, 15);

  res.status(201).json(CreateCoverLetterResponse.parse(row));
});

router.get(
  "/cover-letters/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetCoverLetterParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .select()
      .from(coverLettersTable)
      .where(
        and(
          eq(coverLettersTable.id, params.data.id),
          eq(coverLettersTable.userId, req.userId!),
        ),
      );

    if (!row) {
      res.status(404).json({ error: "Cover letter not found" });
      return;
    }

    res.json(GetCoverLetterResponse.parse(row));
  },
);

router.delete(
  "/cover-letters/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteCoverLetterParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .delete(coverLettersTable)
      .where(
        and(
          eq(coverLettersTable.id, params.data.id),
          eq(coverLettersTable.userId, req.userId!),
        ),
      )
      .returning();

    if (!row) {
      res.status(404).json({ error: "Cover letter not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
