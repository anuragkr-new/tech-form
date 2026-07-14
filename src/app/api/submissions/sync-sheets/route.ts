import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  isGoogleSheetsEnabled,
  syncAllSubmissionsToSheet,
} from "@/lib/integrations/google-sheets";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isGoogleSheetsEnabled()) {
    return NextResponse.json(
      { error: "Google Sheets sync is not configured." },
      { status: 400 },
    );
  }

  const [questions, submissions] = await Promise.all([
    prisma.question.findMany({
      orderBy: { order: "asc" },
    }),
    prisma.submission.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        answers: {
          include: { question: true },
        },
      },
    }),
  ]);

  try {
    const synced = await syncAllSubmissionsToSheet(submissions, questions);
    return NextResponse.json({ synced });
  } catch (error) {
    console.error("Failed to sync submissions to Google Sheets:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync submissions to Google Sheets.",
      },
      { status: 502 },
    );
  }
}
