import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillGapsTable = pgTable("skill_gaps", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  targetRole: text("target_role").notNull(),
  currentSkills: jsonb("current_skills").$type<string[]>().notNull(),
  requiredSkills: jsonb("required_skills").$type<string[]>().notNull(),
  missingSkills: jsonb("missing_skills").$type<string[]>().notNull(),
  prioritySkills: jsonb("priority_skills").$type<string[]>().notNull(),
  recommendations: jsonb("recommendations").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSkillGapSchema = createInsertSchema(skillGapsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSkillGap = z.infer<typeof insertSkillGapSchema>;
export type SkillGap = typeof skillGapsTable.$inferSelect;
