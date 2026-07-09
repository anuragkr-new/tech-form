import { FormPage } from "@/components/FormPage";
import { FormSubtitle } from "@/components/FormHeader";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getFormSettings } from "@/lib/form-settings";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/styles/jas-form.css";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const [questions, settings] = await Promise.all([
    prisma.question.findMany({
      orderBy: { order: "asc" },
      include: { options: { orderBy: { order: "asc" } } },
    }),
    getFormSettings(),
  ]);

  const showAdminLink = isAdminEmail(session.user.email);

  return (
    <main className="jas-page">
      <div className="jas-container">
        <p className="jas-eyebrow">TECH FORM</p>
        <h1 className="jas-title">{settings.title}</h1>
        <p className="jas-subtitle">
          <FormSubtitle template={settings.subtitle} email={session.user.email} />
        </p>

        <div>
          <form
            action={async () => {
              "use server";
              const { signOut } = await import("@/lib/auth");
              await signOut({ redirectTo: "/login" });
            }}
            style={{ display: "inline" }}
          >
            <button type="submit" className="jas-signout">
              Sign out
            </button>
          </form>
          {showAdminLink && (
            <Link href="/admin" className="jas-admin-link">
              Admin
            </Link>
          )}
        </div>

        <FormPage questions={questions} userEmail={session.user.email} />
      </div>
    </main>
  );
}
