import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, type AdminJwtPayload } from "./admin-jwt";
import { prisma } from "./prisma";

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MODERATOR: 40,
  VIEWER: 10,
};

export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
}

interface AuthResult {
  admin: AdminJwtPayload;
}

export async function authenticateAdmin(
  request: NextRequest,
  requiredRole: string = "VIEWER"
): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Token manquant" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const payload = verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ message: "Token invalide ou expiré" }, { status: 401 });
  }

  if (!hasRole(payload.adminRole, requiredRole)) {
    return NextResponse.json({ message: "Permissions insuffisantes" }, { status: 403 });
  }

  // Audit log
  const url = new URL(request.url);
  await prisma.adminAuditLog.create({
    data: {
      adminId: payload.sub,
      endpoint: url.pathname,
      method: request.method,
      body: request.method !== "GET" ? await request.clone().text().catch(() => null) : null,
    },
  });

  return { admin: payload };
}
