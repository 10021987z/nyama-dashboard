import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/admin-guard";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const PASSWORD_EXPIRY_DAYS = 90;

// POST /api/v1/auth/admin/change-password
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request, "VIEWER");
  if (auth instanceof NextResponse) return auth;

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body JSON invalide" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { message: "currentPassword et newPassword requis" },
      { status: 400 }
    );
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return NextResponse.json(
      { message: "Le mot de passe doit contenir min 8 caracteres, 1 majuscule, 1 chiffre, 1 caractere special" },
      { status: 400 }
    );
  }

  const account = await prisma.adminAccount.findUnique({
    where: { id: auth.admin.sub },
  });
  if (!account) {
    return NextResponse.json({ message: "Compte introuvable" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, account.passwordHash);
  if (!valid) {
    return NextResponse.json({ message: "Mot de passe actuel incorrect" }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PASSWORD_EXPIRY_DAYS);

  await prisma.adminAccount.update({
    where: { id: auth.admin.sub },
    data: { passwordHash, passwordExpiresAt: expiresAt },
  });

  return NextResponse.json({ message: "Mot de passe mis a jour" });
}
