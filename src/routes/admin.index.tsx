import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatCard } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  contingents, matches, players, teams, verificationCases, teamName, notifications,
} from "@/data/mock";
import { formatShortDate } from "@/lib/labels";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Konsol Admin — Futsal PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Ringkasan operasional cabang olahraga futsal PORPROV Sulsel 2026: registrasi, verifikasi, dan pertandingan.",
      },
      { property: "og:title", content: "Dashboard Konsol Admin — Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Ringkasan operasional futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const pending = verificationCases.length;
  const eligible = players.filter((p) => p.eligibility === "ELIGIBLE").length;
  const upcoming = matches
    .filter((m) => m.status === "SCHEDULED" || m.status === "LIVE")
    .slice(0, 6);

  return (
    <AdminPage
      title="Dashboard"
      description="Ringkasan status registrasi, verifikasi, dan operasional pertandingan."
      permission="dashboard.view"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Kontingen" value={contingents.length} hint="Terdaftar pada cabor futsal" />
        <StatCard label="Tim" value={teams.length} hint="Putra & Putri" />
        <StatCard label="Pemain Eligible" value={eligible} hint={`dari ${players.length} pemain`} />
        <StatCard label="Antrian Verifikasi" value={pending} hint="Menunggu keputusan verifikator" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section>
          <h2 className="label-caps mb-2 text-muted-foreground">Pertandingan Terdekat</h2>
          <DataTable columns={["Tanggal", "Waktu", "Pertandingan", "Status", ""]}>
            {upcoming.map((m) => (
              <Row key={m.id}>
                <Cell>{formatShortDate(m.date)}</Cell>
                <Cell>{m.kickoff}</Cell>
                <Cell className="font-medium">
                  {teamName(m.homeTeamId)} vs {teamName(m.awayTeamId)}
                </Cell>
                <Cell>
                  <StatusBadge status={m.status} />
                </Cell>
                <Cell>
                  <Link to="/admin/pertandingan" className="text-xs font-semibold text-primary hover:underline">
                    Buka
                  </Link>
                </Cell>
              </Row>
            ))}
          </DataTable>
        </section>

        <section>
          <h2 className="label-caps mb-2 text-muted-foreground">Notifikasi Terbaru</h2>
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {notifications.map((n) => (
              <li key={n.id} className="p-3">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{n.at}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminPage>
  );
}
