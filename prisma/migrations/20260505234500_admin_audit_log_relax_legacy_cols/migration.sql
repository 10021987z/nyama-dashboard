-- Les colonnes héritées (action) sont déclarées NOT NULL mais aucun code
-- actuel (dashboard ou API) ne les écrit. Le dashboard insère endpoint/
-- method/body et ignore action — d'où une P2011 NullConstraintViolation
-- à chaque audit log. On relâche la contrainte NOT NULL pour que les
-- inserts du dashboard passent. Les colonnes legacy seront droppées
-- proprement quand on aura confirmé que personne ne les lit.

ALTER TABLE "AdminAuditLog" ALTER COLUMN "action" DROP NOT NULL;
