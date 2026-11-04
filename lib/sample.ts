import type { QuizInput } from "./types";
import { uid } from "./utils";

const a = (text: string, correct = false) => ({ id: uid(), text, correct });

/** Beispielquiz für den ersten Start. */
export function sampleQuiz(): QuizInput {
  return {
    title: "Rund um die Schweiz",
    description: "Ein kurzes Beispielquiz zum Ausprobieren – mit Einzel- und Mehrfachauswahl.",
    questions: [
      {
        id: uid(),
        text: "Was ist die Hauptstadt der Schweiz?",
        answers: [a("Zürich"), a("Bern", true), a("Genf"), a("Basel")],
        timeLimit: 20,
        points: 1000,
        explanation: "Bern ist offiziell „Bundesstadt“ – die Schweiz hat keine Hauptstadt im rechtlichen Sinn.",
      },
      {
        id: uid(),
        text: "Welche dieser Sprachen sind Landessprachen der Schweiz?",
        answers: [a("Deutsch", true), a("Französisch", true), a("Englisch"), a("Rätoromanisch", true)],
        timeLimit: 30,
        points: 1000,
        explanation: "Die vier Landessprachen sind Deutsch, Französisch, Italienisch und Rätoromanisch.",
      },
      {
        id: uid(),
        text: "Wie viele Kantone hat die Schweiz?",
        answers: [a("20"), a("23"), a("26", true), a("28")],
        timeLimit: 15,
        points: 1000,
      },
      {
        id: uid(),
        text: "Welcher Berg ist der höchste der Schweiz?",
        answers: [a("Matterhorn"), a("Dufourspitze", true), a("Eiger"), a("Jungfrau"), a("Piz Bernina")],
        timeLimit: 20,
        points: 2000,
        explanation: "Die Dufourspitze im Monte-Rosa-Massiv ist 4634 m hoch.",
      },
      {
        id: uid(),
        text: "Der Rhein entspringt in der Schweiz.",
        answers: [a("Richtig", true), a("Falsch")],
        timeLimit: 10,
        points: 500,
        explanation: "Vorder- und Hinterrhein entspringen im Kanton Graubünden.",
      },
    ],
  };
}
