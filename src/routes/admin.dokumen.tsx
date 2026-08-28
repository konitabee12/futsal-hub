import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { documents } from "@/data/mock";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/admin/dokumen")({
  head: () => ({
    meta: [
      { title: "Manajemen Dokumen — Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Arsip dokumen kontingen, tim, pemain, dan official beserta riwayat versi pada cabor futsal PORPROV Sulsel 2026." },
      { property: "og:title", content: "Manajemen Dokumen — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Arsip dan status dokumen registrasi futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDocuments,
});

function AdminDocuments() {
  const { can } = useRbac();
  const [status, setStatus] = useState("ALL");
  const list = documents.filter((d) => status === "ALL" || d.status === status).slice(0, 60);

  return (
    <AdminPage
      title="Dokumen"
      description="Seluruh berkas yang diunggah kontingen, lengkap dengan versi dan status pemeriksaan."
      permission="document.view"
    >
      <div className="mb-4 w-56">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua status</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
            <SelectItem value="REJECTED">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={["Pemilik", "Tipe", "Jenis Dokumen", "Berkas", "Versi", "Diunggah", "Status", "Aksi"]}>
        {list.map((d) => (
          <Row key={d.id}>
            <Cell className="font-medium">{d.ownerName}</Cell>
            <Cell className="text-xs">{d.ownerType}</Cell>
            <Cell>{d.documentType}</Cell>
            <Cell className="font-mono text-xs">{d.fileName}</Cell>
            <Cell>v{d.version}</Cell>
            <Cell className="text-xs text-muted-foreground">
              {d.uploadedAt}
              <br />
              {d.uploadedBy}
            </Cell>
            <Cell>
              <StatusBadge status={d.status} />
            </Cell>
            <Cell>
              <Button size="sm" variant="outline" disabled={!can("verification.decide")}>
                Periksa
              </Button>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </AdminPage>
  );
}
