-- Le dashboard insère endpoint/method/body dans AdminAuditLog mais ces
-- colonnes manquaient en prod (le table avait été recréée par un backfill
-- nyama-api avec le schema action/details/ip/target). On ajoute les 3
-- colonnes attendues par le dashboard, en gardant les anciennes pour
-- backward compat.

ALTER TABLE "AdminAuditLog"
  ADD COLUMN IF NOT EXISTS "endpoint" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AdminAuditLog"
  ADD COLUMN IF NOT EXISTS "method" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AdminAuditLog"
  ADD COLUMN IF NOT EXISTS "body" TEXT;
