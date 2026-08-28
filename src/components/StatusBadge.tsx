import { cn } from "@/lib/utils";
import {
  DOC_LABEL,
  ELIGIBILITY_LABEL,
  MATCH_LABEL,
  REG_LABEL,
  RESULT_LABEL,
  STATUS_TONE,
} from "@/lib/labels";

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-status-info text-status-info-foreground border-status-info-foreground/20",
  warn: "bg-status-warn text-status-warn-foreground border-status-warn-foreground/20",
  ok: "bg-status-ok text-status-ok-foreground border-status-ok-foreground/20",
  bad: "bg-status-bad text-status-bad-foreground border-status-bad-foreground/20",
};

export function statusLabel(status: string) {
  return (
    (REG_LABEL as Record<string, string>)[status] ??
    (ELIGIBILITY_LABEL as Record<string, string>)[status] ??
    (MATCH_LABEL as Record<string, string>)[status] ??
    (RESULT_LABEL as Record<string, string>)[status] ??
    (DOC_LABEL as Record<string, string>)[status] ??
    status
  );
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {status === "LIVE" && (
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-current" />
      )}
      {label ?? statusLabel(status)}
    </span>
  );
}
