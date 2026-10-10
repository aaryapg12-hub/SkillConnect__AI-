import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface RoadmapStepEntry {
  order: number;
  title: string;
  description: string;
  resources: string[];
  completed: boolean;
}

export const roadmapsTable = pgTable("roadmaps", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  targetRole: text("target_role").notNull(),
  steps: jsonb("steps").$type<RoadmapStepEntry[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoadmapSchema = createInsertSchema(roadmapsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRoadmap = z.infer<typeof insertRoadmapSchema>;
export type Roadmap = typeof roadmapsTable.$inferSelect;
