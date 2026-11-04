import type { Quiz } from "./types";

/** Exportiert ein Quiz im dokumentierten Quizwerk-Format (docs/FORMAT.md). */
export function toQuizwerkJson(quiz: Pick<Quiz, "title" | "description" | "questions">) {
  return {
    format: "quizwerk",
    version: 1,
    title: quiz.title,
    ...(quiz.description ? { description: quiz.description } : {}),
    questions: quiz.questions.map((q) => ({
      question: q.text,
      ...(q.image ? { image: q.image } : {}),
      answers: q.answers.map((a) => ({ text: a.text, correct: a.correct })),
      timeLimit: q.timeLimit,
      points: q.points,
      ...(q.explanation ? { explanation: q.explanation } : {}),
    })),
  };
}
