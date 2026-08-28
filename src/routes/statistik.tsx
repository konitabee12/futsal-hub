import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader } from "@/components/PageHeader";
import { useCategory } from "@/lib/category";
import { cardStats, computeStandings, teamName, topScorers } from "@/data/mock";

export const Route = createFileRoute("/statistik")({
  head: () => ({
    meta: [
      { title: "Statistik Futsal — PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Statistik futsal PORPROV Sulawesi Selatan 2026: daftar top skor, akumulasi kartu, dan performa tim putra & putri.",
      },
      { property: "og:title", content: "Statistik Futsal — PORPROV Sulsel 2026" },
      {
        property: "og:description",
        content: "Top skor, kartu, dan peringkat performa tim futsal PORPROV Sulsel 2026.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { category } = useCategory();
  const scorers = topScorers(category, 12);
  const cards = cardStats(category, 12);
  const standings = computeStandings(category);
  const teamRows = Object.values(standings)
    .flat()
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);

  return (
    <PublicLayout>
      <PageHeader
        title={`Statistik Futsal ${category}`}
        description="Statistik dihitung dari kejadian pertandingan yang tercatat oleh operator."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-md border border-border bg-card">
          <p className="label-caps border-b border-border bg-muted px-3 py-2">Top Skor</p>
          <table className="w-full text-sm">
            <tbody>
              {scorers.map((s, i) => (
                <tr key={`${s.teamId}-${s.playerName}`} className="border-b border-border last:border-0">
                  <td className="w-10 px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{s.playerName}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{teamName(s.teamId)}</td>
                  <td className="px-3 py-2 text-right font-bold text-primary">{s.goals}</td>
                </tr>
              ))}
              {!scorers.length && (
                <tr>
                  <td className="p-4 text-sm text-muted-foreground">Belum ada data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-md border border-border bg-card">
          <p className="label-caps border-b border-border bg-muted px-3 py-2">Akumulasi Kartu</p>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left">Pemain</th>
                <th className="px-3 py-2">Kuning</th>
                <th className="px-3 py-2">Merah</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={`${c.teamId}-${c.playerName}`} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <p className="font-medium">{c.playerName}</p>
                    <p className="text-xs text-muted-foreground">{teamName(c.teamId)}</p>
                  </td>
                  <td className="px-3 py-2 text-center font-semibold">{c.yellow}</td>
                  <td className="px-3 py-2 text-center font-semibold">{c.red}</td>
                </tr>
              ))}
              {!cards.length && (
                <tr>
                  <td className="p-4 text-sm text-muted-foreground">Belum ada data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="overflow-x-auto rounded-md border border-border bg-card lg:col-span-2">
          <p className="label-caps border-b border-border bg-muted px-3 py-2">Performa Tim</p>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left">Tim</th>
                <th className="px-2 py-2">Main</th>
                <th className="px-2 py-2">Menang</th>
                <th className="px-2 py-2">Seri</th>
                <th className="px-2 py-2">Kalah</th>
                <th className="px-2 py-2">Gol Masuk</th>
                <th className="px-2 py-2">Gol Kemasukan</th>
                <th className="px-3 py-2">Poin</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map((r) => (
                <tr key={r.teamId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{teamName(r.teamId)}</td>
                  <td className="px-2 py-2 text-center">{r.played}</td>
                  <td className="px-2 py-2 text-center">{r.won}</td>
                  <td className="px-2 py-2 text-center">{r.draw}</td>
                  <td className="px-2 py-2 text-center">{r.lost}</td>
                  <td className="px-2 py-2 text-center">{r.goalsFor}</td>
                  <td className="px-2 py-2 text-center">{r.goalsAgainst}</td>
                  <td className="px-3 py-2 text-center font-bold text-primary">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </PublicLayout>
  );
}
