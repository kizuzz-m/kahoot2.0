import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/lib/api";
import { getRepository } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

const bodySchema = z.object({
  players: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(40),
        score: z.number().int().min(0),
        rank: z.number().int().min(1),
      }),
    )
    .max(500),
});

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    return NextResponse.json(await getRepository().getResults(code));
  } catch (err) {
    return handleError(err);
  }
}

/** Speichert Spieler und Endstand eines Spiels. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const { players } = bodySchema.parse(await req.json());
    const repo = getRepository();
    await repo.saveResults(code, players);
    await repo.updateGameStatus(code, "finished");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
