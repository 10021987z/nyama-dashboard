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

// MOCK: User list + messages are fully local. Replace with:
//   GET  /admin/users?role=...  (partial backend coverage today)
//   GET  /admin/messages/:userId
//   POST /admin/messages { userId, body }
// NOTE: Push notifications via FCM require backend v2 work.

type Role = "client" | "cook" | "rider" | "admin";
type ChatUser = {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
};

type Message = {
  id: string;
  senderId: "admin" | string;
  body: string;
  at: string;
};

const USERS: ChatUser[] = [
  { id: "u1", name: "Rose Mbala", role: "cook" },
  { id: "u2", name: "Ibrahim Ngono", role: "rider" },
  { id: "u3", name: "Marie Fotso", role: "client" },
  { id: "u4", name: "Catherine Nkomo", role: "cook" },
  { id: "u5", name: "Paul Tchoupo", role: "rider" },
  { id: "u6", name: "Jean Kamga", role: "client" },
  { id: "u7", name: "Aminata Sow", role: "cook" },
];

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

export default function ChatPage() {
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(USERS[0].id);
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleUsers = useMemo(
    () =>
      roleFilter === "all"
        ? USERS
        : USERS.filter((u) => u.role === roleFilter),
    [roleFilter]
  );

  const selectedUser = USERS.find((u) => u.id === selectedId) ?? USERS[0];
  const thread = threads[selectedId] ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread.length, selectedId]);

  // Seed with one example opening message per user on first interaction
  useEffect(() => {
    setThreads((prev) => {
      const next = { ...prev };
      USERS.forEach((u) => {
        if (!next[u.id]) {
          next[u.id] = [
            {
              id: `seed_${u.id}`,
              senderId: u.id,
              body:
                u.role === "cook"
                  ? "Bonjour, j'ai un souci avec une commande."
                  : u.role === "rider"
                    ? "Salut, j'attends un livraison."
                    : "Bonjour, j'ai une question sur mon reçu.",
              at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            },
          ];
        }
      });
      return next;
    });
  }, []);

  const send = async () => {
    const text = body.trim();
    if (!text) return;
    const msg: Message = {
      id: `m_${Date.now()}`,
      senderId: "admin",
      body: text,
      at: new Date().toISOString(),
    };
    setThreads((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), msg],
    }));
    setBody("");
    try {
      await apiClient.post("/admin/messages", {
        userId: selectedId,
        body: text,
      });
    } catch {
      // ignore — mock mode
    }
    toast.success("Message envoyé");
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
        <AlertTitle>Notifications push = V2 backend</AlertTitle>
        <AlertDescription>
          La messagerie est persistée localement pour le moment. L&apos;envoi
          réel de notifications push FCM nécessite un relais côté backend
          (endpoint <code>POST /admin/messages</code> + worker FCM), non
          disponible aujourd&apos;hui.
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
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {r === "all" ? "Tous" : ROLE_LABEL[r as Role]}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              {visibleUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted",
                    selectedId === u.id && "bg-muted"
                  )}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: ROLE_COLOR[u.role] }}
                  >
                    {u.name[0]}
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
            </CardTitle>
          </CardHeader>
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto p-4 space-y-2"
          >
            {thread.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pas de messages encore.
              </p>
            ) : (
              thread.map((m) => {
                const mine = m.senderId === "admin";
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      mine ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
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
              })
            )}
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
              placeholder="Écrire un message…"
              className="flex-1"
            />
            <Button onClick={send} disabled={!body.trim()}>
              <Send className="h-3 w-3" /> Envoyer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
