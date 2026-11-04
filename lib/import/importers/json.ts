import { normalizeQuiz, titleFromFileName } from "../normalize";
import { ImportError, type QuizImporter } from "../types";

/**
 * JSON-Import. Unterstützt:
 *  - das einfache Format  { "title": "...", "questions": [...] }
 *  - das Quizwerk-Format  { "format": "quizwerk", "version": 1, ... }   (siehe docs/FORMAT.md)
 *  - mehrere Quizze       { "format": "quizwerk", "version": 1, "quizzes": [ {...}, {...} ] }
 *  - eine reine Fragenliste [ {...}, {...} ]
 */
export const jsonImporter: QuizImporter = {
  id: "json",
  label: "JSON",
  description: "Quizwerk-Format oder einfaches JSON mit title und questions",
  extensions: [".json"],
  sniff: (content) => /^\s*[[{]/.test(content),
  parse({ content, fileName }) {
    let data: unknown;
    try {
      data = JSON.parse(content.replace(/^﻿/, ""));
    } catch (err) {
      throw new ImportError(`Die Datei ist kein gültiges JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
    const fallback = titleFromFileName(fileName);

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      if (obj.format !== undefined && obj.format !== "quizwerk") {
        throw new ImportError(`Unbekanntes Format „${String(obj.format)}“. Erwartet wird "format": "quizwerk".`);
      }
      if (typeof obj.version === "number" && obj.version > 1) {
        throw new ImportError(`Version ${obj.version} des Quizwerk-Formats wird noch nicht unterstützt.`);
      }
      if (Array.isArray(obj.quizzes)) {
        return { source: "JSON", quizzes: obj.quizzes.map((q, i) => normalizeQuiz(q, `${fallback} ${i + 1}`)) };
      }
    }
    const single = normalizeQuiz(data, fallback);
    if (!single.quiz.questions.length) {
      throw new ImportError('Keine Fragen gefunden. Erwartet wird ein Feld "questions" mit einer Liste von Fragen.');
    }
    return { source: "JSON", quizzes: [single] };
  },
};
