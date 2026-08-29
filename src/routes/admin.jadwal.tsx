import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useCategory } from "@/lib/category";
import { formatDate } from "@/lib/labels";
import { groupById, groups, matches, teamName, venueById, venues } from "@/data/mock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/jadwal")({
  head: () => ({
    meta: [
      { title: "Manajemen Jadwal — Konsol Futsal PORPROV Sulsel 2026" },
      {
        name: "description",
        content: "Kelola dan tinjau jadwal pertandingan futsal PORPROV Sulsel 2026 per tanggal, grup, dan venue.",
      },
      { property: "og:title", content: "Manajemen Jadwal — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Jadwal pertandingan futsal PORPROV Sulsel 2026 untuk operator kompetisi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSchedule,
});

function AdminSchedule() {
  const { category } = useCategory();
  const [groupId, setGroupId] = useState("ALL");
  const [venueId, setVenueId] = useState("ALL");

  const grouped = useMemo(() => {
    const list = matches
      .filter((m) => m.category === category)
      .filter((m) => groupId === "ALL" || m.groupId === groupId)
      .filter((m) => venueId === "ALL" || m.venueId === venueId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));
    const map = new Map<string, typeof list>();
    for (const m of list) map.set(m.date, [...(map.get(m.date) ?? []), m]);
    return [...map.entries()];
  }, [category, groupId, venueId]);

  return (
    <AdminPage
      title="Jadwal Pertandingan"
      description="Daftar fixture per tanggal. Perubahan jadwal tercatat pada audit log."
      permission="schedule.view"
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger className="w-48" aria-label="Filter grup">
            <SelectValue placeholder="Semua grup" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua grup</SelectItem>
            {groups
              .filter((g) => g.category === category)
              .map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select value={venueId} onValueChange={setVenueId}>
          <SelectTrigger className="w-56" aria-label="Filter venue">
            <SelectValue placeholder="Semua venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua venue</SelectItem>
            {venues.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 ? (
        <EmptyState title="Tidak ada pertandingan" description="Sesuaikan filter grup atau venue." />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, list]) => (
            <DataTable
              key={date}
              caption={formatDate(date)}
              columns={["Waktu", "Pertandingan", "Grup", "Venue", "Wasit", "Status"]}
            >
              {list.map((m) => (
                <Row key={m.id}>
                  <Cell className="font-mono text-xs">{m.kickoff}</Cell>
                  <Cell className="font-medium">
                    {teamName(m.homeTeamId)} vs {teamName(m.awayTeamId)}
                  </Cell>
                  <Cell>{groupById(m.groupId)?.name ?? "-"}</Cell>
                  <Cell>{venueById(m.venueId)?.name ?? "-"}</Cell>
                  <Cell className="text-xs">{m.referee}</Cell>
                  <Cell>
                    <StatusBadge status={m.status} />
                  </Cell>
                </Row>
              ))}
            </DataTable>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
