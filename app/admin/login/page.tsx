import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/ui/Logo";
import { isAdmin, isAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin-Anmeldung · Quizwerk" };

export default async function LoginPage() {
  if (!isAuthEnabled() || (await isAdmin())) redirect("/admin");
  return (
    <main className="flex min-h-dvh flex-col items-center px-5 py-8">
      <Logo href="/admin" />
      <div className="flex w-full flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm animate-rise">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
