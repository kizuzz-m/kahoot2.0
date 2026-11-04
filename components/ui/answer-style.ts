/** Farben & Kennbuchstaben der Antwortoptionen (Farbe + Buchstabe → auch für Farbenblinde unterscheidbar). */
export const ANSWER_STYLES = [
  { letter: "A", bg: "bg-a1", text: "text-a1", ring: "ring-a1", hex: "#ff6b57" },
  { letter: "B", bg: "bg-a2", text: "text-a2", ring: "ring-a2", hex: "#ffb627" },
  { letter: "C", bg: "bg-a3", text: "text-a3", ring: "ring-a3", hex: "#22c993" },
  { letter: "D", bg: "bg-a4", text: "text-a4", ring: "ring-a4", hex: "#3d9bff" },
  { letter: "E", bg: "bg-a5", text: "text-a5", ring: "ring-a5", hex: "#e45fd0" },
  { letter: "F", bg: "bg-a6", text: "text-a6", ring: "ring-a6", hex: "#9bd82e" },
] as const;

export const answerStyle = (i: number) => ANSWER_STYLES[i % ANSWER_STYLES.length];
