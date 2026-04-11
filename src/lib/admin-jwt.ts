import jwt from "jsonwebtoken";

// Shared with nyama-api backend (Railway env var JWT_SECRET).
// The admin dashboard signs tokens with the SAME secret as the backend so
// that requests to https://nyama-api-production.up.railway.app are accepted
// directly — the backend JwtStrategy detects the `adminRole` claim and
// bypasses its User table lookup.
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET env var is required — must match the nyama-api backend secret",
    );
  }
  return secret;
}

const EXPIRES_IN = "2h";

export interface AdminJwtPayload {
  sub: string;
  username: string;
  adminRole: string;
  displayName: string;
  // role is set to "ADMIN" so the backend RolesGuard accepts the token
  // on any @Roles(UserRole.ADMIN) endpoint. Kept inside the JWT payload
  // rather than derived at verify-time so the dashboard admin-guard and
  // the backend see the exact same claims.
  role: "ADMIN";
  iat?: number;
  exp?: number;
}

export function signAdminToken(
  payload: Omit<AdminJwtPayload, "iat" | "exp" | "role">,
): string {
  return jwt.sign({ ...payload, role: "ADMIN" }, getSecret(), {
    expiresIn: EXPIRES_IN,
  });
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as AdminJwtPayload;
  } catch {
    return null;
  }
}
