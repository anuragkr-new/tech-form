import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { buildCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import {
  buildExportColumns,
  buildSubmissionRows,
} from "@/lib/submission-export";
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

  const columns = buildExportColumns(questions);
  const rows = buildSubmissionRows(submissions, questions);

  const csv = buildCsv(columns, rows);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jas-targets-submissions-${date}.csv"`,
    },
  });
}
