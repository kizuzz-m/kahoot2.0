"use client";

import { useEffect, useState } from "react";
import { QuizEditor } from "@/components/editor/QuizEditor";
import { takeDraft } from "@/lib/client-api";
import type { QuizInput } from "@/lib/types";

export default function CreatePage() {
  // Ein Entwurf kann z. B. vom Import übergeben werden („Im Editor öffnen“).
  const [draft, setDraft] = useState<QuizInput | null | undefined>(undefined);
  useEffect(() => setDraft(takeDraft()), []);
  if (draft === undefined) return null;
  return <QuizEditor initial={draft ?? undefined} />;
}
