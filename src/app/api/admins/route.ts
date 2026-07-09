import { auth } from "@/lib/auth";
import {
  getEnvAdminEmails,
  isAdminEmail,
  isProtectedAdminEmail,
  isValidAdminEmail,
  normalizeAdminEmail,
} from "@/lib/admin";
import { getAdminUsers } from "@/lib/admin-access";
import { hasPrismaModel, prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function adminModelUnavailable() {
  return NextResponse.json(
    {
      error:
        "Admin storage is not available yet. Restart the app after running database migrations.",
    },
    { status: 503 },
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admins = await getAdminUsers();
  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasPrismaModel("adminUser")) {
    return adminModelUnavailable();
  }

  const body = await request.json();
  const email = normalizeAdminEmail(String(body.email ?? ""));

  if (!isValidAdminEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (await isAdminEmail(email)) {
    return NextResponse.json({ error: "This email is already an admin." }, { status: 409 });
  }

  try {
    const admin = await prisma.adminUser.create({
      data: {
        email,
        createdBy: session.user.email,
      },
    });

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        createdAt: admin.createdAt.toISOString(),
        createdBy: admin.createdBy,
        protected: getEnvAdminEmails().includes(admin.email),
      },
    });
  } catch (error) {
    console.error("Failed to add admin:", error);
    return NextResponse.json(
      { error: "Failed to add admin. Ensure database migrations have been applied." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasPrismaModel("adminUser")) {
    return adminModelUnavailable();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Admin id is required." }, { status: 400 });
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { id } });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    if (admin.email === normalizeAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: "You cannot remove your own admin access." },
        { status: 400 },
      );
    }

    if (await isProtectedAdminEmail(admin.email)) {
      return NextResponse.json(
        { error: "This admin is protected by environment configuration." },
        { status: 400 },
      );
    }

    const totalAdmins = await prisma.adminUser.count();
    if (totalAdmins <= 1) {
      return NextResponse.json({ error: "At least one admin must remain." }, { status: 400 });
    }

    await prisma.adminUser.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove admin:", error);
    return NextResponse.json(
      { error: "Failed to remove admin. Ensure database migrations have been applied." },
      { status: 500 },
    );
  }
}
