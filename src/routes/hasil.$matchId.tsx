import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { EVENT_LABEL, formatDate } from "@/lib/labels";
import { groupById, matchById, players, teamName, teamShort, venueById } from "@/data/mock";

export const Route = createFileRoute("/hasil/$matchId")({
  loader: ({ params }) => {
    const match = matchById(params.matchId);
    if (!match) throw notFound();
    return { title: `${teamName(match.homeTeamId)} vs ${teamName(match.awayTeamId)}` };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — Futsal PORPROV Sulsel 2026` : "Pertandingan tidak ditemukan" },
      {
        name: "description",
        content: loaderData
          ? `Detail pertandingan ${loaderData.title}: skor, lineup, linimasa kejadian, dan statistik.`
          : "Detail pertandingan tidak tersedia.",
      },
      ...(loaderData
        ? [
            { property: "og:title", content: `${loaderData.title} — Futsal PORPROV Sulsel 2026` },
            { property: "og:description", content: `Skor dan jalannya pertandingan ${loaderData.title}.` },
          ]
        : [{ name: "robots", content: "noindex" }]),
    ],
  }),
  errorComponent: () => <PublicLayout>Pertandingan tidak dapat dimuat.</PublicLayout>,
  notFoundComponent: () => <PublicLayout>Pertandingan tidak ditemukan.</PublicLayout>,
  component: MatchDetail,
});

function Lineup({ teamId }: { teamId: string }) {
  const squad = players.filter((p) => p.teamId === teamId && p.eligibility === "ELIGIBLE").slice(0, 10);
  return (
    <div className="rounded-md border border-border bg-card">
      <p className="label-caps border-b border-border bg-muted px-3 py-2">{teamName(teamId)}</p>
      <ul className="divide-y divide-border text-sm">
        {squad.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-2">
            <span className="w-6 font-bold">{p.number}</span>
            <Link to="/pemain/$playerId" params={{ playerId: p.id }} className="flex-1 truncate hover:underline">
              {p.name}
            </Link>
            <span className="text-xs text-muted-foreground">{i < 5 ? "Starter" : "Cadangan"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MatchDetail() {
  const { matchId } = Route.useParams();
  const match = matchById(matchId)!;
  const venue = venueById(match.venueId);
  const published = match.resultStatus === "PUBLISHED" || match.status === "LIVE";

  return (
    <PublicLayout>
      <div className="rounded-lg bg-secondary p-6 text-secondary-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label-caps text-gold">
            {match.category} · {groupById(match.groupId)?.name}
          </p>
          <StatusBadge status={match.status} />
        </div>
        <div className="mt-6 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <p className="text-center font-display text-2xl font-bold sm:text-right">
            {teamName(match.homeTeamId)}
          </p>
          <p className="text-center font-display text-5xl font-extrabold">
            {published && match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : "vs"}
          </p>
          <p className="text-center font-display text-2xl font-bold sm:text-left">
            {teamName(match.awayTeamId)}
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-secondary-foreground/80">
          {formatDate(match.date)} · {match.kickoff} WITA · {venue?.name}, {venue?.city} · Wasit {match.referee}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold uppercase">Linimasa Pertandingan</h2>
          {match.events.length ? (
            <ol className="divide-y divide-border rounded-md border border-border bg-card">
              {match.events.map((e) => (
                <li key={e.id} className="flex items-start gap-3 p-3 text-sm">
                  <span className="w-14 shrink-0 font-display font-bold text-primary">{e.minute}</span>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {EVENT_LABEL[e.type]} · {teamShort(e.teamId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.playerName}
                      {e.detail ? ` — ${e.detail}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Belum ada kejadian yang tercatat.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold uppercase">Daftar Pemain</h2>
          <div className="grid gap-4">
            <Lineup teamId={match.homeTeamId} />
            <Lineup teamId={match.awayTeamId} />
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
