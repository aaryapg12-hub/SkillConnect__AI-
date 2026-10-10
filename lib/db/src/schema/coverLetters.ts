import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coverLettersTable = pgTable("cover_letters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCoverLetterSchema = createInsertSchema(coverLettersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;
export type CoverLetter = typeof coverLettersTable.$inferSelect;
