import { z } from "zod";
import { LIMITS } from "./types";

/** Validierung für Quizze – wird in API-Routen, Editor und Import genutzt. */

export const answerSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, "Antworttext fehlt").max(200, "Antwort ist zu lang (max. 200 Zeichen)"),
  correct: z.boolean(),
});

export const questionSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().trim().min(1, "Fragetext fehlt").max(500, "Frage ist zu lang (max. 500 Zeichen)"),
    image: z
      .string()
      .max(2_000_000, "Bild ist zu groß")
      .refine((v) => /^(https?:\/\/|data:image\/)/i.test(v), "Bild muss eine http(s)-URL oder ein hochgeladenes Bild sein")
      .optional(),
    answers: z
      .array(answerSchema)
      .min(LIMITS.minAnswers, `Mindestens ${LIMITS.minAnswers} Antworten`)
      .max(LIMITS.maxAnswers, `Höchstens ${LIMITS.maxAnswers} Antworten`),
    timeLimit: z.number().int().min(LIMITS.minTime).max(LIMITS.maxTime),
    points: z.number().int().min(0).max(LIMITS.maxPoints),
    explanation: z.string().max(1000).optional(),
  })
  .refine((q) => q.answers.some((a) => a.correct), {
    message: "Mindestens eine Antwort muss richtig sein",
    path: ["answers"],
  });

export const quizInputSchema = z.object({
  title: z.string().trim().min(1, "Titel fehlt").max(120),
  description: z.string().max(500).optional(),
  questions: z
    .array(questionSchema)
    .min(1, "Das Quiz braucht mindestens eine Frage")
    .max(LIMITS.maxQuestions),
});

/** Liefert lesbare Fehlermeldungen, z. B. „Frage 2 · Antworten: Mindestens eine Antwort muss richtig sein“. */
export function formatIssues(error: z.ZodError): string[] {
  const labels: Record<string, string> = {
    title: "Titel",
    text: "Text",
    answers: "Antworten",
    timeLimit: "Zeitlimit",
    points: "Punkte",
    image: "Bild",
    explanation: "Erklärung",
  };
  return error.issues.map((issue) => {
    const parts: string[] = [];
    const path = issue.path;
    for (let i = 0; i < path.length; i++) {
      const seg = path[i];
      if (seg === "questions" && typeof path[i + 1] === "number") {
        parts.push(`Frage ${(path[i + 1] as number) + 1}`);
        i++;
      } else if (seg === "answers" && typeof path[i + 1] === "number") {
        parts.push(`Antwort ${(path[i + 1] as number) + 1}`);
        i++;
      } else if (typeof seg === "string" && labels[seg]) {
        parts.push(labels[seg]);
      }
    }
    return parts.length ? `${parts.join(" · ")}: ${issue.message}` : issue.message;
  });
}
