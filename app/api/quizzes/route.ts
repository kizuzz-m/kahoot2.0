import { NextResponse } from "next/server";
import { handleError } from "@/lib/api";
import { quizInputSchema } from "@/lib/schema";
import { getRepository } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getRepository().listQuizzes());
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const input = quizInputSchema.parse(await req.json());
    const quiz = await getRepository().createQuiz(input);
    return NextResponse.json(quiz, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
