import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { EmptyState, StatCard } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useCategory } from "@/lib/category";
import { useRbac } from "@/lib/rbac";
import { formatShortDate } from "@/lib/labels";
import { groupById, matches, teamName } from "@/data/mock";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/hasil")({
  head: () => ({
    meta: [
      { title: "Manajemen Hasil — Konsol Futsal PORPROV Sulsel 2026" },
      {
        name: "description",
        content: "Tinjau, verifikasi, dan publikasikan hasil pertandingan futsal PORPROV Sulsel 2026.",
      },
      { property: "og:title", content: "Manajemen Hasil — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Hasil pertandingan futsal PORPROV Sulsel 2026 dan status verifikasinya." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminResults,
});

function AdminResults() {
  const { category } = useCategory();
  const { can } = useRbac();
  const list = matches
    .filter((m) => m.category === category && m.status !== "SCHEDULED")
    .sort((a, b) => b.date.localeCompare(a.date) || b.kickoff.localeCompare(a.kickoff));

  const submitted = list.filter((m) => m.resultStatus === "SUBMITTED").length;
  const published = list.filter((m) => m.resultStatus === "PUBLISHED").length;

  return (
    <AdminPage
      title="Hasil Pertandingan"
      description="Hasil yang dikirim operator pertandingan menunggu verifikasi sebelum dipublikasikan."
      permission="result.view"
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Hasil" value={list.length} hint={`Kategori ${category}`} />
        <StatCard label="Menunggu Verifikasi" value={submitted} />
        <StatCard label="Dipublikasikan" value={published} />
      </div>

      {list.length === 0 ? (
        <EmptyState title="Belum ada hasil" description="Hasil muncul setelah pertandingan dimulai." />
      ) : (
        <DataTable columns={["Tanggal", "Pertandingan", "Grup", "Skor", "Status", "Hasil", "Aksi"]}>
          {list.map((m) => (
            <Row key={m.id}>
              <Cell className="text-xs">{formatShortDate(m.date)}</Cell>
              <Cell className="font-medium">
                {teamName(m.homeTeamId)} vs {teamName(m.awayTeamId)}
              </Cell>
              <Cell>{groupById(m.groupId)?.name ?? "-"}</Cell>
              <Cell className="font-mono font-semibold">
                {m.homeScore ?? "-"} : {m.awayScore ?? "-"}
              </Cell>
              <Cell>
                <StatusBadge status={m.status} />
              </Cell>
              <Cell>
                <StatusBadge status={m.resultStatus} />
              </Cell>
              <Cell>
                {can("result.verify") && m.resultStatus === "SUBMITTED" ? (
                  <Button size="sm" variant="outline">
                    Verifikasi
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </AdminPage>
  );
}
