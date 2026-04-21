"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bot, Sparkles, Send, Tag } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// MOCK: Ticket history is static. Wire to:
//   GET /admin/support/tickets?userId=...
//   POST /admin/support/tickets/:id/replies
// Similarity matching is deterministic (token-overlap) — not a call to any LLM.
type Ticket = {
  id: string;
  user: string;
  status: "open" | "resolved";
  createdAt: string;
  body: string;
  resolution?: string;
  category?: TicketCategory;
};

type TicketCategory = "bug" | "question" | "complaint" | "feature";

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  bug: "Bug",
  question: "Question",
  complaint: "Réclamation",
  feature: "Demande fonctionnalité",
};

const CATEGORY_COLOR: Record<TicketCategory, string> = {
  bug: "#E8413C",
  question: "#2563eb",
  complaint: "#D4A017",
  feature: "#1B4332",
};

// Keyword-based deterministic classification (no external AI call)
const KEYWORDS: Record<TicketCategory, string[]> = {
  bug: [
    "plantage",
    "crash",
    "erreur",
    "bug",
    "ne fonctionne pas",
    "marche pas",
    "bloqué",
    "écran blanc",
  ],
  question: ["comment", "pourquoi", "quand", "où", "combien", "?"],
  complaint: [
    "retard",
    "froid",
    "mauvais",
    "impoli",
    "déçu",
    "remboursement",
    "qualité",
    "sale",
  ],
  feature: [
    "serait bien",
    "pourriez",
    "ajoutez",
    "proposer",
    "suggest",
    "suggestion",
    "feature",
  ],
};

function classify(text: string): TicketCategory {
  const lc = text.toLowerCase();
  const scores: Record<TicketCategory, number> = {
    bug: 0,
    question: 0,
    complaint: 0,
    feature: 0,
  };
  for (const cat of Object.keys(KEYWORDS) as TicketCategory[]) {
    for (const kw of KEYWORDS[cat]) {
      if (lc.includes(kw)) scores[cat] += 1;
    }
  }
  const [best] = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return (best?.[0] as TicketCategory) ?? "question";
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function similarity(a: string, b: string): number {
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((w) => {
    if (B.has(w)) inter += 1;
  });
  return inter / (A.size + B.size - inter);
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "t1",
    user: "Jean Kamga",
    status: "open",
    createdAt: "2026-04-20T14:22:00Z",
    body: "Ma commande est arrivée froide et le riz était trop sec.",
  },
  {
    id: "t2",
    user: "Marie Fotso",
    status: "open",
    createdAt: "2026-04-21T09:10:00Z",
    body: "L'application plante quand j'essaye d'ajouter une adresse.",
  },
  {
    id: "t3",
    user: "Ibrahim Ngono",
    status: "open",
    createdAt: "2026-04-21T11:45:00Z",
    body: "Comment modifier mon RIB pour recevoir les paiements ?",
  },
  {
    id: "t4",
    user: "Paul Tchoupo",
    status: "resolved",
    createdAt: "2026-04-18T16:30:00Z",
    body: "Livraison très en retard, client mécontent, je voudrais un remboursement partiel.",
    resolution:
      "Remboursement de 30% effectué, cuisinière prévenue du pic de trafic.",
    category: "complaint",
  },
  {
    id: "t5",
    user: "Rose Mbala",
    status: "resolved",
    createdAt: "2026-04-17T10:00:00Z",
    body: "L'application plante au lancement sur Android 10.",
    resolution:
      "Correctif déployé v2.4.1, demande à l'utilisateur de mettre à jour depuis le Play Store.",
    category: "bug",
  },
  {
    id: "t6",
    user: "Catherine Nkomo",
    status: "resolved",
    createdAt: "2026-04-16T14:00:00Z",
    body: "Comment changer mon numéro de téléphone ?",
    resolution:
      "Renvoyé vers Paramètres → Compte → Numéro. OTP reçu par SMS pour validation.",
    category: "question",
  },
];

function suggestReply(ticket: Ticket, history: Ticket[]): string | null {
  const resolved = history.filter((t) => t.status === "resolved" && t.resolution);
  if (!resolved.length) return null;
  const ranked = resolved
    .map((t) => ({ t, score: similarity(ticket.body, t.body) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (!top || top.score < 0.1) return null;
  return top.t.resolution ?? null;
}

export default function SupportAiPage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedId, setSelectedId] = useState(INITIAL_TICKETS[0].id);
  const [reply, setReply] = useState("");

  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0];
  const category = useMemo(
    () => selected.category ?? classify(selected.body),
    [selected]
  );
  const suggested = useMemo(
    () => suggestReply(selected, tickets),
    [selected, tickets]
  );

  const useSuggestion = () => {
    if (suggested) setReply(suggested);
  };

  const resolveTicket = () => {
    if (!reply.trim()) {
      toast.error("Rédigez une réponse avant de résoudre.");
      return;
    }
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? { ...t, status: "resolved", resolution: reply, category }
          : t
      )
    );
    setReply("");
    toast.success("Ticket résolu.");
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
          Support assisté
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Classification auto + suggestions basées sur les tickets résolus
          similaires (heuristique locale).
        </p>
      </div>

      <Alert variant="info">
        <Bot className="h-4 w-4" />
        <AlertTitle>Pas de modèle LLM appelé</AlertTitle>
        <AlertDescription>
          La similarité utilise un chevauchement de tokens déterministe.
          Classification par règles (mots-clés). Pour brancher un vrai LLM,
          ajouter <code>@ai-sdk/react</code> + clé API.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {tickets.map((t) => {
              const cat = t.category ?? classify(t.body);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 rounded-lg border border-transparent p-2 text-left transition-colors hover:bg-muted",
                    selectedId === t.id && "bg-muted border-border"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {t.user}
                    </span>
                    <Badge
                      variant={
                        t.status === "resolved" ? "secondary" : "default"
                      }
                    >
                      {t.status === "resolved" ? "Résolu" : "Ouvert"}
                    </Badge>
                  </div>
                  <p className="w-full truncate text-xs text-muted-foreground">
                    {t.body}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${CATEGORY_COLOR[cat]}15`,
                      color: CATEGORY_COLOR[cat],
                    }}
                  >
                    <Tag className="h-2.5 w-2.5" /> {CATEGORY_LABEL[cat]}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Ticket · {selected.user}</span>
              <Badge
                variant="outline"
                style={{
                  color: CATEGORY_COLOR[category],
                  borderColor: CATEGORY_COLOR[category],
                }}
              >
                <Tag className="h-3 w-3" /> {CATEGORY_LABEL[category]}
              </Badge>
              <Badge variant="secondary">
                {new Date(selected.createdAt).toLocaleString("fr-FR")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              {selected.body}
            </div>

            {selected.status === "resolved" ? (
              <Alert variant="success">
                <AlertTitle>Résolution</AlertTitle>
                <AlertDescription>{selected.resolution}</AlertDescription>
              </Alert>
            ) : (
              <>
                {suggested ? (
                  <Alert variant="info">
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>
                      Réponse suggérée (extrait d&apos;un cas similaire)
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>{suggested}</p>
                      <Button size="sm" onClick={useSuggestion}>
                        Utiliser cette réponse
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aucun cas similaire suffisamment proche dans l&apos;historique
                    résolu.
                  </p>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Réponse
                  </label>
                  <Input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Tapez votre réponse…"
                  />
                  <Button onClick={resolveTicket} disabled={!reply.trim()}>
                    <Send className="h-3 w-3" /> Envoyer & résoudre
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
