import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useCategory } from "@/lib/category";
import { formatDate } from "@/lib/labels";
import { groups, groupById, matches, teamName, venueById, venues } from "@/data/mock";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/jadwal")({
  head: () => ({
    meta: [
      { title: "Jadwal Pertandingan Futsal — PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Jadwal lengkap pertandingan futsal putra dan putri PORPROV Sulawesi Selatan 2026 per tanggal, grup, dan venue.",
      },
      { property: "og:title", content: "Jadwal Pertandingan Futsal — PORPROV Sulsel 2026" },
      {
        property: "og:description",
        content: "Jadwal futsal PORPROV Sulsel 2026 lengkap dengan waktu, venue, dan grup.",
      },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const { category } = useCategory();
  const [groupId, setGroupId] = useState("ALL");
  const [venueId, setVenueId] = useState("ALL");

  const grouped = useMemo(() => {
    const list = matches
      .filter((m) => m.category === category)
      .filter((m) => groupId === "ALL" || m.groupId === groupId)
      .filter((m) => venueId === "ALL" || m.venueId === venueId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));
    const map = new Map<string, typeof list>();
    for (const m of list) {
      map.set(m.date, [...(map.get(m.date) ?? []), m]);
    }
    return [...map.entries()];
  }, [category, groupId, venueId]);

  return (
    <PublicLayout>
      <PageHeader
        title={`Jadwal Futsal ${category}`}
        description="Jadwal dapat berubah sewaktu-waktu sesuai keputusan panitia pertandingan."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua grup" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua grup</SelectItem>
            {groups
              .filter((g) => g.category === category)
              .map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={venueId} onValueChange={setVenueId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Semua venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua venue</SelectItem>
            {venues.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!grouped.length && <EmptyState title="Tidak ada pertandingan" description="Coba ubah filter." />}

      <div className="space-y-6">
        {grouped.map(([date, list]) => (
          <section key={date}>
            <h2 className="label-caps mb-2 text-primary">{formatDate(date)}</h2>
            <div className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
              {list.map((m) => (
                <Link
                  key={m.id}
                  to="/hasil/$matchId"
                  params={{ matchId: m.id }}
                  className="grid gap-2 p-3 text-sm hover:bg-accent sm:grid-cols-[80px_1fr_auto] sm:items-center"
                >
                  <span className="font-display text-lg font-bold">{m.kickoff}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {teamName(m.homeTeamId)} <span className="text-muted-foreground">vs</span>{" "}
                      {teamName(m.awayTeamId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {groupById(m.groupId)?.name} · {venueById(m.venueId)?.name} · Wasit {m.referee}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PublicLayout>
  );
}
