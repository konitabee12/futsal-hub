import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatCard } from "@/components/PageHeader";
import { useCategory } from "@/lib/category";
import { groups, teams } from "@/data/mock";

export const Route = createFileRoute("/admin/kompetisi")({
  head: () => ({
    meta: [
      { title: "Kategori & Grup — Konsol Futsal PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Kelola kategori pertandingan dan pembagian grup babak penyisihan futsal PORPROV Sulsel 2026.",
      },
      { property: "og:title", content: "Kategori & Grup — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Struktur kategori dan grup kompetisi futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCompetition,
});

const STAGE_LABEL: Record<string, string> = {
  GROUP_STAGE: "Babak Grup",
  QUARTER_FINAL: "Perempat Final",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "Perebutan Juara 3",
  FINAL: "Final",
};

function AdminCompetition() {
  const { category } = useCategory();
  const categoryGroups = groups.filter((g) => g.category === category);
  const categoryTeams = teams.filter((t) => t.category === category);

  return (
    <AdminPage
      title="Kategori & Grup"
      description="Struktur kompetisi futsal: kategori putra/putri, babak, dan pembagian grup peserta."
      permission="competition.view"
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Kategori Aktif" value={category} hint="Ubah melalui pengalih kategori" />
        <StatCard label="Jumlah Grup" value={categoryGroups.length} hint="Babak penyisihan" />
        <StatCard label="Tim Terdaftar" value={categoryTeams.length} hint={`Kategori ${category}`} />
      </div>

      <DataTable columns={["Grup", "Babak", "Jumlah Tim", "Tim Anggota"]}>
        {categoryGroups.map((group) => {
          const members = categoryTeams.filter((t) => t.groupId === group.id);
          return (
            <Row key={group.id}>
              <Cell className="font-medium">{group.name}</Cell>
              <Cell>{STAGE_LABEL[group.stage] ?? group.stage}</Cell>
              <Cell>{members.length}</Cell>
              <Cell className="text-xs text-muted-foreground">
                {members.map((m) => m.name).join(", ") || "Belum ada tim"}
              </Cell>
            </Row>
          );
        })}
      </DataTable>
    </AdminPage>
  );
}
