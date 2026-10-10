import { db, jobListingsTable } from "@workspace/db";
import { logger } from "./logger";

const SEED_JOBS = [
  {
    company: "Nimbus Data",
    role: "Junior Data Analyst",
    location: "Remote",
    salary: "$65,000 - $80,000",
    experienceLevel: "Entry-level",
    skills: ["SQL", "Python", "Excel", "Data Visualization"],
    logoUrl: null,
  },
  {
    company: "Bright Path Labs",
    role: "Frontend Engineer",
    location: "Austin, TX",
    salary: "$95,000 - $130,000",
    experienceLevel: "Mid-level",
    skills: ["React", "TypeScript", "CSS", "REST APIs"],
    logoUrl: null,
  },
  {
    company: "Vertex Cloud",
    role: "Backend Engineering Intern",
    location: "Remote",
    salary: "$25/hr",
    experienceLevel: "Internship",
    skills: ["Node.js", "PostgreSQL", "Git"],
    logoUrl: null,
  },
  {
    company: "Solace AI",
    role: "Machine Learning Engineer",
    location: "San Francisco, CA",
    salary: "$140,000 - $190,000",
    experienceLevel: "Senior",
    skills: ["Python", "PyTorch", "MLOps", "LLMs"],
    logoUrl: null,
  },
  {
    company: "Harbor Fintech",
    role: "Product Manager",
    location: "New York, NY",
    salary: "$110,000 - $150,000",
    experienceLevel: "Mid-level",
    skills: ["Product Strategy", "SQL", "Agile", "Stakeholder Management"],
    logoUrl: null,
  },
];

export async function seedJobListingsIfEmpty(): Promise<void> {
  const existing = await db.select().from(jobListingsTable).limit(1);
  if (existing.length > 0) return;

  await db.insert(jobListingsTable).values(SEED_JOBS);
  logger.info({ count: SEED_JOBS.length }, "Seeded job listings");
}
