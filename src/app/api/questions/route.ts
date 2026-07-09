import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await prisma.question.findMany({
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ questions });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const questions = body.questions as Array<{
    id: string;
    label: string;
    required: boolean;
    options?: Array<{ id?: string; label: string }>;
  }>;

  if (!Array.isArray(questions)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  for (const [index, question] of questions.entries()) {
    const existing = await prisma.question.findUnique({
      where: { id: question.id },
      include: { options: true },
    });

    if (!existing) continue;

    await prisma.question.update({
      where: { id: question.id },
      data: {
        label: question.label.trim() || existing.label,
        required: question.required,
        order: index,
      },
    });

    if (existing.type === "select") {
      const incomingOptions = question.options ?? [];
      const keptIds = new Set<string>();

      for (const [optionIndex, option] of incomingOptions.entries()) {
        const label = option.label.trim();
        if (!label) continue;

        if (option.id) {
          await prisma.option.update({
            where: { id: option.id },
            data: { label, order: optionIndex },
          });
          keptIds.add(option.id);
        } else {
          const created = await prisma.option.create({
            data: {
              questionId: existing.id,
              label,
              order: optionIndex,
            },
          });
          keptIds.add(created.id);
        }
      }

      const toDelete = existing.options
        .map((option) => option.id)
        .filter((id) => !keptIds.has(id));

      if (toDelete.length > 0) {
        await prisma.option.deleteMany({ where: { id: { in: toDelete } } });
      }
    }
  }

  const updated = await prisma.question.findMany({
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ questions: updated });
}
