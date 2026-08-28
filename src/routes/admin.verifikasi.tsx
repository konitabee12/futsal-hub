import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { verificationCases } from "@/data/mock";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/admin/verifikasi")({
  head: () => ({
    meta: [
      { title: "Antrian Verifikasi — Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Antrian verifikasi berkas pemain dan official cabor futsal PORPROV Sulsel 2026 beserta riwayat keputusan." },
      { property: "og:title", content: "Antrian Verifikasi — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Proses verifikasi berkas peserta futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVerification,
});

function AdminVerification() {
  const { can } = useRbac();
  const [selected, setSelected] = useState(verificationCases[0]?.id ?? "");
  const current = verificationCases.find((v) => v.id === selected);

  return (
    <AdminPage
      title="Verifikasi"
      description="Periksa berkas peserta lalu tetapkan keputusan verifikasi."
      permission="verification.view"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
          {verificationCases.map((v) => (
            <li key={v.id}>
              <button
                onClick={() => setSelected(v.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${v.id === selected ? "bg-accent" : ""}`}
              >
                <p className="font-medium">{v.subjectName}</p>
                <p className="text-xs text-muted-foreground">
                  {v.contingentName} · {v.category}
                </p>
                <StatusBadge status={v.status} className="mt-1" />
              </button>
            </li>
          ))}
        </ul>

        {current && (
          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="font-display text-xl font-bold">{current.subjectName}</h2>
                <p className="text-xs text-muted-foreground">
                  {current.contingentName} · Diajukan {current.submittedAt}
                </p>
              </div>
              <StatusBadge status={current.status} />
            </div>

            <h3 className="label-caps mt-4 text-muted-foreground">Checklist Berkas</h3>
            <ul className="mt-2 divide-y divide-border rounded border border-border">
              {current.items.map((it) => (
                <li key={it.label} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{it.label}</span>
                  <StatusBadge status={it.status} />
                </li>
              ))}
            </ul>

            <h3 className="label-caps mt-4 text-muted-foreground">Riwayat Keputusan</h3>
            <ol className="mt-2 space-y-2 text-sm">
              {current.decisions.map((d, i) => (
                <li key={i} className="rounded border border-border px-3 py-2">
                  <p className="font-semibold">{d.decision}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.by} · {d.at}
                    {d.reason ? ` — ${d.reason}` : ""}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" disabled={!can("verification.decide")}>Setujui</Button>
              <Button size="sm" variant="outline" disabled={!can("verification.decide")}>Minta Koreksi</Button>
              <Button size="sm" variant="destructive" disabled={!can("verification.decide")}>Tolak</Button>
            </div>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
