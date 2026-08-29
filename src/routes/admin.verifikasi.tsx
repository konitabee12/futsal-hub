import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useRbac } from "@/lib/rbac";
import { useRealVerificationCases, useVerificationDecision } from "@/queries/verification-hooks";

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
  const { data: cases, isLoading, isError } = useRealVerificationCases();
  const { mutate: decide, isPending: isDeciding } = useVerificationDecision();
  const verificationCases = cases ?? [];
  const [selected, setSelected] = useState(verificationCases[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const current = verificationCases.find((v) => v.id === selected);

  const handleDecision = (targetDecision: "VERIFIED" | "NEEDS_CORRECTION" | "REJECTED") => {
    if (!current) return;
    setError(null);
    decide(
      { caseId: current.id, targetDecision },
      {
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Decision failed";
          setError(message);
        },
      },
    );
  };

  return (
    <AdminPage
      title="Verifikasi"
      description="Periksa berkas peserta lalu tetapkan keputusan verifikasi."
      permission="verification.view"
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data verifikasi...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Data verifikasi tidak dapat dimuat.</p>
      ) : verificationCases.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data verifikasi.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
            {verificationCases.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => {
                    setSelected(v.id);
                    setError(null);
                  }}
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

              {error && (
                <div className="mt-4 rounded border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={!can("verification.decide") || isDeciding}
                  onClick={() => handleDecision("VERIFIED")}
                >
                  Setujui
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!can("verification.decide") || isDeciding}
                  onClick={() => handleDecision("NEEDS_CORRECTION")}
                >
                  Minta Koreksi
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!can("verification.decide") || isDeciding}
                  onClick={() => handleDecision("REJECTED")}
                >
                  Tolak
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminPage>
  );
}
