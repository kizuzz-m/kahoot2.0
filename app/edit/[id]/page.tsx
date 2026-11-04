"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QuizEditor } from "@/components/editor/QuizEditor";
import { LinkButton } from "@/components/ui/Button";
import { api } from "@/lib/client-api";
import type { Quiz } from "@/lib/types";

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getQuiz(id).then(setQuiz, (err: Error) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-display text-3xl font-bold">Quiz nicht gefunden</p>
          <p className="mt-2 text-muted">{error}</p>
          <LinkButton href="/" className="mt-6">
            Zur Startseite
          </LinkButton>
        </div>
      </main>
    );
  }
  if (!quiz) return <main className="grid min-h-dvh place-items-center text-muted">Lade Quiz …</main>;
  return <QuizEditor quizId={quiz.id} initial={{ title: quiz.title, description: quiz.description, questions: quiz.questions }} />;
}
