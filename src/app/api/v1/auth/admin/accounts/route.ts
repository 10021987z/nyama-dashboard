import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateAdmin } from "@/lib/admin-guard";
import {
  PERMISSION_PRESETS,
  sanitizePermissions,
} from "@/lib/permissions";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const PASSWORD_EXPIRY_DAYS = 90;

// GET /api/v1/auth/admin/accounts — list all admin accounts (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const accounts = await prisma.adminAccount.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      permissions: true,
      isActive: true,
      lastLoginAt: true,
      loginCount: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      passwordExpiresAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: accounts });
}

// POST /api/v1/auth/admin/accounts — create admin account (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  let body: {
    username?: string;
    password?: string;
    displayName?: string;
    role?: string;
    permissions?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body JSON invalide" }, { status: 400 });
  }

  const { username, password, displayName, role, permissions } = body;

  if (!username || !password || !displayName) {
    return NextResponse.json(
      { message: "username, password et displayName requis" },
      { status: 400 }
    );
  }

  if (!PASSWORD_REGEX.test(password)) {
    return NextResponse.json(
      { message: "Le mot de passe doit contenir min 8 caracteres, 1 majuscule, 1 chiffre, 1 caractere special" },
      { status: 400 }
    );
  }

  const validRoles = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "VIEWER"];
  const targetRole = role ?? "ADMIN";
  if (!validRoles.includes(targetRole)) {
    return NextResponse.json({ message: `Role invalide. Valeurs: ${validRoles.join(", ")}` }, { status: 400 });
  }

  // Check uniqueness
  const existing = await prisma.adminAccount.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ message: "Ce username existe deja" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PASSWORD_EXPIRY_DAYS);

  // Permissions : si le caller fournit une liste explicite, on
  // sanitize contre le catalog. Sinon on applique le préset du rôle.
  const sanitized =
    permissions !== undefined
      ? sanitizePermissions(permissions)
      : PERMISSION_PRESETS[targetRole] ?? [];

  const account = await prisma.adminAccount.create({
    data: {
      username,
      passwordHash,
      displayName,
      role: targetRole,
      permissions: sanitized,
      createdBy: auth.admin.sub,
      passwordExpiresAt: expiresAt,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      permissions: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
