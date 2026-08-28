import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { groupById, playerById, playerStats, teamById } from "@/data/mock";

export const Route = createFileRoute("/pemain/$playerId")({
  loader: ({ params }) => {
    const player = playerById(params.playerId);
    if (!player || player.eligibility !== "ELIGIBLE") throw notFound();
    return { name: player.name, team: teamById(player.teamId)?.name ?? "" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — Profil Pemain Futsal PORPROV Sulsel 2026` : "Pemain tidak ditemukan" },
      {
        name: "description",
        content: loaderData
          ? `Profil publik ${loaderData.name} dari ${loaderData.team}: posisi, nomor punggung, gol, kartu, dan penampilan.`
          : "Profil pemain tidak tersedia.",
      },
      ...(loaderData
        ? [
            { property: "og:title", content: `${loaderData.name} — Futsal PORPROV Sulsel 2026` },
            { property: "og:description", content: `Statistik ${loaderData.name} di ${loaderData.team}.` },
          ]
        : [{ name: "robots", content: "noindex" }]),
    ],
  }),
  errorComponent: () => <PublicLayout>Profil tidak dapat dimuat.</PublicLayout>,
  notFoundComponent: () => <PublicLayout>Profil pemain tidak ditemukan.</PublicLayout>,
  component: PlayerDetail,
});

function PlayerDetail() {
  const { playerId } = Route.useParams();
  const player = playerById(playerId)!;
  const team = teamById(player.teamId)!;
  const stats = playerStats(playerId);

  return (
    <PublicLayout>
      <PageHeader title={player.name} description={`${team.name} · ${groupById(team.groupId)?.name}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded bg-primary font-display text-2xl font-bold text-primary-foreground">
              {player.number}
            </span>
            <div>
              <p className="label-caps text-muted-foreground">Posisi</p>
              <p className="font-display text-xl font-bold">{player.position}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Tim</dt>
              <dd>
                <Link to="/tim/$teamId" params={{ teamId: team.id }} className="font-medium hover:underline">
                  {team.name}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Kategori</dt>
              <dd className="font-medium">{team.category}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">Eligible</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Nomor identitas, alamat, dan kontak tidak ditampilkan pada halaman publik.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-4">
          <StatCard label="Gol" value={stats.goals} />
          <StatCard label="Penampilan" value={stats.appearances} />
          <StatCard label="Kartu Kuning" value={stats.yellow} />
          <StatCard label="Kartu Merah" value={stats.red} />
        </div>
      </div>
    </PublicLayout>
  );
}
