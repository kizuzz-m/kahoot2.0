import type { PlatformNotice } from "../types";

/**
 * Bekannte Quiz-Plattformen ohne offizielle, öffentlich nutzbare Import-API.
 * Quizwerk lädt von dort bewusst KEINE Inhalte (kein Scraping, keine Umgehung von Schutzmaßnahmen).
 * Stattdessen erklärt die App den manuellen Weg über Export bzw. JSON/CSV.
 *
 * Bietet eine Plattform später eine offizielle API an, kann hier ein RemoteSource
 * (siehe ./opentdb.ts) ergänzt und der Eintrag entfernt werden.
 */
const GENERIC_STEPS = [
  "Öffne dein Quiz auf der Plattform und prüfe, ob es eine Export-Funktion gibt (z. B. als Tabelle/Excel).",
  "Übertrage die Fragen in die Quizwerk-CSV-Vorlage oder in das JSON-Format.",
  "Lade die Datei hier im Tab „Datei“ hoch.",
];

export const platformNotices: PlatformNotice[] = [
  {
    id: "kahoot",
    name: "Kahoot!",
    hostPatterns: [/(^|\.)kahoot\.(it|com)$/i],
    message:
      "Für Kahoot! gibt es keine offizielle, öffentlich nutzbare Schnittstelle, über die Quizwerk Quizze importieren darf. Inhalte werden deshalb nicht automatisch geladen.",
    steps: [
      "Exportiere deine eigenen Fragen, sofern dein Konto das erlaubt, oder kopiere sie manuell.",
      ...GENERIC_STEPS.slice(1),
    ],
  },
  {
    id: "quizizz",
    name: "Wayground (ehemals Quizizz)",
    hostPatterns: [/(^|\.)quizizz\.com$/i, /(^|\.)wayground\.com$/i],
    message: "Für diese Plattform ist keine offizielle Import-API für Drittanbieter verfügbar.",
    steps: GENERIC_STEPS,
  },
  {
    id: "quizlet",
    name: "Quizlet",
    hostPatterns: [/(^|\.)quizlet\.com$/i],
    message:
      "Quizlet bietet keine öffentliche API für den Import an. Lernsets mit eigener Export-Funktion lassen sich aber als Text exportieren.",
    steps: [
      "Nutze bei deinem eigenen Lernset „Exportieren“ und kopiere den Text.",
      "Wandle die Begriffe in Fragen mit Antwortmöglichkeiten um (CSV-Vorlage).",
      "Lade die Datei hier im Tab „Datei“ hoch.",
    ],
  },
  {
    id: "mentimeter",
    name: "Mentimeter",
    hostPatterns: [/(^|\.)menti(meter)?\.com$/i],
    message: "Für Mentimeter-Präsentationen gibt es keine offizielle Import-Schnittstelle für Quizwerk.",
    steps: GENERIC_STEPS,
  },
  {
    id: "google-forms",
    name: "Google Forms",
    hostPatterns: [/(^|\.)forms\.gle$/i, /^docs\.google\.com$/i],
    message:
      "Google Forms kann nur mit deiner Anmeldung über die offizielle Google-API gelesen werden. Diese Anbindung ist in Quizwerk noch nicht eingerichtet.",
    steps: [
      "Kopiere die Fragen in eine Google-Tabelle nach dem Aufbau der CSV-Vorlage.",
      "Lade die Tabelle über „Datei → Herunterladen → CSV“ herunter.",
      "Lade die CSV hier im Tab „Datei“ hoch.",
    ],
  },
];

export const unknownPlatformNotice: PlatformNotice = {
  id: "unknown",
  name: "Externe Webseite",
  hostPatterns: [],
  message:
    "Quizwerk lädt keine Inhalte von beliebigen Webseiten, um keine Nutzungsbedingungen oder Schutzmaßnahmen zu verletzen. Unterstützt werden eigene Dateien und offizielle Schnittstellen.",
  steps: GENERIC_STEPS,
};
