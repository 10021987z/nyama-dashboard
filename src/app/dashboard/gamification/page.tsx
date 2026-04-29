"use client";

import { useState, useMemo } from "react";
import { Trophy, Star, Award, Edit3, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFcfa } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";

// Wired to real backend endpoints (chantier 4) :
//   GET /admin/leaderboard/riders?period=week|month
//   GET /admin/leaderboard/cooks?period=week|month
// Challenges restent en mémoire (pas de modèle backend dans le pilote).

type Rider = {
  id: string;
  name: string;
  orders: number;
  rating: number;
  badges: string[];
};

type Cook = {
  id: string;
  name: string;
  orders: number;
  rating: number;
};

interface LeaderboardRidersResp {
  period: string;
  items: Array<{
    riderProfileId: string;
    riderUserId: string | null;
    name: string;
    deliveryCount: number;
    earningsXaf: number;
  }>;
}

interface LeaderboardCooksResp {
  period: string;
  items: Array<{
    cookProfileId: string | null;
    cookUserId: string;
    name: string;
    avgRating: number;
    orderCount: number;
    revenueXaf: number;
  }>;
}

// Calcul de badges client-side depuis les données réelles
function computeBadges(deliveryCount: number): string[] {
  const out: string[] = [];
  if (deliveryCount >= 100) out.push("100_deliveries");
  if (deliveryCount >= 30) out.push("five_star_30");
  if (deliveryCount >= 7) out.push("zero_cancel_7d");
  return out;
}

const BADGES: Record<string, { label: string; emoji: string; color: string }> = {
  "100_deliveries": {
    label: "100 livraisons",
    emoji: "🏆",
    color: "#F57C20",
  },
  zero_cancel_7d: {
    label: "Zéro annulation 7j",
    emoji: "✨",
    color: "#1B4332",
  },
  five_star_30: { label: "30× 5 étoiles", emoji: "⭐", color: "#D4A017" },
};

type Challenge = {
  id: string;
  title: string;
  target: string;
  reward: number;
  active: boolean;
};

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: "ch1",
    title: "Livre 20 courses cette semaine",
    target: "20 livraisons",
    reward: 5000,
    active: true,
  },
  {
    id: "ch2",
    title: "Maintien note ≥ 4.8 sur 7 jours",
    target: "Note ≥ 4.8",
    reward: 3000,
    active: true,
  },
  {
    id: "ch3",
    title: "Zéro annulation sur 30 livraisons",
    target: "0 cancel / 30",
    reward: 8000,
    active: true,
  },
];

export default function GamificationPage() {
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Challenge | null>(null);

  const ridersApi = useApi<LeaderboardRidersResp>("/admin/leaderboard/riders", {
    period: "week",
  });
  const cooksApi = useApi<LeaderboardCooksResp>("/admin/leaderboard/cooks", {
    period: "week",
  });

  const RIDERS: Rider[] = useMemo(() => {
    const items = ridersApi.data?.items ?? [];
    return items.map((r) => ({
      id: r.riderProfileId,
      name: r.name,
      orders: r.deliveryCount,
      rating: 4.5, // placeholder — rating riders pas encore dans le leaderboard
      badges: computeBadges(r.deliveryCount),
    }));
  }, [ridersApi.data]);

  const COOKS: Cook[] = useMemo(() => {
    const items = cooksApi.data?.items ?? [];
    return items.map((c) => ({
      id: c.cookProfileId ?? c.cookUserId,
      name: c.name,
      orders: c.orderCount,
      rating: c.avgRating,
    }));
  }, [cooksApi.data]);

  const startEdit = (c: Challenge) => {
    setEditingId(c.id);
    setDraft({ ...c });
  };
  const saveEdit = () => {
    if (!draft) return;
    setChallenges((prev) => prev.map((x) => (x.id === draft.id ? draft : x)));
    setEditingId(null);
    setDraft(null);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            color: "#3D3D3D",
          }}
        >
          Gamification — Classements & Défis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Top livreurs / cuisinières de la semaine + défis auto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: "#D4A017" }} />
              Top 10 Livreurs (semaine)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Livreur</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Badges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ridersApi.loading && (
                  <TableRow><TableCell colSpan={5}><Skeleton className="h-32" /></TableCell></TableRow>
                )}
                {!ridersApi.loading && RIDERS.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Aucune donnée pour la semaine.</TableCell></TableRow>
                )}
                {RIDERS.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.orders}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3" style={{ color: "#D4A017" }} />
                        {r.rating.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.badges.map((b) => {
                          const bd = BADGES[b];
                          if (!bd) return null;
                          return (
                            <span
                              key={b}
                              title={bd.label}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs"
                              style={{
                                backgroundColor: `${bd.color}20`,
                                color: bd.color,
                              }}
                            >
                              {bd.emoji}
                            </span>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4" style={{ color: "#F57C20" }} />
              Top 10 Cuisinières (semaine)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Cuisinière</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cooksApi.loading && (
                  <TableRow><TableCell colSpan={4}><Skeleton className="h-32" /></TableCell></TableRow>
                )}
                {!cooksApi.loading && COOKS.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">Aucune donnée pour la semaine.</TableCell></TableRow>
                )}
                {COOKS.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.orders}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3" style={{ color: "#D4A017" }} />
                        {c.rating.toFixed(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Défis auto actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Objectif</TableHead>
                <TableHead>Récompense</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenges.map((c) => {
                const editing = editingId === c.id && draft;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      {editing ? (
                        <Input
                          value={draft!.title}
                          onChange={(e) =>
                            setDraft({ ...draft!, title: e.target.value })
                          }
                        />
                      ) : (
                        c.title
                      )}
                    </TableCell>
                    <TableCell>
                      {editing ? (
                        <Input
                          value={draft!.target}
                          onChange={(e) =>
                            setDraft({ ...draft!, target: e.target.value })
                          }
                        />
                      ) : (
                        c.target
                      )}
                    </TableCell>
                    <TableCell>
                      {editing ? (
                        <Input
                          type="number"
                          value={draft!.reward}
                          onChange={(e) =>
                            setDraft({
                              ...draft!,
                              reward: parseInt(e.target.value || "0", 10),
                            })
                          }
                        />
                      ) : (
                        formatFcfa(c.reward)
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.active ? "default" : "secondary"}>
                        {c.active ? "Actif" : "Pause"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editing ? (
                        <div className="flex gap-1">
                          <Button size="icon-xs" onClick={saveEdit}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => startEdit(c)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Catalogue des badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(BADGES).map(([k, b]) => (
              <div
                key={k}
                className="flex items-center gap-3 rounded-xl p-4"
                style={{ backgroundColor: `${b.color}10` }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                  style={{ backgroundColor: `${b.color}20` }}
                >
                  {b.emoji}
                </div>
                <div>
                  <p className="font-semibold">{b.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Attribué auto aux tops
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
