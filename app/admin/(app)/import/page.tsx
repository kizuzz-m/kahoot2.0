import { AdminShell } from "@/components/admin/AdminShell";
import { ImportWizard } from "@/components/import/ImportWizard";
import { isAuthEnabled } from "@/lib/auth";

export const metadata = { title: "Quiz importieren · Quizwerk Admin" };

export default function ImportPage() {
  return (
    <AdminShell
      authEnabled={isAuthEnabled()}
      title="Quiz importieren"
      description="Lade eigene Quizdateien hoch oder nutze offizielle Datenquellen. Vor dem Speichern siehst du eine Vorschau mit allen Hinweisen."
    >
      <ImportWizard />
    </AdminShell>
  );
}
