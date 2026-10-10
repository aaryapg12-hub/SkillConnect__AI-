import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface InterviewMessageEntry {
  role: "interviewer" | "candidate";
  content: string;
}

export const mockInterviewsTable = pgTable("mock_interviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobRole: text("job_role").notNull(),
  experienceLevel: text("experience_level").notNull(),
  interviewType: text("interview_type").notNull(),
  status: text("status").notNull().default("in_progress"),
  messages: jsonb("messages").$type<InterviewMessageEntry[]>().notNull(),
  overallScore: integer("overall_score"),
  confidenceScore: integer("confidence_score"),
  communicationScore: integer("communication_score"),
  technicalScore: integer("technical_score"),
  strengths: jsonb("strengths").$type<string[]>().notNull().default([]),
  weaknesses: jsonb("weaknesses").$type<string[]>().notNull().default([]),
  suggestions: jsonb("suggestions").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMockInterviewSchema = createInsertSchema(
  mockInterviewsTable,
).omit({ id: true, createdAt: true });
export type InsertMockInterview = z.infer<typeof insertMockInterviewSchema>;
export type MockInterview = typeof mockInterviewsTable.$inferSelect;
