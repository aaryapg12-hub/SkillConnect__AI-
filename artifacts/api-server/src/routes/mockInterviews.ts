import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, mockInterviewsTable, type InterviewMessageEntry } from "@workspace/db";
import {
  CreateMockInterviewBody,
  CreateMockInterviewResponse,
  ListMockInterviewsResponse,
  GetMockInterviewParams,
  GetMockInterviewResponse,
  AnswerMockInterviewParams,
  AnswerMockInterviewBody,
  AnswerMockInterviewResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { generateJson, openai, CHAT_MODEL } from "../lib/openaiClient";
import { awardXp } from "../lib/profile";

const router: IRouter = Router();

const MAX_QUESTIONS = 5;

interface FinalEvaluation {
  overallScore: number;
  confidenceScore: number;
  communicationScore: number;
  technicalScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

router.get("/mock-interviews", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(mockInterviewsTable)
    .where(eq(mockInterviewsTable.userId, req.userId!))
    .orderBy(desc(mockInterviewsTable.createdAt));
  res.json(ListMockInterviewsResponse.parse(rows));
});

router.post("/mock-interviews", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateMockInterviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  req.log.info("Starting AI mock interview");
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          `You are conducting a ${parsed.data.interviewType} interview for a ${parsed.data.experienceLevel} ` +
          `${parsed.data.jobRole} candidate. Ask exactly one thoughtful interview question at a time, no preamble, no numbering.`,
      },
      { role: "user", content: "Please ask the first interview question." },
    ],
  });

  const firstQuestion =
    completion.choices[0]?.message?.content ?? "Tell me about yourself.";

  const messages: InterviewMessageEntry[] = [
    { role: "interviewer", content: firstQuestion },
  ];

  const [row] = await db
    .insert(mockInterviewsTable)
    .values({
      userId: req.userId!,
      jobRole: parsed.data.jobRole,
      experienceLevel: parsed.data.experienceLevel,
      interviewType: parsed.data.interviewType,
      status: "in_progress",
      messages,
      strengths: [],
      weaknesses: [],
      suggestions: [],
    })
    .returning();

  res.status(201).json(CreateMockInterviewResponse.parse(row));
});

router.get(
  "/mock-interviews/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetMockInterviewParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .select()
      .from(mockInterviewsTable)
      .where(
        and(
          eq(mockInterviewsTable.id, params.data.id),
          eq(mockInterviewsTable.userId, req.userId!),
        ),
      );

    if (!row) {
      res.status(404).json({ error: "Mock interview not found" });
      return;
    }

    res.json(GetMockInterviewResponse.parse(row));
  },
);

router.post(
  "/mock-interviews/:id/answer",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = AnswerMockInterviewParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = AnswerMockInterviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(mockInterviewsTable)
      .where(
        and(
          eq(mockInterviewsTable.id, params.data.id),
          eq(mockInterviewsTable.userId, req.userId!),
        ),
      );

    if (!existing) {
      res.status(404).json({ error: "Mock interview not found" });
      return;
    }
    if (existing.status === "completed") {
      res.status(400).json({ error: "This interview has already finished" });
      return;
    }

    const messages: InterviewMessageEntry[] = [
      ...existing.messages,
      { role: "candidate", content: parsed.data.answer },
    ];

    const questionsAsked = messages.filter((m) => m.role === "interviewer").length;
    const shouldFinish = questionsAsked >= MAX_QUESTIONS;

    if (!shouldFinish) {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          {
            role: "system",
            content:
              `You are conducting a ${existing.interviewType} interview for a ${existing.experienceLevel} ` +
              `${existing.jobRole} candidate. Ask exactly one thoughtful follow-up interview question at a time, no preamble, no numbering.`,
          },
          ...messages.map((m) => ({
            role: (m.role === "interviewer" ? "assistant" : "user") as
              | "assistant"
              | "user",
            content: m.content,
          })),
        ],
      });

      const nextQuestion =
        completion.choices[0]?.message?.content ?? "Can you elaborate further?";
      messages.push({ role: "interviewer", content: nextQuestion });

      const [row] = await db
        .update(mockInterviewsTable)
        .set({ messages })
        .where(eq(mockInterviewsTable.id, params.data.id))
        .returning();

      res.json(AnswerMockInterviewResponse.parse(row));
      return;
    }

    const transcript = messages
      .map((m) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n");

    const evaluation = await generateJson<FinalEvaluation>({
      system:
        "You are an expert interview coach evaluating a completed mock interview transcript. " +
        "Return a JSON object with exactly these keys: " +
        "overallScore, confidenceScore, communicationScore, technicalScore (all integers 0-100), " +
        "strengths (array of strings), weaknesses (array of strings), suggestions (array of strings, actionable). " +
        "Return ONLY valid JSON.",
      user: `Interview for ${existing.jobRole} (${existing.experienceLevel}, ${existing.interviewType}):\n\n${transcript}`,
    });

    const [row] = await db
      .update(mockInterviewsTable)
      .set({
        messages,
        status: "completed",
        overallScore: evaluation.overallScore,
        confidenceScore: evaluation.confidenceScore,
        communicationScore: evaluation.communicationScore,
        technicalScore: evaluation.technicalScore,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        suggestions: evaluation.suggestions,
      })
      .where(eq(mockInterviewsTable.id, params.data.id))
      .returning();

    await awardXp(req.userId!, 40);

    res.json(AnswerMockInterviewResponse.parse(row));
  },
);

export default router;
