import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { announcements } from "@/data/mock";
import { formatDate } from "@/lib/labels";

export const Route = createFileRoute("/pengumuman/$announcementId")({
  loader: ({ params }) => {
    const item = announcements.find((a) => a.id === params.announcementId);
    if (!item) throw notFound();
    return { title: item.title, summary: item.summary };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — PORPROV Sulsel 2026` : "Pengumuman tidak ditemukan" },
      { name: "description", content: loaderData?.summary ?? "Pengumuman tidak tersedia." },
      ...(loaderData
        ? [
            { property: "og:title", content: `${loaderData.title} — PORPROV Sulsel 2026` },
            { property: "og:description", content: loaderData.summary },
          ]
        : [{ name: "robots", content: "noindex" }]),
    ],
  }),
  errorComponent: () => <PublicLayout>Pengumuman tidak dapat dimuat.</PublicLayout>,
  notFoundComponent: () => <PublicLayout>Pengumuman tidak ditemukan.</PublicLayout>,
  component: AnnouncementDetail,
});

function AnnouncementDetail() {
  const { announcementId } = Route.useParams();
  const item = announcements.find((a) => a.id === announcementId)!;

  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl">
        <Link to="/pengumuman" className="text-sm text-primary hover:underline">
          ← Kembali ke pengumuman
        </Link>
        <p className="label-caps mt-4 text-primary">{formatDate(item.date)}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold uppercase">{item.title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/90">
          {item.body.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
    </PublicLayout>
  );
}
