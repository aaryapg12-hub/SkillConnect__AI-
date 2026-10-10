import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import dashboardRouter from "./dashboard";
import resumesRouter from "./resumes";
import skillGapsRouter from "./skillGaps";
import careerRecommendationsRouter from "./careerRecommendations";
import roadmapsRouter from "./roadmaps";
import mockInterviewsRouter from "./mockInterviews";
import jobsRouter from "./jobs";
import coverLettersRouter from "./coverLetters";
import coachRouter from "./coach";
import progressRouter from "./progress";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(dashboardRouter);
router.use(resumesRouter);
router.use(skillGapsRouter);
router.use(careerRecommendationsRouter);
router.use(roadmapsRouter);
router.use(mockInterviewsRouter);
router.use(jobsRouter);
router.use(coverLettersRouter);
router.use(coachRouter);
router.use(progressRouter);

export default router;
