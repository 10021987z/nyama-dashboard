"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  ALL_PERMISSIONS,
  PERMISSION_CATALOG,
  PERMISSION_GROUPS,
  PERMISSION_PRESETS,
  type Permission,
} from "@/lib/permissions";
import { Shield, ShieldCheck, ShieldAlert, Plus, Edit2, Power } from "lucide-react";

interface AdminAccount {
  id: string;
  username: string;
  displayName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
}

const ROLE_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  SUPER_ADMIN: { label: "Super Admin", bg: "#7c3aed", fg: "#fff" },
  ADMIN: { label: "Admin", bg: "#2563eb", fg: "#fff" },
  MODERATOR: { label: "Modérateur", bg: "#0891b2", fg: "#fff" },
  VIEWER: { label: "Lecture seule", bg: "#6b7280", fg: "#fff" },
};

function authedFetch(input: string, init: RequestInit = {}) {
  const token = localStorage.getItem("nyama_admin_token");
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
    },
  });
}

export default function AdminsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/v1/auth/admin/accounts");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setAccounts(json.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) fetchAccounts();
  }, [isSuperAdmin, fetchAccounts]);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-amber-500" />
        <h2 className="mt-4 text-xl font-semibold">Accès réservé</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-md">
          Seul un compte SUPER_ADMIN peut gérer les administrateurs et leurs
          permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-[2rem] font-semibold italic leading-tight"
            style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
          >
            Administrateurs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Crée et gère les comptes admin avec des permissions granulaires
            par fonctionnalité.
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="gap-2"
          style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }}
        >
          <Plus className="h-4 w-4" /> Nouvel admin
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={fetchAccounts} />}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {accounts?.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              isSelf={user?.sub === a.id}
              onEdit={() => setEditing(a)}
              onToggleActive={async () => {
                const res = await authedFetch(
                  `/api/v1/auth/admin/accounts/${a.id}`,
                  a.isActive
                    ? { method: "DELETE" }
                    : {
                        method: "PATCH",
                        body: JSON.stringify({ isActive: true }),
                      },
                );
                if (!res.ok) {
                  const body = await res.json().catch(() => ({}));
                  toast.error(body.message ?? `HTTP ${res.status}`);
                  return;
                }
                toast.success(
                  a.isActive ? "Compte désactivé" : "Compte réactivé",
                );
                fetchAccounts();
              }}
            />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <AdminFormDialog
          account={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            fetchAccounts();
          }}
        />
      )}
    </div>
  );
}

function AccountCard({
  account,
  isSelf,
  onEdit,
  onToggleActive,
}: {
  account: AdminAccount;
  isSelf: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  const badge = ROLE_BADGE[account.role] ?? ROLE_BADGE.ADMIN;
  const permCount = account.role === "SUPER_ADMIN" ? "∞" : account.permissions.length;
  const RoleIcon =
    account.role === "SUPER_ADMIN" ? ShieldCheck : Shield;

  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4 bg-white"
      style={{ boxShadow: "0 2px 24px rgba(160,60,0,0.05), 0 1px 3px rgba(27,28,26,0.04)" }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "#fdf3ee" }}
      >
        <RoleIcon className="h-5 w-5" style={{ color: badge.bg }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-base">{account.displayName}</span>
          <Badge style={{ backgroundColor: badge.bg, color: badge.fg }}>
            {badge.label}
          </Badge>
          {!account.isActive && <Badge variant="secondary">Désactivé</Badge>}
          {isSelf && <Badge variant="outline">vous</Badge>}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          @{account.username} · {permCount} permission{permCount === 1 ? "" : "s"}
          {account.lastLoginAt && (
            <> · dernière connexion {new Date(account.lastLoginAt).toLocaleString("fr-FR")}</>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit} className="gap-1">
          <Edit2 className="h-3.5 w-3.5" /> Modifier
        </Button>
        {!isSelf && (
          <Button
            variant={account.isActive ? "outline" : "default"}
            size="sm"
            onClick={onToggleActive}
            className="gap-1"
          >
            <Power className="h-3.5 w-3.5" />
            {account.isActive ? "Désactiver" : "Réactiver"}
          </Button>
        )}
      </div>
    </div>
  );
}

function AdminFormDialog({
  account,
  onClose,
  onSaved,
}: {
  account: AdminAccount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = account !== null;
  const [username, setUsername] = useState(account?.username ?? "");
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(account?.role ?? "ADMIN");
  const [perms, setPerms] = useState<Set<Permission>>(
    new Set((account?.permissions ?? PERMISSION_PRESETS.ADMIN) as Permission[]),
  );
  const [submitting, setSubmitting] = useState(false);

  // Quand le rôle change, on pré-remplit les permissions du préset (sauf en
  // édition où on respecte les permissions existantes au premier render).
  const handleRoleChange = (newRole: string | null) => {
    if (!newRole) return;
    setRole(newRole);
    setPerms(new Set((PERMISSION_PRESETS[newRole] ?? []) as Permission[]));
  };

  const togglePerm = (p: Permission) => {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const submit = async () => {
    if (!username || !displayName) {
      toast.error("Username et nom complet requis");
      return;
    }
    if (!isEdit && !password) {
      toast.error("Mot de passe requis pour un nouveau compte");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        username,
        displayName,
        role,
        permissions: Array.from(perms),
      };
      if (password) body.password = password;
      const url = isEdit
        ? `/api/v1/auth/admin/accounts/${account!.id}`
        : `/api/v1/auth/admin/accounts`;
      const res = await authedFetch(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message ?? `HTTP ${res.status}`);
      }
      toast.success(isEdit ? "Admin mis à jour" : "Admin créé");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const allChecked = useMemo(
    () => ALL_PERMISSIONS.every((p) => perms.has(p)),
    [perms],
  );
  const toggleAll = () => {
    setPerms(allChecked ? new Set() : new Set(ALL_PERMISSIONS));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Modifier ${account!.displayName}` : "Nouvel administrateur"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Nom complet
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex : Marie Ngono"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex : marie.ngono"
                disabled={isEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Rôle</label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin (tous droits)</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MODERATOR">Modérateur</SelectItem>
                  <SelectItem value="VIEWER">Lecture seule</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Le rôle pré-remplit les permissions par défaut. Tu peux les
                ajuster manuellement ci-dessous.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Mot de passe {isEdit && "(laisser vide pour ne pas changer)"}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, 1 maj, 1 chiffre, 1 spécial"
              />
            </div>
          </div>

          {role === "SUPER_ADMIN" ? (
            <div
              className="rounded-xl p-4 text-sm"
              style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
            >
              <ShieldCheck className="inline h-4 w-4 mr-1" />
              Un Super Admin a TOUTES les permissions automatiquement (bypass).
              Aucune sélection nécessaire.
            </div>
          ) : (
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  Permissions ({perms.size} / {ALL_PERMISSIONS.length})
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-orange-600 hover:underline"
                >
                  {allChecked ? "Tout décocher" : "Tout cocher"}
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                      {group.label}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                      {group.permissions.map((p) => (
                        <label
                          key={p}
                          className="flex items-start gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={perms.has(p)}
                            onChange={() => togglePerm(p)}
                            className="mt-0.5"
                          />
                          <span className="flex-1">
                            <code className="text-[11px] text-gray-500">{p}</code>
                            <span className="block text-[12px] text-gray-700">
                              {PERMISSION_CATALOG[p]}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)", color: "#fff" }}
          >
            {submitting ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
