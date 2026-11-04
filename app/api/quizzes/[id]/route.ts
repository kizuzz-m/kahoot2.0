import { NextResponse } from "next/server";
import { handleError, notFound } from "@/lib/api";
import { quizInputSchema } from "@/lib/schema";
import { getRepository } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const quiz = await getRepository().getQuiz(id);
    return quiz ? NextResponse.json(quiz) : notFound("Quiz nicht gefunden");
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const input = quizInputSchema.parse(await req.json());
    const quiz = await getRepository().updateQuiz(id, input);
    return quiz ? NextResponse.json(quiz) : notFound("Quiz nicht gefunden");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const ok = await getRepository().deleteQuiz(id);
    return ok ? NextResponse.json({ ok: true }) : notFound("Quiz nicht gefunden");
  } catch (err) {
    return handleError(err);
  }
}
