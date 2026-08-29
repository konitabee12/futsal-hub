import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealDocuments } from "@/queries/document-hooks";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/admin/dokumen")({
  head: () => ({
    meta: [
      { title: "Manajemen Dokumen â€” Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Arsip dokumen kontingen, tim, pemain, dan official beserta riwayat versi pada cabor futsal PORPROV Sulsel 2026." },
      { property: "og:title", content: "Manajemen Dokumen â€” Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Arsip dan status dokumen registrasi futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDocuments,
});

function AdminDocuments() {
  const { can } = useRbac();
  const [status, setStatus] = useState("ALL");
  const { data, isLoading, isError } = useRealDocuments();
  const documents = data ?? [];
  const list = documents.filter((document) => status === "ALL" || document.status === status).slice(0, 60);

  return (
    <AdminPage title="Dokumen" description="Seluruh berkas yang diunggah kontingen, lengkap dengan versi dan status pemeriksaan." permission="document.view">
      <div className="mb-4 w-56">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua status</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
            <SelectItem value="REJECTED">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data dokumen...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Data dokumen tidak dapat dimuat.</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data dokumen.</p>
      ) : (
        <DataTable columns={["Pemilik", "Tipe", "Jenis Dokumen", "Berkas", "Versi", "Diunggah", "Status", "Aksi"]}>
          {list.map((document) => (
            <Row key={document.id}>
              <Cell className="font-medium">{document.ownerName}</Cell>
              <Cell className="text-xs">{document.ownerType}</Cell>
              <Cell>{document.documentType}</Cell>
              <Cell className="font-mono text-xs">{document.fileName}</Cell>
              <Cell>v{document.version}</Cell>
              <Cell className="text-xs text-muted-foreground">{document.uploadedAt}<br />{document.uploadedBy}</Cell>
              <Cell><StatusBadge status={document.status} /></Cell>
              <Cell><Button size="sm" variant="outline" disabled={!can("verification.decide")}>Periksa</Button></Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </AdminPage>
  );
}
