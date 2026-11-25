import { z } from "zod";
import { getQuizResult } from "./love-quiz.ts";
import { DATING_QUIZ_VERSION, DATING_QUIZ_CONSENT_VERSION, validDatingAnswers } from "./dating-quiz.ts";

export const QUIZ_CONSENT_VERSION = "quiz-2026-11-22-v1";
export const LEGACY_QUIZ_VERSION = "2026-11-22-v1";
export const quizSubmissionSchema = z.object({
  request_id: z.string().uuid(),
  first_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  quiz_version: z.enum([LEGACY_QUIZ_VERSION, DATING_QUIZ_VERSION]).default(LEGACY_QUIZ_VERSION),
  answers: z.array(z.number().int().min(0).max(2)).min(5).max(6),
  preinscribe: z.boolean(),
  consent: z.literal(true),
  adult: z.literal(true),
  consent_version: z.enum([QUIZ_CONSENT_VERSION, DATING_QUIZ_CONSENT_VERSION]),
  website: z.string().max(0).default(""),
}).strict().refine(v => v.quiz_version === DATING_QUIZ_VERSION
  ? v.consent_version === DATING_QUIZ_CONSENT_VERSION && validDatingAnswers(v.answers)
  : v.consent_version === QUIZ_CONSENT_VERSION && getQuizResult(v.answers) !== null);

export type QuizSubmission = z.infer<typeof quizSubmissionSchema>;
