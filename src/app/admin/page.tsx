import { AdminPanel } from "@/components/AdminPanel";
import { auth } from "@/lib/auth";
import { getAdminUsers, isAdminEmail } from "@/lib/admin";
import { getFormSettings } from "@/lib/form-settings";
import { isGoogleSheetsEnabled } from "@/lib/integrations/google-sheets";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/styles/jas-form.css";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    redirect("/");
  }

  const [questions, submissions, settings, admins] = await Promise.all([
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
    getAdminUsers(),
  ]);

  return (
    <main className="jas-page">
      <div className="jas-container">
        <p className="jas-eyebrow">ADMIN</p>
        <h1 className="jas-title">Form configuration</h1>
        <p className="jas-subtitle">
          Edit the form header, question text, dropdown options, and mandatory fields.
        </p>

        <Link href="/" className="jas-admin-link jas-admin-back-link">
          Back to form
        </Link>

        <AdminPanel
          currentUserEmail={session.user.email}
          googleSheetsEnabled={isGoogleSheetsEnabled()}
          initialQuestions={questions}
          initialSettings={settings}
          initialAdmins={admins}
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
