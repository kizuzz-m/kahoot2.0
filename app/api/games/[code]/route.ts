import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError, notFound } from "@/lib/api";
import { getRepository } from "@/lib/storage";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/** Prüft, ob ein Spielcode existiert (wird beim Beitreten genutzt). */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const repo = getRepository();
    const game = await repo.getGame(code);
    if (!game) return notFound("Kein Spiel mit diesem Code gefunden");
    const quiz = await repo.getQuiz(game.quizId);
    return NextResponse.json({ ...game, quizTitle: quiz?.title ?? "Quiz" });
  } catch (err) {
    return handleError(err);
  }
}

const patchSchema = z.object({ status: z.enum(["lobby", "running", "finished"]) });

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const { code } = await params;
    const { status } = patchSchema.parse(await req.json());
    const game = await getRepository().updateGameStatus(code, status);
    return game ? NextResponse.json(game) : notFound("Spiel nicht gefunden");
  } catch (err) {
    return handleError(err);
  }
}
