import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { POSITION_LABEL } from "@/lib/labels";
import { useRealOfficials } from "@/queries/official-hooks";

export const Route = createFileRoute("/admin/official")({
  head: () => ({
    meta: [
      { title: "Manajemen Official â€” Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Kelola data official tim: manajer, pelatih, dan tenaga medis pada cabor futsal PORPROV Sulsel 2026." },
      { property: "og:title", content: "Manajemen Official â€” Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Daftar official tim futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOfficials,
});

function AdminOfficials() {
  const { data, isLoading, isError } = useRealOfficials();
  const officials = data ?? [];
  return (
    <AdminPage
      title="Official"
      description="Official tim yang terdaftar dan berhak berada di area bangku cadangan."
      permission="official.view"
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data official...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Data official tidak dapat dimuat.</p>
      ) : officials.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data official.</p>
      ) : (
        <DataTable columns={["Nama", "Tim", "Posisi", "Identitas", "Telepon", "Status", "Eligibility"]}>
          {officials.slice(0, 60).map((official) => (
            <Row key={official.id}>
              <Cell className="font-medium">{official.name}</Cell>
              <Cell>{official.teamName}</Cell>
              <Cell>{POSITION_LABEL[official.position]}</Cell>
              <Cell className="font-mono text-xs">{official.identityDisplay}</Cell>
              <Cell className="text-xs">{official.phoneDisplay}</Cell>
              <Cell><StatusBadge status={official.status} /></Cell>
              <Cell><StatusBadge status={official.eligibility} /></Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </AdminPage>
  );
}
