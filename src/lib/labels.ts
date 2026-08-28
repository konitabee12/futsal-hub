import type {
  DocumentStatus,
  EligibilityStatus,
  MatchEventType,
  MatchStatus,
  OfficialPosition,
  RegistrationStatus,
  ResultStatus,
} from "@/types/domain";

export const REG_LABEL: Record<RegistrationStatus, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Terkirim",
  UNDER_REVIEW: "Sedang Ditinjau",
  NEEDS_CORRECTION: "Perlu Koreksi",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
};

export const ELIGIBILITY_LABEL: Record<EligibilityStatus, string> = {
  ELIGIBLE: "Eligible",
  NOT_ELIGIBLE: "Tidak Eligible",
  PENDING: "Menunggu",
};

export const DOC_LABEL: Record<DocumentStatus, string> = {
  PENDING: "Menunggu",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
};

export const MATCH_LABEL: Record<MatchStatus, string> = {
  SCHEDULED: "Terjadwal",
  CHECK_IN: "Check-in",
  LIVE: "Berlangsung",
  HALFTIME: "Turun Minum",
  FINISHED: "Selesai",
  POSTPONED: "Ditunda",
  CANCELLED: "Dibatalkan",
  VOID: "Batal Demi Hukum",
};

export const RESULT_LABEL: Record<ResultStatus, string> = {
  PENDING: "Belum Ada",
  SUBMITTED: "Dikirim",
  VERIFIED: "Terverifikasi",
  PUBLISHED: "Dipublikasikan",
};

export const EVENT_LABEL: Record<MatchEventType, string> = {
  GOAL: "Gol",
  OWN_GOAL: "Gol Bunuh Diri",
  YELLOW_CARD: "Kartu Kuning",
  RED_CARD: "Kartu Merah",
  FOUL: "Pelanggaran",
  SUBSTITUTION: "Pergantian",
  TIMEOUT: "Timeout",
  PENALTY: "Penalti",
};

export const POSITION_LABEL: Record<OfficialPosition, string> = {
  TEAM_MANAGER: "Manajer Tim",
  HEAD_COACH: "Pelatih Kepala",
  ASSISTANT_COACH: "Asisten Pelatih",
  TEAM_DOCTOR: "Dokter Tim",
  PHYSIO: "Fisioterapis",
  KIT_MANAGER: "Kit Manager",
  OTHER: "Lainnya",
};

export const STATUS_TONE: Record<string, "neutral" | "info" | "warn" | "ok" | "bad"> = {
  DRAFT: "neutral",
  INACTIVE: "neutral",
  PENDING: "warn",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  CHECK_IN: "info",
  SCHEDULED: "info",
  NEEDS_CORRECTION: "warn",
  POSTPONED: "warn",
  HALFTIME: "warn",
  VERIFIED: "ok",
  ACTIVE: "ok",
  ELIGIBLE: "ok",
  PUBLISHED: "ok",
  FINISHED: "ok",
  REJECTED: "bad",
  NOT_ELIGIBLE: "bad",
  CANCELLED: "bad",
  VOID: "bad",
  LIVE: "bad",
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
