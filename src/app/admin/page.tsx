import { AdminPanel } from "@/components/AdminPanel";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getFormSettings } from "@/lib/form-settings";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const [questions, submissions, settings] = await Promise.all([
    prisma.question.findMany({
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        answers: {
          include: { question: true },
        },
      },
    }),
    getFormSettings(),
  ]);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-accent">Admin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Form configuration</h1>
            <p className="mt-3 text-muted">
              Edit question text, manage dropdown options, and mark fields as mandatory.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-accent"
          >
            Back to form
          </Link>
        </header>

        <AdminPanel
          initialQuestions={questions}
          initialSettings={settings}
          initialSubmissions={submissions.map((submission) => ({
            id: submission.id,
            email: submission.email,
            createdAt: submission.createdAt.toISOString(),
            answers: submission.answers.map((answer) => ({
              id: answer.id,
              value: answer.value,
              question: {
                id: answer.question.id,
                label: answer.question.label,
                key: answer.question.key,
              },
            })),
          }))}
        />
      </div>
    </main>
  );
}
