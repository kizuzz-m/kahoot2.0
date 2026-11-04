import { AdminShell } from "@/components/admin/AdminShell";
import { QuizLibrary } from "@/components/admin/QuizLibrary";
import { isAuthEnabled } from "@/lib/auth";

export const metadata = { title: "Quizze · Quizwerk Admin" };

export default function AdminHomePage() {
  return (
    <AdminShell authEnabled={isAuthEnabled()} title="Quizze" description="Erstelle, bearbeite und starte deine Quizze.">
      <QuizLibrary />
    </AdminShell>
  );
}
