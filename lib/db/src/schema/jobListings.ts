import { pgTable, serial, text, timestamp, jsonb, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobListingsTable = pgTable("job_listings", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
  salary: text("salary").notNull(),
  experienceLevel: text("experience_level").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull(),
  logoUrl: text("logo_url"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
});

export const insertJobListingSchema = createInsertSchema(jobListingsTable).omit({
  id: true,
});
export type InsertJobListing = z.infer<typeof insertJobListingSchema>;
export type JobListing = typeof jobListingsTable.$inferSelect;

export const jobBookmarksTable = pgTable(
  "job_bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    jobId: integer("job_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.jobId)],
);

export const insertJobBookmarkSchema = createInsertSchema(jobBookmarksTable).omit(
  { id: true, createdAt: true },
);
export type InsertJobBookmark = z.infer<typeof insertJobBookmarkSchema>;
export type JobBookmark = typeof jobBookmarksTable.$inferSelect;
