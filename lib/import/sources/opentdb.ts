import { uid } from "../../utils";
import { finalizeQuiz } from "../normalize";
import { ImportError, type RemoteSource } from "../types";

/**
 * Open Trivia Database – offizielle, frei nutzbare API (https://opentdb.com/api_config.php).
 * Inhalte stehen unter CC BY-SA 4.0; die Attribution wird in die Quizbeschreibung übernommen.
 * Die Fragen sind auf Englisch.
 */

interface OtdbQuestion {
  type: "multiple" | "boolean";
  difficulty: string;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

const LICENSE = "Fragen von Open Trivia Database (opentdb.com), lizenziert unter CC BY-SA 4.0.";

const dec = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ERRORS: Record<number, string> = {
  1: "Für diese Auswahl gibt es nicht genug Fragen. Wähle weniger Fragen oder eine andere Kategorie.",
  2: "Ungültige Parameter für Open Trivia DB.",
  5: "Zu viele Anfragen – Open Trivia DB erlaubt eine Anfrage alle 5 Sekunden. Bitte kurz warten.",
};

export const openTriviaSource: RemoteSource = {
  id: "opentdb",
  label: "Open Trivia Database",
  description: "Öffentliche Fragen-Datenbank mit offizieller API (Fragen auf Englisch).",
  license: LICENSE,
  homepage: "https://opentdb.com",
  options: [
    { id: "amount", label: "Anzahl Fragen", type: "number", default: "10", min: 1, max: 50 },
    {
      id: "category",
      label: "Kategorie",
      type: "select",
      default: "",
      choices: [{ value: "", label: "Alle Kategorien" }],
      loadChoices: async () => {
        const res = await fetch("https://opentdb.com/api_category.php");
        if (!res.ok) throw new Error("Kategorien konnten nicht geladen werden");
        const data = (await res.json()) as { trivia_categories: { id: number; name: string }[] };
        return [
          { value: "", label: "Alle Kategorien" },
          ...data.trivia_categories.map((c) => ({ value: String(c.id), label: c.name })),
        ];
      },
    },
    {
      id: "difficulty",
      label: "Schwierigkeit",
      type: "select",
      default: "",
      choices: [
        { value: "", label: "Gemischt" },
        { value: "easy", label: "Leicht" },
        { value: "medium", label: "Mittel" },
        { value: "hard", label: "Schwer" },
      ],
    },
  ],
  async fetchQuiz(opts) {
    const params = new URLSearchParams({ amount: opts.amount || "10", encode: "url3986" });
    if (opts.category) params.set("category", opts.category);
    if (opts.difficulty) params.set("difficulty", opts.difficulty);
    let res: Response;
    try {
      res = await fetch(`https://opentdb.com/api.php?${params}`);
    } catch {
      throw new ImportError("Open Trivia DB ist nicht erreichbar. Prüfe deine Internetverbindung.");
    }
    if (!res.ok) throw new ImportError(`Open Trivia DB antwortet mit Status ${res.status}.`);
    const data = (await res.json()) as { response_code: number; results: OtdbQuestion[] };
    if (data.response_code !== 0) throw new ImportError(ERRORS[data.response_code] ?? `Fehlercode ${data.response_code}`);

    const questions = data.results.map((r) => {
      const answers = shuffle([
        { id: uid(), text: dec(r.correct_answer), correct: true },
        ...r.incorrect_answers.map((t) => ({ id: uid(), text: dec(t), correct: false })),
      ]);
      // Wahr/Falsch immer in fester Reihenfolge
      if (r.type === "boolean") answers.sort((a, b) => (a.text === "True" ? -1 : b.text === "True" ? 1 : 0));
      return {
        id: uid(),
        text: dec(r.question),
        answers,
        timeLimit: r.difficulty === "hard" ? 30 : 20,
        points: 1000,
        explanation: `Kategorie: ${dec(r.category)}`,
      };
    });
    const firstCat = data.results[0] ? dec(data.results[0].category) : "Trivia";
    const title = opts.category ? `Trivia: ${firstCat}` : "Trivia-Mix";
    return {
      source: "Open Trivia DB",
      quizzes: [finalizeQuiz({ title, description: LICENSE, questions }, [])],
    };
  },
};
