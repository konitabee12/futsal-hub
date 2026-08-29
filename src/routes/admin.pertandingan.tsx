import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EmptyState, StatCard } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useCategory } from "@/lib/category";
import { EVENT_LABEL, formatShortDate } from "@/lib/labels";
import { groupById, matches, teamName, teamShort, venueById } from "@/data/mock";

export const Route = createFileRoute("/admin/pertandingan")({
  head: () => ({
    meta: [
      { title: "Match Center — Konsol Futsal PORPROV Sulsel 2026" },
      {
        name: "description",
        content: "Pusat kendali pertandingan futsal PORPROV Sulsel 2026: pertandingan berjalan, skor, dan kejadian.",
      },
      { property: "og:title", content: "Match Center — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Operasional pertandingan futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMatchCenter,
});

function AdminMatchCenter() {
  const { category } = useCategory();
  const list = useMemo(
    () =>
      matches
        .filter((m) => m.category === category)
        .sort((a, b) => {
          const rank = (s: string) => (s === "LIVE" ? 0 : s === "SCHEDULED" ? 1 : 2);
          return rank(a.status) - rank(b.status) || a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff);
        }),
    [category],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = list.find((m) => m.id === selectedId) ?? list[0];

  const liveCount = list.filter((m) => m.status === "LIVE").length;
  const scheduledCount = list.filter((m) => m.status === "SCHEDULED").length;
  const finishedCount = list.filter((m) => m.status === "FINISHED").length;

  return (
    <AdminPage
      title="Match Center"
      description="Pantau pertandingan berjalan dan berikutnya, lengkap dengan linimasa kejadian."
      permission="match.view"
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Berlangsung" value={liveCount} />
        <StatCard label="Terjadwal" value={scheduledCount} />
        <StatCard label="Selesai" value={finishedCount} />
      </div>

      {list.length === 0 || !selected ? (
        <EmptyState title="Belum ada pertandingan" description={`Kategori ${category} belum memiliki fixture.`} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-md border border-border bg-card p-2">
            {list.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={
                  m.id === selected.id
                    ? "w-full rounded border border-primary bg-accent px-3 py-2 text-left"
                    : "w-full rounded border border-border px-3 py-2 text-left hover:bg-accent/50"
                }
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {teamShort(m.homeTeamId)} vs {teamShort(m.awayTeamId)}
                  </span>
                  <StatusBadge status={m.status} />
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatShortDate(m.date)} · {m.kickoff} · {venueById(m.venueId)?.name ?? "-"}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <p className="label-caps text-muted-foreground">
              {groupById(selected.groupId)?.name ?? "-"} · {formatShortDate(selected.date)} · {selected.kickoff}
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="flex-1 text-right font-display text-lg font-bold">{teamName(selected.homeTeamId)}</p>
              <p className="font-display text-4xl font-bold">
                {selected.homeScore ?? "-"} : {selected.awayScore ?? "-"}
              </p>
              <p className="flex-1 font-display text-lg font-bold">{teamName(selected.awayTeamId)}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <StatusBadge status={selected.status} />
              <StatusBadge status={selected.resultStatus} />
              <span className="text-xs text-muted-foreground">Wasit: {selected.referee}</span>
            </div>

            <h2 className="label-caps mt-6 border-t border-border pt-4 text-muted-foreground">Linimasa Kejadian</h2>
            {selected.events.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada kejadian tercatat.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {selected.events.map((ev, index) => (
                  <li key={`${ev.minute}-${ev.type}-${index}`} className="flex items-start gap-3 text-sm">
                    <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">{ev.minute}</span>
                    <span className="font-medium">{EVENT_LABEL[ev.type]}</span>
                    <span className="text-muted-foreground">
                      {teamShort(ev.teamId)} · {ev.playerName}
                      {ev.detail ? ` · ${ev.detail}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AdminPage>
  );
}
