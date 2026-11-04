import Papa from "papaparse";
import { normalizeQuiz, titleFromFileName } from "../normalize";
import { ImportError, type QuizImporter } from "../types";

/**
 * CSV-Import (Trennzeichen , ; oder Tab werden automatisch erkannt – Excel-Exporte funktionieren).
 *
 * Spalten (Groß-/Kleinschreibung egal, deutsch oder englisch):
 *   frage | question            – Pflicht
 *   antwort1 … antwort6 | answer1 … answer6
 *   richtig | correct           – z. B. "2", "1|3", "B" oder der Antworttext
 *   zeit | timeLimit            – Sekunden (Standard 20)
 *   punkte | points             – Standard 1000
 *   bild | image                – optionale Bild-URL
 *   erklaerung | explanation    – optional
 *   titel | title               – optional, erster Wert wird als Quiztitel verwendet
 */

const ALIASES: Record<string, string> = {
  frage: "question",
  question: "question",
  text: "question",
  richtig: "correct",
  correct: "correct",
  korrekt: "correct",
  zeit: "timeLimit",
  timelimit: "timeLimit",
  time: "timeLimit",
  zeitlimit: "timeLimit",
  punkte: "points",
  points: "points",
  bild: "image",
  image: "image",
  imageurl: "image",
  erklaerung: "explanation",
  erklärung: "explanation",
  explanation: "explanation",
  titel: "title",
  title: "title",
};

function canonical(header: string): string {
  const h = header.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const answer = h.match(/^(antwort|answer|option)(\d)$/);
  if (answer) return `answer${answer[2]}`;
  return ALIASES[h] ?? h;
}

export const csvImporter: QuizImporter = {
  id: "csv",
  label: "CSV",
  description: "Tabelle mit einer Frage pro Zeile (Excel, Numbers, Google Sheets)",
  extensions: [".csv", ".tsv", ".txt"],
  sniff: (content) => /^\s*﻿?"?(frage|question)/i.test(content),
  parse({ content, fileName }) {
    const parsed = Papa.parse<Record<string, string>>(content.replace(/^﻿/, ""), {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: canonical,
    });
    const rows = parsed.data;
    const fields = parsed.meta.fields ?? [];
    if (!fields.includes("question")) {
      throw new ImportError('Spalte „frage“ bzw. „question“ fehlt. Bitte nutze die CSV-Vorlage als Ausgangspunkt.');
    }
    if (!rows.length) throw new ImportError("Die CSV-Datei enthält keine Fragen.");

    const title = rows.find((r) => r.title?.trim())?.title?.trim() || titleFromFileName(fileName);
    const answerCols = fields.filter((f) => /^answer\d$/.test(f)).sort();

    const questions = rows.map((r) => ({
      question: r.question,
      answers: answerCols.map((c) => r[c] ?? "").filter((t) => t.trim() !== ""),
      correct: r.correct,
      timeLimit: r.timeLimit,
      points: r.points,
      image: r.image,
      explanation: r.explanation,
    }));

    // Antworten sind hier Strings; "correct" wird als 1-basierter Index/Buchstabe/Text interpretiert.
    const result = normalizeQuiz({ title, questions }, title);
    if (parsed.errors.length) {
      result.warnings.unshift(...parsed.errors.slice(0, 5).map((e) => `CSV Zeile ${(e.row ?? 0) + 2}: ${e.message}`));
    }
    return { source: "CSV", quizzes: [result] };
  },
};
