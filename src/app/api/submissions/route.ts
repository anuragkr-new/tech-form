import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AnswerInput = {
  questionId: string;
  value: string;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      answers: {
        include: { question: true },
      },
    },
  });

  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const answers = body.answers as AnswerInput[];

  if (!Array.isArray(answers)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({
    orderBy: { order: "asc" },
    include: { options: true },
  });

  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.value.trim()]));

  for (const question of questions) {
    const value = answerMap.get(question.id) ?? "";

    if (question.type === "email") {
      answerMap.set(question.id, session.user.email);
      continue;
    }

    if (question.required && !value) {
      return NextResponse.json(
        { error: `"${question.label}" is required.` },
        { status: 400 },
      );
    }

    if (question.type === "select" && value) {
      const valid = question.options.some((option) => option.label === value);
      if (!valid) {
        return NextResponse.json(
          { error: `Invalid option for "${question.label}".` },
          { status: 400 },
        );
      }
    }
  }

  const submission = await prisma.submission.create({
    data: {
      email: session.user.email,
      answers: {
        create: questions.map((question) => ({
          questionId: question.id,
          value:
            question.type === "email"
              ? session.user!.email!
              : (answerMap.get(question.id) ?? ""),
        })),
      },
    },
    include: {
      answers: {
        include: { question: true },
      },
    },
  });

  return NextResponse.json({ submission }, { status: 201 });
}
