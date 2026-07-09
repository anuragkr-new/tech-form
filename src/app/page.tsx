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
    <main className="min-h-screen px-6 py-14">
      <div className="mx-auto max-w-[760px]">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Tech Form</p>
          <h1 className="mt-2 text-[34px] font-extrabold leading-tight text-heading">
            JAS Targets Requirements
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-body">
            Submit your technical requirements for JAS targets. Signed in as{" "}
            <span className="font-semibold text-heading">{session.user.email}</span>.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg border border-field-border bg-card-bg px-4 py-2 text-[14px] font-medium text-heading transition hover:border-[#D1D5DB]"
              >
                Sign out
              </button>
            </form>
            {showAdminLink && (
              <Link
                href="/admin"
                className="whitespace-nowrap rounded-lg border border-field-border bg-card-bg px-4 py-2 text-[14px] font-medium text-body transition hover:border-accent hover:text-accent"
              >
                Admin
              </Link>
            )}
          </div>
        </header>

        <FormPage questions={questions} userEmail={session.user.email} />
      </div>
    </main>
  );
}
