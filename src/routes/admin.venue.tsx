import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatCard } from "@/components/PageHeader";
import { matches, venues } from "@/data/mock";

export const Route = createFileRoute("/admin/venue")({
  head: () => ({
    meta: [
      { title: "Manajemen Venue — Konsol Futsal PORPROV Sulsel 2026" },
      {
        name: "description",
        content: "Daftar venue dan lapangan pertandingan futsal PORPROV Sulsel 2026 beserta beban jadwalnya.",
      },
      { property: "og:title", content: "Manajemen Venue — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Venue pertandingan futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVenues,
});

function AdminVenues() {
  const totalCourts = venues.reduce((sum, v) => sum + v.courts, 0);
  const totalCapacity = venues.reduce((sum, v) => sum + v.capacity, 0);

  return (
    <AdminPage
      title="Venue"
      description="Venue resmi pertandingan futsal beserta kapasitas, jumlah lapangan, dan beban jadwal."
      permission="venue.view"
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Venue" value={venues.length} />
        <StatCard label="Total Lapangan" value={totalCourts} />
        <StatCard label="Total Kapasitas" value={totalCapacity.toLocaleString("id-ID")} hint="Penonton" />
      </div>

      <DataTable columns={["Venue", "Kota", "Kapasitas", "Lapangan", "Pertandingan Terjadwal"]}>
        {venues.map((venue) => (
          <Row key={venue.id}>
            <Cell className="font-medium">{venue.name}</Cell>
            <Cell>{venue.city}</Cell>
            <Cell>{venue.capacity.toLocaleString("id-ID")}</Cell>
            <Cell>{venue.courts}</Cell>
            <Cell>{matches.filter((m) => m.venueId === venue.id).length}</Cell>
          </Row>
        ))}
      </DataTable>
    </AdminPage>
  );
}
