import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/admin-guard";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const PASSWORD_EXPIRY_DAYS = 90;

// PATCH /api/v1/auth/admin/accounts/:id — update admin account
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const account = await prisma.adminAccount.findUnique({ where: { id } });
  if (!account) {
    return NextResponse.json({ message: "Compte introuvable" }, { status: 404 });
  }

  let body: { role?: string; isActive?: boolean; password?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body JSON invalide" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.role !== undefined) {
    const validRoles = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "VIEWER"];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ message: "Role invalide" }, { status: 400 });
    }
    updateData.role = body.role;
  }

  if (body.isActive !== undefined) {
    updateData.isActive = body.isActive;
  }

  if (body.displayName !== undefined) {
    updateData.displayName = body.displayName;
  }

  if (body.password !== undefined) {
    if (!PASSWORD_REGEX.test(body.password)) {
      return NextResponse.json(
        { message: "Le mot de passe doit contenir min 8 caracteres, 1 majuscule, 1 chiffre, 1 caractere special" },
        { status: 400 }
      );
    }
    updateData.passwordHash = await bcrypt.hash(body.password, 12);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PASSWORD_EXPIRY_DAYS);
    updateData.passwordExpiresAt = expiresAt;
  }

  const updated = await prisma.adminAccount.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/v1/auth/admin/accounts/:id — soft delete (deactivate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  // Cannot delete yourself
  if (id === auth.admin.sub) {
    return NextResponse.json(
      { message: "Impossible de desactiver votre propre compte" },
      { status: 400 }
    );
  }

  const account = await prisma.adminAccount.findUnique({ where: { id } });
  if (!account) {
    return NextResponse.json({ message: "Compte introuvable" }, { status: 404 });
  }

  await prisma.adminAccount.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ message: "Compte desactive" });
}
