import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Schützt alle Admin-Seiten (Verwaltung, Editor, Import, Host-Bildschirm). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return children;
}
