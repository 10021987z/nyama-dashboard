import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAdminToken } from "@/lib/admin-jwt";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? null;

  // Rate limit check
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    await prisma.adminLoginLog.create({
      data: { username: "unknown", ip, userAgent, success: false, reason: "rate_limited" },
    });
    return NextResponse.json(
      { message: `Trop de tentatives. Reessayez dans ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body JSON invalide" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ message: "username et password requis" }, { status: 400 });
  }

  // Find admin account
  const account = await prisma.adminAccount.findUnique({ where: { username } });

  if (!account) {
    await prisma.adminLoginLog.create({
      data: { username, ip, userAgent, success: false, reason: "user_not_found" },
    });
    return NextResponse.json({ message: "Identifiants incorrects" }, { status: 401 });
  }

  if (!account.isActive) {
    await prisma.adminLoginLog.create({
      data: { username, ip, userAgent, success: false, reason: "account_disabled" },
    });
    return NextResponse.json({ message: "Compte desactive" }, { status: 401 });
  }

  // Compare password
  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    await prisma.adminLoginLog.create({
      data: { username, ip, userAgent, success: false, reason: "invalid_password" },
    });
    return NextResponse.json({ message: "Identifiants incorrects" }, { status: 401 });
  }

  // Check password expiry
  if (account.passwordExpiresAt && new Date(account.passwordExpiresAt) < new Date()) {
    await prisma.adminLoginLog.create({
      data: { username, ip, userAgent, success: false, reason: "password_expired" },
    });
    return NextResponse.json(
      { message: "Mot de passe expire. Veuillez le changer.", code: "PASSWORD_EXPIRED" },
      { status: 403 }
    );
  }

  // Success — generate JWT (include granular permissions for frontend
  // checks ; SUPER_ADMIN bypass via hasPermission so list can be empty).
  const token = signAdminToken({
    sub: account.id,
    username: account.username,
    adminRole: account.role,
    displayName: account.displayName,
    permissions: account.permissions ?? [],
  });

  // Update account stats
  await prisma.adminAccount.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
  });

  // Log success
  await prisma.adminLoginLog.create({
    data: { username, ip, userAgent, success: true },
  });

  // Reset rate limit on success
  resetRateLimit(ip);

  return NextResponse.json({
    accessToken: token,
    user: {
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      permissions: account.permissions ?? [],
    },
  });
}
