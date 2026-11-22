import { z } from "zod";
import { getQuizResult } from "./love-quiz.ts";

export const QUIZ_CONSENT_VERSION = "quiz-2026-11-22-v1";
export const quizSubmissionSchema = z.object({
  request_id: z.string().uuid(),
  first_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  answers: z.array(z.number().int().min(0).max(2)).length(5),
  preinscribe: z.boolean(),
  consent: z.literal(true),
  adult: z.literal(true),
  consent_version: z.literal(QUIZ_CONSENT_VERSION),
  website: z.string().max(0).default(""),
}).strict().refine(v => getQuizResult(v.answers) !== null);

export type QuizSubmission = z.infer<typeof quizSubmissionSchema>;
