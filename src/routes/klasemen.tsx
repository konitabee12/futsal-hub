import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader } from "@/components/PageHeader";
import { useCategory } from "@/lib/category";
import { computeStandings, groupById, teamName } from "@/data/mock";

export const Route = createFileRoute("/klasemen")({
  head: () => ({
    meta: [
      { title: "Klasemen Futsal — PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Klasemen sementara babak grup futsal putra dan putri PORPROV Sulawesi Selatan 2026, dihitung otomatis dari hasil resmi.",
      },
      { property: "og:title", content: "Klasemen Futsal — PORPROV Sulsel 2026" },
      {
        property: "og:description",
        content: "Poin, selisih gol, dan peringkat tim futsal PORPROV Sulsel 2026.",
      },
    ],
  }),
  component: StandingsPage,
});

export function StandingsTable({ groupId }: { groupId: string }) {
  const group = groupById(groupId)!;
  const rows = computeStandings(group.category, groupId)[groupId] ?? [];
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <p className="label-caps border-b border-border bg-muted px-3 py-2">{group.name}</p>
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Tim</th>
            <th className="px-2 py-2">Main</th>
            <th className="px-2 py-2">M</th>
            <th className="px-2 py-2">S</th>
            <th className="px-2 py-2">K</th>
            <th className="px-2 py-2">GM</th>
            <th className="px-2 py-2">GK</th>
            <th className="px-2 py-2">SG</th>
            <th className="px-3 py-2">Poin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.teamId} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-2 font-medium">{teamName(r.teamId)}</td>
              <td className="px-2 py-2 text-center">{r.played}</td>
              <td className="px-2 py-2 text-center">{r.won}</td>
              <td className="px-2 py-2 text-center">{r.draw}</td>
              <td className="px-2 py-2 text-center">{r.lost}</td>
              <td className="px-2 py-2 text-center">{r.goalsFor}</td>
              <td className="px-2 py-2 text-center">{r.goalsAgainst}</td>
              <td className="px-2 py-2 text-center">{r.goalDifference}</td>
              <td className="px-3 py-2 text-center font-bold text-primary">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StandingsPage() {
  const { category } = useCategory();
  const standings = computeStandings(category);

  return (
    <PublicLayout>
      <PageHeader
        title={`Klasemen Futsal ${category}`}
        description="Dihitung dari hasil pertandingan yang telah diverifikasi. Aturan tie-breaker mengikuti regulasi resmi."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.keys(standings).map((gid) => (
          <StandingsTable key={gid} groupId={gid} />
        ))}
      </div>
    </PublicLayout>
  );
}
