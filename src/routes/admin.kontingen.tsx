import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { contingents, teams } from "@/data/mock";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/admin/kontingen")({
  head: () => ({
    meta: [
      { title: "Manajemen Kontingen — Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Daftar dan status registrasi kontingen kabupaten/kota pada cabor futsal PORPROV Sulsel 2026." },
      { property: "og:title", content: "Manajemen Kontingen — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Status registrasi dan dokumen kontingen futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminContingents,
});

function AdminContingents() {
  const { can } = useRbac();
  return (
    <AdminPage
      title="Kontingen"
      description="Kelola data kontingen kabupaten/kota beserta status verifikasi dokumen."
      permission="contingent.view"
      actions={can("contingent.update") ? <Button size="sm">Tambah Kontingen</Button> : undefined}
    >
      <DataTable columns={["Kode", "Nama Kontingen", "PIC", "Kontak", "Tim", "Dokumen", "Status", "Aksi"]}>
        {contingents.map((c) => (
          <Row key={c.id}>
            <Cell className="font-mono text-xs">{c.code}</Cell>
            <Cell className="font-medium">{c.name}</Cell>
            <Cell>{c.pic}</Cell>
            <Cell className="text-xs text-muted-foreground">
              {c.email}
              <br />
              {c.phone}
            </Cell>
            <Cell>{teams.filter((t) => t.contingentId === c.id).length}</Cell>
            <Cell>
              {c.verifiedDocuments}/{c.documents}
            </Cell>
            <Cell>
              <StatusBadge status={c.status} />
            </Cell>
            <Cell>
              <Button size="sm" variant="outline" disabled={!can("contingent.update")}>
                Kelola
              </Button>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </AdminPage>
  );
}
