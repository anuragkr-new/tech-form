import { FormPage } from "@/components/FormPage";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const questions = await prisma.question.findMany({
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  const showAdminLink = isAdminEmail(session.user.email);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm uppercase tracking-widest text-accent">Tech Form</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                JAS Targets Requirements
              </h1>
              <p className="mt-3 text-muted">
                Submit your technical requirements for JAS targets. Signed in as{" "}
                <span className="text-foreground">{session.user.email}</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {showAdminLink && (
                <Link
                  href="/admin"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-accent"
                >
                  Admin
                </Link>
              )}
              <form
                action={async () => {
                  "use server";
                  const { signOut } = await import("@/lib/auth");
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <FormPage questions={questions} userEmail={session.user.email} />
      </div>
    </main>
  );
}
