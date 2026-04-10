import jwt from "jsonwebtoken";

const SECRET = process.env.ADMIN_JWT_SECRET ?? "nyama-admin-secret-change-me";
const EXPIRES_IN = "2h";

export interface AdminJwtPayload {
  sub: string;
  username: string;
  adminRole: string;
  displayName: string;
  iat?: number;
  exp?: number;
}

export function signAdminToken(payload: Omit<AdminJwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as AdminJwtPayload;
  } catch {
    return null;
  }
}
