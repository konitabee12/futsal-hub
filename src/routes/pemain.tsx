import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader } from "@/components/PageHeader";
import { useCategory } from "@/lib/category";
import { players, teamById, teams } from "@/data/mock";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/pemain")({
  head: () => ({
    meta: [
      { title: "Daftar Pemain Futsal — PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Direktori pemain futsal putra dan putri yang eligible pada PORPROV Sulawesi Selatan 2026 beserta tim dan posisinya.",
      },
      { property: "og:title", content: "Daftar Pemain Futsal — PORPROV Sulsel 2026" },
      {
        property: "og:description",
        content: "Pemain eligible futsal PORPROV Sulsel 2026 lengkap dengan nomor punggung dan posisi.",
      },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const { category } = useCategory();
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("ALL");

  const categoryTeams = teams.filter((t) => t.category === category);
  const list = useMemo(
    () =>
      players.filter((p) => {
        const team = teamById(p.teamId);
        if (!team || team.category !== category) return false;
        if (p.eligibility !== "ELIGIBLE") return false;
        if (teamId !== "ALL" && p.teamId !== teamId) return false;
        return p.name.toLowerCase().includes(q.toLowerCase());
      }),
    [category, q, teamId],
  );

  return (
    <PublicLayout>
      <PageHeader
        title={`Pemain Futsal ${category}`}
        description="Hanya pemain berstatus eligible yang ditampilkan pada halaman publik."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Cari nama pemain..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Semua tim" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua tim</SelectItem>
            {categoryTeams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Link
            key={p.id}
            to="/pemain/$playerId"
            params={{ playerId: p.id }}
            className="flex items-center gap-3 rounded-md border border-border bg-card p-3 transition-shadow hover:shadow-md"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded bg-primary font-display font-bold text-primary-foreground">
              {p.number}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {teamById(p.teamId)?.name} · {p.position}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {!list.length && (
        <p className="py-10 text-center text-sm text-muted-foreground">Pemain tidak ditemukan.</p>
      )}
    </PublicLayout>
  );
}
