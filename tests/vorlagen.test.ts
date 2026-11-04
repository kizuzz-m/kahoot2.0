import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BEISPIEL_JSON, VORLAGE_CSV } from "../lib/vorlagen";

const read = (file: string) => readFileSync(new URL(`../public/vorlagen/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("Vorlagen in lib/vorlagen.ts entsprechen den Download-Dateien", () => {
  assert.equal(BEISPIEL_JSON, read("quizwerk-beispiel.json"));
  assert.equal(VORLAGE_CSV, read("quizwerk-vorlage.csv"));
});
