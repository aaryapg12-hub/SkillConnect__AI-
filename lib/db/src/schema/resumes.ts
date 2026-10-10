import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  resumeText: text("resume_text").notNull(),
  atsScore: integer("ats_score").notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull(),
  weaknesses: jsonb("weaknesses").$type<string[]>().notNull(),
  missingKeywords: jsonb("missing_keywords").$type<string[]>().notNull(),
  formattingIssues: jsonb("formatting_issues").$type<string[]>().notNull(),
  grammarSuggestions: jsonb("grammar_suggestions").$type<string[]>().notNull(),
  improvementTips: jsonb("improvement_tips").$type<string[]>().notNull(),
  recommendedSkills: jsonb("recommended_skills").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;
