import { csvImporter } from "./importers/csv";
import { jsonImporter } from "./importers/json";
import { openTriviaSource } from "./sources/opentdb";
import { platformNotices, unknownPlatformNotice } from "./sources/platforms";
import { ImportError, type ImportInput, type ImportResult, type PlatformNotice, type QuizImporter, type RemoteSource } from "./types";

/**
 * Zentrale Registrierung aller Import-Wege.
 * Neues Format?   → QuizImporter schreiben und in `fileImporters` eintragen.
 * Offizielle API? → RemoteSource schreiben und in `remoteSources` eintragen.
 */
export const fileImporters: QuizImporter[] = [jsonImporter, csvImporter];
export const remoteSources: RemoteSource[] = [openTriviaSource];
export { platformNotices };

export function acceptedExtensions(): string {
  return fileImporters.flatMap((i) => i.extensions).join(",");
}

export function findImporter(input: ImportInput): QuizImporter | null {
  const name = input.fileName?.toLowerCase() ?? "";
  const byExt = fileImporters.find((i) => i.extensions.some((ext) => name.endsWith(ext)));
  if (byExt && (byExt.id !== "csv" || !jsonImporter.sniff?.(input.content))) return byExt;
  return fileImporters.find((i) => i.sniff?.(input.content)) ?? byExt ?? null;
}

export async function importContent(input: ImportInput): Promise<ImportResult> {
  const importer = findImporter(input);
  if (!importer) {
    throw new ImportError("Format nicht erkannt. Unterstützt werden JSON (.json) und CSV (.csv).");
  }
  return importer.parse(input);
}

/** Prüft einen eingefügten Link und liefert den passenden Hinweis. */
export function checkExternalUrl(raw: string): PlatformNotice | null {
  let url: URL;
  try {
    url = new URL(raw.trim().startsWith("http") ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return null;
  }
  return platformNotices.find((p) => p.hostPatterns.some((re) => re.test(url.hostname))) ?? unknownPlatformNotice;
}
