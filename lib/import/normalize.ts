import { formatIssues, quizInputSchema } from "../schema";
import { LIMITS, type Answer, type Question, type QuizInput } from "../types";
import { uid } from "../utils";
import type { ImportedQuiz } from "./types";

/**
 * Wandelt „lockere“ Quizdaten in das interne Format um.
 * Akzeptiert das dokumentierte Quizwerk-Format sowie gängige Varianten
 * (z. B. `text` statt `question`, `options` statt `answers`, `correct` als Index).
 */

type Loose = Record<string, unknown>;

const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : undefined;
const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const pick = (o: Loose, ...keys: string[]) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
};
const truthy = (v: unknown) => v === true || v === 1 || (typeof v === "string" && /^(true|ja|yes|x|1|richtig|wahr)$/i.test(v.trim()));

export const DEFAULT_TIME = 20;
export const DEFAULT_POINTS = 1000;

export function clampTime(raw: number | undefined, warn: (m: string) => void, label: string): number {
  if (raw === undefined) return DEFAULT_TIME;
  let t = raw;
  if (t > 1000) t = t / 1000; // vermutlich Millisekunden
  t = Math.round(t);
  if (t < LIMITS.minTime || t > LIMITS.maxTime) {
    const c = Math.min(LIMITS.maxTime, Math.max(LIMITS.minTime, t));
    warn(`${label}: Zeitlimit ${raw} auf ${c} s angepasst`);
    return c;
  }
  return t;
}

export function clampPoints(raw: number | undefined, warn: (m: string) => void, label: string): number {
  if (raw === undefined) return DEFAULT_POINTS;
  const p = Math.round(raw);
  if (p < 0 || p > LIMITS.maxPoints) {
    const c = Math.min(LIMITS.maxPoints, Math.max(0, p));
    warn(`${label}: Punkte ${raw} auf ${c} angepasst`);
    return c;
  }
  return p;
}

/** Interpretiert „richtig“-Angaben: Index (1-basiert oder 0-basiert), Buchstabe, Liste oder Text. */
function correctSetFrom(spec: unknown, answerTexts: string[], zeroBased: boolean): Set<number> {
  const out = new Set<number>();
  const items: unknown[] = Array.isArray(spec)
    ? spec
    : typeof spec === "string"
      ? spec.split(/[|,;/+\s]+/).filter(Boolean)
      : [spec];
  for (const item of items) {
    if (typeof item === "number") {
      out.add(zeroBased ? item : item - 1);
      continue;
    }
    const s = String(item).trim();
    if (/^[A-Fa-f]$/.test(s)) out.add(s.toUpperCase().charCodeAt(0) - 65);
    else if (/^\d+$/.test(s)) out.add(zeroBased ? Number(s) : Number(s) - 1);
    else {
      const idx = answerTexts.findIndex((t) => t.toLowerCase() === s.toLowerCase());
      if (idx >= 0) out.add(idx);
    }
  }
  return out;
}

function normalizeQuestion(raw: unknown, index: number, warnings: string[]): Question {
  const label = `Frage ${index + 1}`;
  const warn = (m: string) => warnings.push(m);
  const q = isObj(raw) ? raw : {};
  const text = str(pick(q, "question", "text", "title", "frage", "prompt")) ?? "";

  const rawAnswers = pick(q, "answers", "options", "choices", "antworten");
  let answers: Answer[] = [];
  if (Array.isArray(rawAnswers)) {
    answers = rawAnswers.map((a) => {
      if (isObj(a)) {
        return {
          id: uid(),
          text: str(pick(a, "text", "answer", "label", "antwort")) ?? "",
          correct: truthy(pick(a, "correct", "isCorrect", "richtig")),
        };
      }
      return { id: uid(), text: str(a) ?? "", correct: false };
    });
  }

  // Richtige Antworten auf Fragenebene (z. B. "correct": 1 oder "correctAnswers": [0, 2])
  const questionLevel = pick(q, "correctAnswers", "correctIndex", "correct", "richtig");
  if (questionLevel !== undefined && !answers.some((a) => a.correct)) {
    const zeroBased = "correctIndex" in q || "correctAnswers" in q;
    const set = correctSetFrom(questionLevel, answers.map((a) => a.text), zeroBased);
    answers = answers.map((a, i) => ({ ...a, correct: set.has(i) }));
  }

  const emptyCount = answers.filter((a) => !a.text).length;
  if (emptyCount) {
    answers = answers.filter((a) => a.text);
    warn(`${label}: ${emptyCount} leere Antwort(en) entfernt`);
  }
  if (answers.length > LIMITS.maxAnswers) {
    warn(`${label}: Nur die ersten ${LIMITS.maxAnswers} von ${answers.length} Antworten übernommen`);
    answers = answers.slice(0, LIMITS.maxAnswers);
  }

  const image = str(pick(q, "image", "imageUrl", "bild"));
  const explanation = str(pick(q, "explanation", "erklaerung", "erklärung", "hint"));

  return {
    id: uid(),
    text,
    image: image || undefined,
    answers,
    timeLimit: clampTime(num(pick(q, "timeLimit", "time", "duration", "zeit")), warn, label),
    points: clampPoints(num(pick(q, "points", "punkte", "score")), warn, label),
    explanation: explanation || undefined,
  };
}

export function finalizeQuiz(quiz: QuizInput, warnings: string[]): ImportedQuiz {
  const result = quizInputSchema.safeParse(quiz);
  return { quiz, warnings, errors: result.success ? [] : formatIssues(result.error) };
}

export function normalizeQuiz(raw: unknown, fallbackTitle: string): ImportedQuiz {
  const warnings: string[] = [];
  const o = isObj(raw) ? raw : Array.isArray(raw) ? { questions: raw } : {};
  const title = str(pick(o, "title", "name", "titel")) || fallbackTitle;
  const description = str(pick(o, "description", "beschreibung"));
  const rawQuestions = pick(o, "questions", "fragen", "items");
  const list = Array.isArray(rawQuestions) ? rawQuestions : [];
  if (list.length > LIMITS.maxQuestions) warnings.push(`Nur die ersten ${LIMITS.maxQuestions} Fragen übernommen`);
  const questions = list.slice(0, LIMITS.maxQuestions).map((q, i) => normalizeQuestion(q, i, warnings));
  return finalizeQuiz({ title: title.slice(0, 120), description: description || undefined, questions }, warnings);
}

export function titleFromFileName(name?: string): string {
  if (!name) return "Importiertes Quiz";
  return name.replace(/\.(quizwerk\.)?(json|csv|txt)$/i, "").replace(/[_-]+/g, " ").trim() || "Importiertes Quiz";
}
