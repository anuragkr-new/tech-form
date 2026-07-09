import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  getFormSettings,
} from "@/lib/form-settings";
import { hasPrismaModel, prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getFormSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const subtitle = String(body.subtitle ?? "").trim();

  if (!title || !subtitle) {
    return NextResponse.json(
      { error: "Title and subtitle are required." },
      { status: 400 },
    );
  }

  if (!hasPrismaModel("formSettings")) {
    return NextResponse.json(
      { error: "Form settings are not available yet. Restart the app after deploying the latest migration." },
      { status: 503 },
    );
  }

  try {
    const settings = await prisma.formSettings.upsert({
      where: { id: "default" },
      create: { id: "default", title, subtitle },
      update: { title, subtitle },
    });

    return NextResponse.json({
      settings: {
        title: settings.title,
        subtitle: settings.subtitle,
      },
    });
  } catch (error) {
    console.error("Failed to save form settings:", error);
    return NextResponse.json(
      { error: "Failed to save form header. Ensure database migrations have been applied." },
      { status: 500 },
    );
  }
}
