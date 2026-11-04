import type { QuizInput } from "../types";

/**
 * Import-Schnittstelle von Quizwerk.
 *
 * Drei Bausteine lassen sich unabhängig erweitern (Registrierung in ./registry.ts):
 *  1. QuizImporter     – wandelt Datei-/Textinhalte (JSON, CSV, …) in Quizze um
 *  2. RemoteSource     – lädt Quizze über eine OFFIZIELLE, frei nutzbare API
 *  3. PlatformNotice   – erkennt Links externer Plattformen ohne offizielle Import-API
 *                        und erklärt dem Nutzer den manuellen Weg (Export → JSON/CSV)
 */

export interface ImportedQuiz {
  quiz: QuizInput;
  /** Hinweise, die den Import nicht verhindern (z. B. gekürzte Antworten) */
  warnings: string[];
  /** Validierungsfehler – das Quiz muss vor dem Speichern korrigiert werden */
  errors: string[];
}

export interface ImportResult {
  source: string;
  quizzes: ImportedQuiz[];
}

export interface ImportInput {
  content: string;
  fileName?: string;
}

export interface QuizImporter {
  id: string;
  label: string;
  description: string;
  /** Dateiendungen inkl. Punkt, z. B. [".json"] */
  extensions: string[];
  /** Optionale Inhaltserkennung für eingefügten Text */
  sniff?(content: string): boolean;
  parse(input: ImportInput): Promise<ImportResult> | ImportResult;
}

export interface RemoteSourceOption {
  id: string;
  label: string;
  type: "number" | "select";
  default: string;
  min?: number;
  max?: number;
  choices?: { value: string; label: string }[];
  /** Auswahl dynamisch laden (z. B. Kategorien einer API) */
  loadChoices?: () => Promise<{ value: string; label: string }[]>;
}

export interface RemoteSource {
  id: string;
  label: string;
  description: string;
  /** Lizenz-/Attributionshinweis, der im UI angezeigt und in die Quizbeschreibung übernommen wird */
  license: string;
  homepage: string;
  options: RemoteSourceOption[];
  fetchQuiz(options: Record<string, string>): Promise<ImportResult>;
}

export interface PlatformNotice {
  id: string;
  name: string;
  hostPatterns: RegExp[];
  /** Klar formulierte Erklärung, warum kein direkter Import möglich ist */
  message: string;
  /** Konkrete Schritte für den manuellen Weg */
  steps: string[];
}

export class ImportError extends Error {}
