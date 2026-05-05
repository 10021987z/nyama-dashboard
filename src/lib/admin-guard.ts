import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, type AdminJwtPayload } from "./admin-jwt";
import { hasPermission as checkPermission, type Permission } from "./permissions";
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

interface AuthOptions {
  /** Rôle minimum requis (hiérarchique). Défaut : VIEWER (n'importe quel admin actif). */
  role?: string;
  /** Permission granulaire requise — bypass par SUPER_ADMIN. Si fournie, le check rôle est ignoré au profit du permission check. */
  permission?: Permission;
}

export async function authenticateAdmin(
  request: NextRequest,
  options: string | AuthOptions = "VIEWER"
): Promise<AuthResult | NextResponse> {
  const opts: AuthOptions =
    typeof options === "string" ? { role: options } : options;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Token manquant" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const payload = verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ message: "Token invalide ou expiré" }, { status: 401 });
  }

  // Permission granulaire prioritaire sur le rôle si fournie.
  if (opts.permission) {
    const ok = checkPermission(
      { adminRole: payload.adminRole, permissions: payload.permissions },
      opts.permission,
    );
    if (!ok) {
      return NextResponse.json(
        { message: `Permission requise : ${opts.permission}` },
        { status: 403 },
      );
    }
  } else if (opts.role && !hasRole(payload.adminRole, opts.role)) {
    return NextResponse.json(
      { message: "Permissions insuffisantes" },
      { status: 403 },
    );
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
