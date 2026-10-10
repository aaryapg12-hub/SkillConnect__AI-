import { Router, type IRouter } from "express";
import { eq, desc, and, asc } from "drizzle-orm";
import { db, coachConversationsTable, coachMessagesTable } from "@workspace/db";
import {
  ListCoachConversationsResponse,
  CreateCoachConversationBody,
  CreateCoachConversationResponse,
  GetCoachConversationParams,
  GetCoachConversationResponse,
  DeleteCoachConversationParams,
  SendCoachMessageParams,
  SendCoachMessageBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { openai, CHAT_MODEL } from "../lib/openaiClient";
import { awardXp } from "../lib/profile";

const router: IRouter = Router();

router.get("/coach/conversations", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(coachConversationsTable)
    .where(eq(coachConversationsTable.userId, req.userId!))
    .orderBy(desc(coachConversationsTable.createdAt));
  res.json(ListCoachConversationsResponse.parse(rows));
});

router.post(
  "/coach/conversations",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateCoachConversationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [row] = await db
      .insert(coachConversationsTable)
      .values({ userId: req.userId!, title: parsed.data.title })
      .returning();

    res.status(201).json(CreateCoachConversationResponse.parse(row));
  },
);

router.get(
  "/coach/conversations/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetCoachConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [conversation] = await db
      .select()
      .from(coachConversationsTable)
      .where(
        and(
          eq(coachConversationsTable.id, params.data.id),
          eq(coachConversationsTable.userId, req.userId!),
        ),
      );

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = await db
      .select()
      .from(coachMessagesTable)
      .where(eq(coachMessagesTable.conversationId, conversation.id))
      .orderBy(asc(coachMessagesTable.createdAt));

    res.json(GetCoachConversationResponse.parse({ ...conversation, messages }));
  },
);

router.delete(
  "/coach/conversations/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteCoachConversationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .delete(coachConversationsTable)
      .where(
        and(
          eq(coachConversationsTable.id, params.data.id),
          eq(coachConversationsTable.userId, req.userId!),
        ),
      )
      .returning();

    if (!row) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db
      .delete(coachMessagesTable)
      .where(eq(coachMessagesTable.conversationId, params.data.id));

    res.sendStatus(204);
  },
);

router.post(
  "/coach/conversations/:id/messages",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = SendCoachMessageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = SendCoachMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [conversation] = await db
      .select()
      .from(coachConversationsTable)
      .where(
        and(
          eq(coachConversationsTable.id, params.data.id),
          eq(coachConversationsTable.userId, req.userId!),
        ),
      );

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const history = await db
      .select()
      .from(coachMessagesTable)
      .where(eq(coachMessagesTable.conversationId, conversation.id))
      .orderBy(asc(coachMessagesTable.createdAt));

    await db.insert(coachMessagesTable).values({
      conversationId: conversation.id,
      role: "user",
      content: parsed.data.content,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: CHAT_MODEL,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are SkillConnect AI's career coach - warm, encouraging, and specific. " +
            "Give practical career advice, resume tips, interview strategies, and skill-building guidance. " +
            "Keep responses concise and actionable.",
        },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: parsed.data.content },
      ],
    });

    let fullContent = "";
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        }
      }
    } catch (err) {
      req.log.error({ err }, "Coach stream error");
    }

    await db.insert(coachMessagesTable).values({
      conversationId: conversation.id,
      role: "assistant",
      content: fullContent,
    });

    await awardXp(req.userId!, 5);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  },
);

export default router;
