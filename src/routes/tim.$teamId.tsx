import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader } from "@/components/PageHeader";
import { formatShortDate } from "@/lib/labels";
import {
  contingentById, groupById, matches, officials, players, teamById, teamShort, venueById,
} from "@/data/mock";
import { POSITION_LABEL } from "@/lib/labels";

export const Route = createFileRoute("/tim/$teamId")({
  loader: ({ params }) => {
    const team = teamById(params.teamId);
    if (!team) throw notFound();
    return { teamName: team.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.teamName} — Futsal PORPROV Sulsel 2026` : "Tim tidak ditemukan" },
      {
        name: "description",
        content: loaderData
          ? `Profil tim ${loaderData.teamName}: skuad, official, dan jadwal pertandingan pada futsal PORPROV Sulsel 2026.`
          : "Tim yang diminta tidak tersedia.",
      },
      ...(loaderData
        ? [
            { property: "og:title", content: `${loaderData.teamName} — Futsal PORPROV Sulsel 2026` },
            { property: "og:description", content: `Skuad dan jadwal ${loaderData.teamName}.` },
          ]
        : [{ name: "robots", content: "noindex" }]),
    ],
  }),
  errorComponent: () => <PublicLayout>Tim tidak dapat dimuat.</PublicLayout>,
  notFoundComponent: () => <PublicLayout>Tim tidak ditemukan.</PublicLayout>,
  component: TeamDetail,
});

function TeamDetail() {
  const { teamId } = Route.useParams();
  const team = teamById(teamId)!;
  const squad = players.filter((p) => p.teamId === teamId && p.eligibility === "ELIGIBLE");
  const staff = officials.filter((o) => o.teamId === teamId && o.eligibility === "ELIGIBLE");
  const fixtures = matches.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId);

  return (
    <PublicLayout>
      <PageHeader
        title={team.name}
        description={`${contingentById(team.contingentId)?.name} · ${groupById(team.groupId)?.name}`}
      />

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold uppercase">Skuad</h2>
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">No</th>
                  <th className="px-3 py-2 text-left">Nama</th>
                  <th className="px-3 py-2 text-left">Posisi</th>
                </tr>
              </thead>
              <tbody>
                {squad.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-2 font-bold">{p.number}</td>
                    <td className="px-3 py-2">
                      <Link
                        to="/pemain/$playerId"
                        params={{ playerId: p.id }}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{p.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Hanya pemain berstatus eligible yang ditampilkan. Data identitas dan kontak tidak dipublikasikan.
          </p>
        </section>

        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-display text-lg font-bold uppercase">Official</h2>
            <div className="divide-y divide-border rounded-md border border-border bg-card">
              {staff.map((o) => (
                <div key={o.id} className="p-3 text-sm">
                  <p className="font-medium">{o.name}</p>
                  <p className="text-xs text-muted-foreground">{POSITION_LABEL[o.position]}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-bold uppercase">Pertandingan</h2>
            <div className="divide-y divide-border rounded-md border border-border bg-card">
              {fixtures.map((m) => (
                <Link
                  key={m.id}
                  to="/hasil/$matchId"
                  params={{ matchId: m.id }}
                  className="block p-3 text-sm hover:bg-accent"
                >
                  <p className="font-medium">
                    {teamShort(m.homeTeamId)} vs {teamShort(m.awayTeamId)}
                    {m.homeScore !== null && (
                      <span className="ml-2 font-bold">
                        {m.homeScore} - {m.awayScore}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(m.date)} · {m.kickoff} · {venueById(m.venueId)?.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
