import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";

// Direct SQLite access for seed — avoids Prisma client ESM/path issues
const db = new Database("dev.db");

const username = "superadmin";
const password = "Nyama@Admin2026!";
const passwordHash = await bcrypt.hash(password, 12);

const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 90);

// Check if already exists
const existing = db.prepare("SELECT id FROM AdminAccount WHERE username = ?").get(username) as { id: string } | undefined;

if (existing) {
  console.log("Super admin existe deja (id:", existing.id, ")");
} else {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO AdminAccount (id, username, passwordHash, displayName, role, isActive, loginCount, passwordExpiresAt, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, ?)
  `).run(id, username, passwordHash, "Daniel Zilli Jonjou", "SUPER_ADMIN", expiresAt.toISOString(), now, now);
  console.log("Super admin cree (id:", id, ")");
}

console.log("");
console.log("=== IDENTIFIANTS DE CONNEXION ===");
console.log("Username :", username);
console.log("Password :", password);
console.log("=================================");

db.close();
