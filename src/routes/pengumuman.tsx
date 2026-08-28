import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader } from "@/components/PageHeader";
import { announcements } from "@/data/mock";
import { formatDate } from "@/lib/labels";

export const Route = createFileRoute("/pengumuman")({
  head: () => ({
    meta: [
      { title: "Pengumuman Resmi Futsal — PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Pengumuman resmi panitia cabang olahraga futsal PORPROV Sulawesi Selatan 2026 untuk kontingen, tim, dan official.",
      },
      { property: "og:title", content: "Pengumuman Resmi Futsal — PORPROV Sulsel 2026" },
      {
        property: "og:description",
        content: "Informasi technical meeting, batas pendaftaran, dan penetapan venue futsal PORPROV Sulsel 2026.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  return (
    <PublicLayout>
      <PageHeader title="Pengumuman" description="Informasi resmi dari panitia cabang olahraga futsal." />
      <div className="space-y-3">
        {announcements.map((a) => (
          <Link
            key={a.id}
            to="/pengumuman/$announcementId"
            params={{ announcementId: a.id }}
            className="block rounded-md border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <p className="label-caps text-primary">{formatDate(a.date)}</p>
            <h2 className="mt-1 font-display text-xl font-bold">{a.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>
          </Link>
        ))}
      </div>
    </PublicLayout>
  );
}
