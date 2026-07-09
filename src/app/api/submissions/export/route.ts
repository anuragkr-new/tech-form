import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [questions, submissions] = await Promise.all([
    prisma.question.findMany({
      orderBy: { order: "asc" },
    }),
    prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        answers: {
          include: { question: true },
        },
      },
    }),
  ]);

  const columns = [
    { key: "submission_id", label: "Submission ID" },
    { key: "submitted_at", label: "Submitted At" },
    { key: "email", label: "Email" },
    ...questions.map((question) => ({
      key: question.key,
      label: question.label,
    })),
  ];

  const rows = submissions.map((submission) => {
    const answerByKey = new Map(
      submission.answers.map((answer) => [answer.question.key, answer.value]),
    );

    const row: Record<string, string> = {
      submission_id: submission.id,
      submitted_at: submission.createdAt.toISOString(),
      email: submission.email,
    };

    for (const question of questions) {
      if (question.type === "email") {
        row[question.key] = submission.email;
      } else {
        row[question.key] = answerByKey.get(question.key) ?? "";
      }
    }

    return row;
  });

  const csv = buildCsv(columns, rows);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jas-targets-submissions-${date}.csv"`,
    },
  });
}
