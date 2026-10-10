import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface CareerPathEntry {
  title: string;
  description: string;
  matchScore: number;
}

export const careerRecommendationsTable = pgTable("career_recommendations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  careerPaths: jsonb("career_paths").$type<CareerPathEntry[]>().notNull(),
  salaryRange: text("salary_range").notNull(),
  certifications: jsonb("certifications").$type<string[]>().notNull(),
  trendingTechnologies: jsonb("trending_technologies").$type<string[]>().notNull(),
  learningResources: jsonb("learning_resources").$type<string[]>().notNull(),
  difficultyLevel: text("difficulty_level").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCareerRecommendationSchema = createInsertSchema(
  careerRecommendationsTable,
).omit({ id: true, createdAt: true });
export type InsertCareerRecommendation = z.infer<
  typeof insertCareerRecommendationSchema
>;
export type CareerRecommendation = typeof careerRecommendationsTable.$inferSelect;
