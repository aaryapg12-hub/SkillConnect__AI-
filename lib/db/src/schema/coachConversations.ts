import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coachConversationsTable = pgTable("coach_conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCoachConversationSchema = createInsertSchema(
  coachConversationsTable,
).omit({ id: true, createdAt: true });
export type InsertCoachConversation = z.infer<
  typeof insertCoachConversationSchema
>;
export type CoachConversation = typeof coachConversationsTable.$inferSelect;

export const coachMessagesTable = pgTable("coach_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCoachMessageSchema = createInsertSchema(
  coachMessagesTable,
).omit({ id: true, createdAt: true });
export type InsertCoachMessage = z.infer<typeof insertCoachMessageSchema>;
export type CoachMessage = typeof coachMessagesTable.$inferSelect;
