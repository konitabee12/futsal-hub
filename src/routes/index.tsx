import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useCategory } from "@/lib/category";
import { formatShortDate } from "@/lib/labels";
import {
  computeStandings, groupById, matches, teamName, teamShort, topScorers, venueById,
  announcements, EVENT_NAME,
} from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PORPROV Sulsel 2026 Futsal — Beranda Resmi" },
      {
        name: "description",
        content:
          "Pusat informasi futsal PORPROV Sulsel 2026: pertandingan langsung, jadwal terdekat, hasil terbaru, klasemen, dan top skor putra & putri.",
      },
      { property: "og:title", content: "PORPROV Sulsel 2026 Futsal — Beranda Resmi" },
      {
        property: "og:description",
        content: "Jadwal, hasil, klasemen, dan statistik futsal PORPROV Sulawesi Selatan 2026.",
      },
    ],
  }),
  component: HomePage,
});

function SectionTitle({ title, to, linkLabel }: { title: string; to?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between border-b border-border pb-2">
      <h2 className="font-display text-xl font-bold uppercase">{title}</h2>
      {to && (
        <Link to={to} className="text-xs font-semibold text-primary hover:underline">
          {linkLabel ?? "Lihat semua"}
        </Link>
      )}
    </div>
  );
}

function HomePage() {
  const { category } = useCategory();
  const list = matches.filter((m) => m.category === category);
  const live = list.filter((m) => m.status === "LIVE");
  const next = list.filter((m) => m.status === "SCHEDULED").slice(0, 5);
  const latest = list
    .filter((m) => m.status === "FINISHED" && m.resultStatus === "PUBLISHED")
    .slice(-5)
    .reverse();
  const standings = computeStandings(category);
  const scorers = topScorers(category, 5);

  return (
    <PublicLayout>
      <section className="mb-10 overflow-hidden rounded-lg bg-secondary text-secondary-foreground">
        <div className="grid gap-6 px-6 py-10 md:grid-cols-[2fr_1fr] md:px-10">
          <div>
            <p className="label-caps text-gold">Cabang Olahraga Futsal</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight uppercase md:text-5xl">
              {EVENT_NAME}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-secondary-foreground/80">
              Sumber informasi resmi kompetisi futsal putra dan putri: jadwal pertandingan,
              hasil, klasemen otomatis, serta statistik pemain dan tim.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/jadwal"
                className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Lihat Jadwal
              </Link>
              <Link
                to="/klasemen"
                className="rounded border border-secondary-foreground/30 px-4 py-2 text-sm font-semibold hover:bg-secondary-foreground/10"
              >
                Klasemen
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            {[
              ["Kategori", "2"],
              ["Tim", String(list.length ? 8 : 8)],
              ["Pertandingan", String(list.length)],
              ["Venue", "3"],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-secondary-foreground/20 p-3">
                <p className="label-caps text-secondary-foreground/60">{label}</p>
                <p className="font-display text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {live.length > 0 && (
        <section className="mb-10">
          <SectionTitle title="Sedang Berlangsung" />
          <div className="grid gap-3 md:grid-cols-2">
            {live.map((m) => (
              <Link
                key={m.id}
                to="/hasil/$matchId"
                params={{ matchId: m.id }}
                className="flex items-center justify-between rounded-md border-l-4 border-primary bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0">
                  <StatusBadge status="LIVE" />
                  <p className="mt-2 truncate font-semibold">{teamName(m.homeTeamId)}</p>
                  <p className="truncate font-semibold">{teamName(m.awayTeamId)}</p>
                </div>
                <div className="ml-4 text-right">
                  <p className="font-display text-3xl font-bold">
                    {m.homeScore} - {m.awayScore}
                  </p>
                  <p className="text-xs text-muted-foreground">{venueById(m.venueId)?.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <SectionTitle title="Pertandingan Berikutnya" to="/jadwal" />
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {next.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {teamShort(m.homeTeamId)} vs {teamShort(m.awayTeamId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(m.date)} · {m.kickoff} · {venueById(m.venueId)?.name}
                  </p>
                </div>
                <span className="label-caps text-muted-foreground">
                  {groupById(m.groupId)?.name}
                </span>
              </div>
            ))}
            {!next.length && <p className="p-4 text-sm text-muted-foreground">Belum ada jadwal.</p>}
          </div>
        </section>

        <section>
          <SectionTitle title="Hasil Terbaru" to="/hasil" />
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {latest.map((m) => (
              <Link
                key={m.id}
                to="/hasil/$matchId"
                params={{ matchId: m.id }}
                className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {teamShort(m.homeTeamId)} vs {teamShort(m.awayTeamId)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatShortDate(m.date)}</p>
                </div>
                <span className="font-display text-xl font-bold">
                  {m.homeScore} - {m.awayScore}
                </span>
              </Link>
            ))}
            {!latest.length && <p className="p-4 text-sm text-muted-foreground">Belum ada hasil.</p>}
          </div>
        </section>

        <section>
          <SectionTitle title="Klasemen" to="/klasemen" />
          <div className="space-y-4">
            {Object.entries(standings).map(([gid, rows]) => (
              <div key={gid} className="overflow-hidden rounded-md border border-border bg-card">
                <p className="label-caps border-b border-border bg-muted px-3 py-2">
                  {groupById(gid)?.name}
                </p>
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-1.5 text-left">Tim</th>
                      <th className="px-2 py-1.5">M</th>
                      <th className="px-2 py-1.5">SG</th>
                      <th className="px-3 py-1.5">Poin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 4).map((r) => (
                      <tr key={r.teamId} className="border-t border-border">
                        <td className="px-3 py-1.5">{teamName(r.teamId)}</td>
                        <td className="px-2 py-1.5 text-center">{r.played}</td>
                        <td className="px-2 py-1.5 text-center">{r.goalDifference}</td>
                        <td className="px-3 py-1.5 text-center font-bold">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="Top Skor" to="/statistik" />
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {scorers.map((s, i) => (
              <div key={`${s.teamId}-${s.playerName}`} className="flex items-center gap-3 p-3 text-sm">
                <span className="grid size-7 place-items-center rounded bg-muted font-bold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.playerName}</p>
                  <p className="text-xs text-muted-foreground">{teamName(s.teamId)}</p>
                </div>
                <span className="font-display text-xl font-bold text-primary">{s.goals}</span>
              </div>
            ))}
            {!scorers.length && (
              <p className="p-4 text-sm text-muted-foreground">Belum ada data gol.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <SectionTitle title="Pengumuman" to="/pengumuman" />
        <div className="grid gap-3 md:grid-cols-3">
          {announcements.map((a) => (
            <Link
              key={a.id}
              to="/pengumuman/$announcementId"
              params={{ announcementId: a.id }}
              className="rounded-md border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <p className="label-caps text-primary">{formatShortDate(a.date)}</p>
              <p className="mt-1 font-semibold">{a.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
