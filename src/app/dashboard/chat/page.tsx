"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MessagesSquare, Send, Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

// Câblé sur:
//   GET  /admin/users         → liste utilisateurs (cook/rider/client)
//   GET  /admin/messages/:id  → historique chronologique
//   POST /admin/messages      → envoi (persisté + dispatch socket admin:message)
// Le canal "inapp" est dispatch via WebSocket sur la room du rôle. Push FCM
// reste V2 (NotificationsService est aujourd'hui un stub).

type ApiRole = "CLIENT" | "COOK" | "RIDER" | "ADMIN";
type Role = "client" | "cook" | "rider" | "admin";

type ApiUser = {
  id: string;
  name: string | null;
  phone: string;
  role: ApiRole;
  avatarUrl?: string | null;
};

type ChatUser = {
  id: string;
  name: string;
  role: Role;
};

type ApiMessage = {
  id: string;
  fromAdminId: string;
  recipientId: string;
  recipientRole: ApiRole;
  channel: string;
  subject: string | null;
  body: string;
  sentAt: string;
  readAt: string | null;
};

type Message = {
  id: string;
  senderId: "admin" | string;
  body: string;
  at: string;
};

const ROLE_LABEL: Record<Role, string> = {
  client: "Client",
  cook: "Cuisinière",
  rider: "Livreur",
  admin: "Admin",
};

const ROLE_COLOR: Record<Role, string> = {
  client: "#D4A017",
  cook: "#F57C20",
  rider: "#1B4332",
  admin: "#3D3D3D",
};

function normalizeRole(r: ApiRole): Role {
  return r.toLowerCase() as Role;
}

export default function ChatPage() {
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1) Liste utilisateurs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await apiClient.get<{ data?: ApiUser[] }>("/admin/users");
        if (cancelled) return;
        const list = (resp?.data ?? [])
          .filter((u) => u.role !== "ADMIN")
          .map<ChatUser>((u) => ({
            id: u.id,
            name: u.name?.trim() || u.phone,
            role: normalizeRole(u.role),
          }));
        setUsers(list);
        if (list.length && !selectedId) setSelectedId(list[0].id);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // selectedId intentionally excluded — only set on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Historique du destinataire sélectionné
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setThreadLoading(true);
    (async () => {
      try {
        const resp = await apiClient.get<{ messages?: ApiMessage[] }>(
          `/admin/messages/${selectedId}`,
        );
        if (cancelled) return;
        const mapped = (resp?.messages ?? []).map<Message>((m) => ({
          id: m.id,
          senderId: "admin",
          body: m.body,
          at: m.sentAt,
        }));
        setThread(mapped);
      } catch {
        if (!cancelled) setThread([]);
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const visibleUsers = useMemo(
    () =>
      roleFilter === "all"
        ? users
        : users.filter((u) => u.role === roleFilter),
    [users, roleFilter],
  );

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread.length, selectedId]);

  const send = async () => {
    const text = body.trim();
    if (!text || !selectedId || sending) return;

    // Optimistic append
    const tempId = `pending_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      senderId: "admin",
      body: text,
      at: new Date().toISOString(),
    };
    setThread((prev) => [...prev, optimistic]);
    setBody("");
    setSending(true);

    try {
      const resp = await apiClient.post<{
        ok: boolean;
        id: string;
        sentAt: string;
      }>("/admin/messages", {
        userId: selectedId,
        body: text,
      });
      // Replace optimistic with confirmed id
      setThread((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, id: resp?.id ?? m.id, at: resp?.sentAt ?? m.at }
            : m,
        ),
      );
      toast.success("Message envoyé");
    } catch (e) {
      setThread((prev) => prev.filter((m) => m.id !== tempId));
      setBody(text);
      toast.error("Échec d'envoi", {
        description: e instanceof Error ? e.message : "Erreur réseau",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          Messagerie Admin ↔ Apps
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envoi direct aux clients, cuisinières, livreurs.
        </p>
      </div>

      <Alert variant="info">
        <Bell className="h-4 w-4" />
        <AlertTitle>Canal in-app actif · Push FCM en V2</AlertTitle>
        <AlertDescription>
          Les messages sont persistés et diffusés en temps réel via WebSocket
          sur la room du destinataire (canal <code>inapp</code>). L&apos;envoi
          push FCM / SMS / email passera par <code>NotificationsService</code>{" "}
          quand l&apos;adapter sera branché côté backend.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-320px)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto">
            <div className="flex gap-1 flex-wrap">
              {(["all", "client", "cook", "rider"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    roleFilter === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {r === "all" ? "Tous" : ROLE_LABEL[r as Role]}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              {usersLoading && (
                <p className="text-xs text-muted-foreground p-2">
                  Chargement…
                </p>
              )}
              {!usersLoading && visibleUsers.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">
                  Aucun utilisateur.
                </p>
              )}
              {visibleUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted",
                    selectedId === u.id && "bg-muted",
                  )}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: ROLE_COLOR[u.role] }}
                  >
                    {u.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ROLE_LABEL[u.role]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              {selectedUser ? (
                <>
                  <span>{selectedUser.name}</span>
                  <Badge
                    variant="outline"
                    style={{
                      color: ROLE_COLOR[selectedUser.role],
                      borderColor: ROLE_COLOR[selectedUser.role],
                    }}
                  >
                    {ROLE_LABEL[selectedUser.role]}
                  </Badge>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Sélectionnez un utilisateur
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto p-4 space-y-2"
          >
            {threadLoading && (
              <p className="text-sm text-muted-foreground">
                Chargement de l&apos;historique…
              </p>
            )}
            {!threadLoading && thread.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Pas de messages encore.
              </p>
            )}
            {!threadLoading &&
              thread.map((m) => {
                const mine = m.senderId === "admin";
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <p>{m.body}</p>
                      <p className="mt-1 text-[10px] opacity-60">
                        {new Date(m.at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="border-t p-3 flex items-center gap-2">
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={
                selectedUser
                  ? "Écrire un message…"
                  : "Sélectionnez un utilisateur"
              }
              disabled={!selectedUser || sending}
              className="flex-1"
            />
            <Button
              onClick={send}
              disabled={!body.trim() || !selectedUser || sending}
            >
              <Send className="h-3 w-3" /> Envoyer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
