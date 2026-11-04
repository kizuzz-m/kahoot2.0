import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/lib/api";
import { getRepository } from "@/lib/storage";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ quizId: z.string().min(1) });

/** Erstellt einen neuen Spielraum mit sechsstelligem Code. */
export async function POST(req: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const { quizId } = bodySchema.parse(await req.json());
    const game = await getRepository().createGame(quizId);
    return NextResponse.json(game, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
