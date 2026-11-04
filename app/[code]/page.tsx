import { notFound, redirect } from "next/navigation";

/** Kurzlink: /123456 führt direkt ins Spiel (wird auch im QR-Code verwendet). */
export default async function ShortJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d{6}$/.test(code)) notFound();
  redirect(`/play/${code}`);
}
