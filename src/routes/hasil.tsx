import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { useCategory } from "@/lib/category";
import { formatDate } from "@/lib/labels";
import { groupById, matches, teamName, venueById } from "@/data/mock";

export const Route = createFileRoute("/hasil")({
  head: () => ({
    meta: [
      { title: "Hasil Pertandingan Futsal — PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Hasil resmi pertandingan futsal putra dan putri PORPROV Sulawesi Selatan 2026 yang telah diverifikasi dan dipublikasikan.",
      },
      { property: "og:title", content: "Hasil Pertandingan Futsal — PORPROV Sulsel 2026" },
      {
        property: "og:description",
        content: "Skor akhir dan detail pertandingan futsal PORPROV Sulsel 2026.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { category } = useCategory();
  const list = matches
    .filter((m) => m.category === category && m.resultStatus === "PUBLISHED")
    .sort((a, b) => b.date.localeCompare(a.date));

  const byDate = new Map<string, typeof list>();
  for (const m of list) byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]);

  return (
    <PublicLayout>
      <PageHeader
        title={`Hasil Futsal ${category}`}
        description="Hanya hasil yang telah diverifikasi dan dipublikasikan yang tampil di sini."
      />

      {!list.length && (
        <EmptyState title="Belum ada hasil" description="Hasil akan tampil setelah dipublikasikan." />
      )}

      <div className="space-y-6">
        {[...byDate.entries()].map(([date, items]) => (
          <section key={date}>
            <h2 className="label-caps mb-2 text-primary">{formatDate(date)}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((m) => (
                <Link
                  key={m.id}
                  to="/hasil/$matchId"
                  params={{ matchId: m.id }}
                  className="rounded-md border border-border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <p className="label-caps text-muted-foreground">
                    {groupById(m.groupId)?.name} · {venueById(m.venueId)?.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate font-semibold">{teamName(m.homeTeamId)}</span>
                    <span className="font-display text-2xl font-bold">
                      {m.homeScore} - {m.awayScore}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right font-semibold">
                      {teamName(m.awayTeamId)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PublicLayout>
  );
}
