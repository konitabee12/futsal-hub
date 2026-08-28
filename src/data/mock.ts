import type {
  Announcement,
  AuditEntry,
  Category,
  Contingent,
  DocumentRecord,
  Group,
  Match,
  MatchEvent,
  NotificationItem,
  Official,
  Player,
  StandingRow,
  Team,
  VerificationCase,
  Venue,
} from "@/types/domain";

export const EVENT_NAME = "PORPROV SULSEL 2026";
export const SPORT_NAME = "FUTSAL";

const regions = [
  ["MKS", "Kota Makassar", "Makassar"],
  ["PRP", "Kota Parepare", "Parepare"],
  ["PLP", "Kota Palopo", "Palopo"],
  ["GWA", "Kabupaten Gowa", "Gowa"],
  ["BNE", "Kabupaten Bone", "Bone"],
  ["LWU", "Kabupaten Luwu", "Luwu"],
  ["BLK", "Kabupaten Bulukumba", "Bulukumba"],
  ["MRS", "Kabupaten Maros", "Maros"],
];

const contingentStatus: Contingent["status"][] = [
  "ACTIVE",
  "ACTIVE",
  "VERIFIED",
  "ACTIVE",
  "UNDER_REVIEW",
  "VERIFIED",
  "NEEDS_CORRECTION",
  "SUBMITTED",
];

export const contingents: Contingent[] = regions.map(([code, name, city], i) => ({
  id: `ctg-${code.toLowerCase()}`,
  code,
  name,
  region: city,
  pic: ["Andi Saputra", "Muh. Rizal", "Hasnawati", "Ahmad Fauzan", "Nurul Aini", "Baso Idris", "Sitti Rahma", "Yusuf Alamsyah"][i],
  email: `kontingen.${code.toLowerCase()}@porprovsulsel.id`,
  phone: `08${(1234567890 + i * 1111).toString().slice(0, 10)}`,
  status: contingentStatus[i],
  documents: 6,
  verifiedDocuments: [6, 6, 5, 6, 3, 5, 2, 1][i],
}));

const categories: Category[] = ["PUTRA", "PUTRI"];

export const groups: Group[] = [
  { id: "grp-a-putra", category: "PUTRA", name: "Grup A", stage: "GROUP_STAGE" },
  { id: "grp-b-putra", category: "PUTRA", name: "Grup B", stage: "GROUP_STAGE" },
  { id: "grp-a-putri", category: "PUTRI", name: "Grup A", stage: "GROUP_STAGE" },
  { id: "grp-b-putri", category: "PUTRI", name: "Grup B", stage: "GROUP_STAGE" },
];

export const venues: Venue[] = [
  { id: "ven-1", name: "GOR Sudiang", city: "Makassar", capacity: 2500, courts: 2 },
  { id: "ven-2", name: "GOR Andi Mattalatta", city: "Makassar", capacity: 3000, courts: 1 },
  { id: "ven-3", name: "GOR Sultan Hasanuddin", city: "Gowa", capacity: 1800, courts: 1 },
];

export const teams: Team[] = categories.flatMap((category) =>
  contingents.map((c, i) => ({
    id: `team-${c.code.toLowerCase()}-${category.toLowerCase()}`,
    contingentId: c.id,
    category,
    name: `${c.name} ${category}`,
    shortName: c.code,
    manager: c.pic,
    headCoach: ["Rahmat Hidayat", "Fadli Nur", "Irwan Setiawan", "Dewi Anggraini", "Syamsul Bahri", "Rina Marlina", "Agus Salim", "Muh. Taufik"][i],
    groupId: `grp-${i % 2 === 0 ? "a" : "b"}-${category.toLowerCase()}`,
    status: (["ACTIVE", "ACTIVE", "VERIFIED", "ACTIVE", "UNDER_REVIEW", "VERIFIED", "NEEDS_CORRECTION", "SUBMITTED"] as Team["status"][])[i],
    eligibility: (i < 6 ? "ELIGIBLE" : i === 6 ? "NOT_ELIGIBLE" : "PENDING") as Team["eligibility"],
  })),
);

const maleNames = [
  "Andi Fajar", "Muh. Ilham", "Reza Pratama", "Arif Setiawan", "Dedi Kurniawan",
  "Bayu Aditya", "Rian Saputra", "Fikri Ramadhan", "Aldi Nugraha", "Iqbal Maulana",
  "Zulfikar Ahmad", "Hendra Wijaya",
];
const femaleNames = [
  "Nur Aisyah", "Siti Maharani", "Dinda Lestari", "Putri Amelia", "Wulan Sari",
  "Rani Oktaviani", "Fitri Handayani", "Ayu Kartika", "Melati Anggun", "Salsabila Nur",
  "Intan Permata", "Cindy Anggraini",
];
const positions: Player["position"][] = ["PENJAGA GAWANG", "ANCHOR", "FLANK", "FLANK", "PIVOT"];

export const players: Player[] = teams.flatMap((team, ti) => {
  const pool = team.category === "PUTRA" ? maleNames : femaleNames;
  return pool.map((base, i) => {
    const idx = (ti + i) % 8;
    const status: Player["status"] =
      idx === 6 ? "NEEDS_CORRECTION" : idx === 7 ? "UNDER_REVIEW" : idx === 5 ? "SUBMITTED" : "VERIFIED";
    const eligibility: Player["eligibility"] =
      status === "VERIFIED" ? "ELIGIBLE" : status === "NEEDS_CORRECTION" ? "NOT_ELIGIBLE" : "PENDING";
    return {
      id: `${team.id}-p${i + 1}`,
      teamId: team.id,
      name: `${base} ${team.shortName}`,
      number: i + 1,
      position: positions[i % positions.length],
      birthDate: `200${(i % 6) + 1}-0${(i % 9) + 1}-1${i % 9}`,
      identityType: "NIK" as const,
      identityNumber: `73710${(1000000000 + ti * 137 + i).toString().slice(0, 11)}`,
      address: `Jl. Melati No. ${i + 3}, ${team.shortName}`,
      phone: `0812${(3000000 + ti * 97 + i).toString().slice(0, 7)}`,
      email: `pemain${i + 1}.${team.shortName.toLowerCase()}@mail.id`,
      status,
      eligibility,
    };
  });
});

const officialPositions: Official["position"][] = [
  "TEAM_MANAGER",
  "HEAD_COACH",
  "ASSISTANT_COACH",
  "TEAM_DOCTOR",
  "PHYSIO",
];

export const officials: Official[] = teams.flatMap((team, ti) =>
  officialPositions.map((position, i) => ({
    id: `${team.id}-o${i + 1}`,
    teamId: team.id,
    name: [team.manager, team.headCoach, `Asisten ${team.shortName}`, `dr. ${team.shortName}`, `Fisio ${team.shortName}`][i],
    position,
    identityNumber: `73710${(2000000000 + ti * 53 + i).toString().slice(0, 11)}`,
    phone: `0813${(4000000 + ti * 41 + i).toString().slice(0, 7)}`,
    status: (ti % 5 === 4 && i > 2 ? "UNDER_REVIEW" : "VERIFIED") as Official["status"],
    eligibility: (ti % 5 === 4 && i > 2 ? "PENDING" : "ELIGIBLE") as Official["eligibility"],
  })),
);

const docTypes = ["KTP/KK", "Akta Kelahiran", "Surat Keterangan Domisili", "Pas Foto", "Surat Sehat", "Surat Rekomendasi"];

export const documents: DocumentRecord[] = [
  ...contingents.map((c, i) => ({
    id: `doc-ctg-${i}`,
    ownerType: "CONTINGENT" as const,
    ownerId: c.id,
    ownerName: c.name,
    documentType: "Surat Mandat Kontingen",
    fileName: `mandat-${c.code.toLowerCase()}.pdf`,
    version: 1,
    uploadedBy: c.pic,
    uploadedAt: `2026-07-${(10 + i).toString().padStart(2, "0")} 09:${(10 + i).toString()}`,
    status: (c.verifiedDocuments >= 5 ? "VERIFIED" : c.verifiedDocuments >= 3 ? "PENDING" : "REJECTED") as DocumentRecord["status"],
  })),
  ...players.slice(0, 40).flatMap((p, i) =>
    docTypes.slice(0, 3).map((t, j) => ({
      id: `doc-pl-${i}-${j}`,
      ownerType: "PLAYER" as const,
      ownerId: p.id,
      ownerName: p.name,
      documentType: t,
      fileName: `${t.toLowerCase().replace(/[^a-z]/g, "-")}-${p.number}.pdf`,
      version: j === 2 ? 2 : 1,
      uploadedBy: "Manajer Tim",
      uploadedAt: `2026-07-${((i % 20) + 5).toString().padStart(2, "0")} 1${j}:20`,
      status: (p.status === "VERIFIED" ? "VERIFIED" : p.status === "NEEDS_CORRECTION" ? "REJECTED" : "PENDING") as DocumentRecord["status"],
    })),
  ),
];

export const verificationCases: VerificationCase[] = players
  .filter((p) => p.status !== "VERIFIED")
  .slice(0, 18)
  .map((p, i) => {
    const team = teams.find((t) => t.id === p.teamId)!;
    const contingent = contingents.find((c) => c.id === team.contingentId)!;
    return {
      id: `vc-${i + 1}`,
      subjectType: "PLAYER" as const,
      subjectId: p.id,
      subjectName: p.name,
      category: team.category,
      contingentName: contingent.name,
      status: p.status,
      submittedAt: `2026-07-${((i % 20) + 5).toString().padStart(2, "0")} 08:30`,
      items: [
        { label: "Identitas (NIK)", status: (p.status === "NEEDS_CORRECTION" ? "REJECTED" : "PENDING") as DocumentRecord["status"] },
        { label: "Akta Kelahiran", status: "VERIFIED" as const },
        { label: "Surat Domisili", status: "PENDING" as const },
        { label: "Pas Foto", status: "VERIFIED" as const },
      ],
      decisions: [
        { decision: "SUBMITTED" as const, by: contingent.pic, at: `2026-07-${((i % 20) + 5).toString().padStart(2, "0")} 08:30` },
        ...(p.status === "NEEDS_CORRECTION"
          ? [
              {
                decision: "NEEDS_CORRECTION" as const,
                by: "Verifikator 1",
                at: `2026-07-${((i % 20) + 7).toString().padStart(2, "0")} 13:05`,
                reason: "Data identitas tidak sesuai",
                notes: "Nomor NIK berbeda dengan dokumen akta kelahiran.",
              },
            ]
          : []),
      ],
    };
  });

/* ---------- Matches ---------- */

function makeEvents(matchId: string, homeTeamId: string, awayTeamId: string, hs: number, as_: number): MatchEvent[] {
  const ev: MatchEvent[] = [];
  const homePlayers = players.filter((p) => p.teamId === homeTeamId);
  const awayPlayers = players.filter((p) => p.teamId === awayTeamId);
  for (let i = 0; i < hs; i++) {
    ev.push({
      id: `${matchId}-h${i}`,
      minute: `${(i + 1) * 6}:${((i * 17) % 60).toString().padStart(2, "0")}`,
      type: "GOAL",
      teamId: homeTeamId,
      playerName: homePlayers[(i + 2) % homePlayers.length].name,
    });
  }
  for (let i = 0; i < as_; i++) {
    ev.push({
      id: `${matchId}-a${i}`,
      minute: `${(i + 2) * 7}:${((i * 23) % 60).toString().padStart(2, "0")}`,
      type: "GOAL",
      teamId: awayTeamId,
      playerName: awayPlayers[(i + 4) % awayPlayers.length].name,
    });
  }
  ev.push({
    id: `${matchId}-c1`,
    minute: "18:40",
    type: "YELLOW_CARD",
    teamId: awayTeamId,
    playerName: awayPlayers[3].name,
    detail: "Protes keputusan wasit",
  });
  ev.push({
    id: `${matchId}-t1`,
    minute: "32:10",
    type: "TIMEOUT",
    teamId: homeTeamId,
    playerName: "-",
    detail: "Timeout babak kedua",
  });
  return ev.sort((a, b) => a.minute.localeCompare(b.minute));
}

function buildMatches(): Match[] {
  const list: Match[] = [];
  let n = 0;
  for (const group of groups) {
    const gt = teams.filter((t) => t.groupId === group.id);
    for (let i = 0; i < gt.length; i++) {
      for (let j = i + 1; j < gt.length; j++) {
        n++;
        const id = `mt-${n}`;
        const day = 3 + (n % 6);
        const finished = n % 3 !== 0;
        const live = n % 11 === 5;
        const hs = finished ? (n * 3) % 6 : null;
        const as_ = finished ? (n * 5) % 5 : null;
        list.push({
          id,
          category: group.category,
          stage: group.stage,
          groupId: group.id,
          homeTeamId: gt[i].id,
          awayTeamId: gt[j].id,
          venueId: venues[n % venues.length].id,
          date: `2026-09-${day.toString().padStart(2, "0")}`,
          kickoff: ["09:00", "11:00", "13:30", "16:00", "19:30"][n % 5],
          referee: ["Andi Wahyu", "Rustam Effendi", "Nurhayati", "Muh. Sabir"][n % 4],
          status: live ? "LIVE" : finished ? "FINISHED" : "SCHEDULED",
          resultStatus: live ? "PENDING" : finished ? (n % 4 === 1 ? "SUBMITTED" : "PUBLISHED") : "PENDING",
          homeScore: live ? 2 : hs,
          awayScore: live ? 1 : as_,
          events: live || finished ? makeEvents(id, gt[i].id, gt[j].id, live ? 2 : (hs ?? 0), live ? 1 : (as_ ?? 0)) : [],
        });
      }
    }
  }
  return list;
}

export const matches: Match[] = buildMatches();

/* ---------- Derived ---------- */

export function computeStandings(category: Category, groupId?: string): Record<string, StandingRow[]> {
  const result: Record<string, StandingRow[]> = {};
  const cGroups = groups.filter((g) => g.category === category && (!groupId || g.id === groupId));
  for (const g of cGroups) {
    const rows = new Map<string, StandingRow>();
    for (const t of teams.filter((t) => t.groupId === g.id)) {
      rows.set(t.id, {
        teamId: t.id,
        played: 0, won: 0, draw: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      });
    }
    for (const m of matches) {
      if (m.groupId !== g.id) continue;
      if (m.resultStatus !== "PUBLISHED" && m.resultStatus !== "VERIFIED") continue;
      if (m.homeScore === null || m.awayScore === null) continue;
      const h = rows.get(m.homeTeamId)!;
      const a = rows.get(m.awayTeamId)!;
      h.played++; a.played++;
      h.goalsFor += m.homeScore; h.goalsAgainst += m.awayScore;
      a.goalsFor += m.awayScore; a.goalsAgainst += m.homeScore;
      if (m.homeScore > m.awayScore) { h.won++; a.lost++; h.points += 3; }
      else if (m.homeScore < m.awayScore) { a.won++; h.lost++; a.points += 3; }
      else { h.draw++; a.draw++; h.points++; a.points++; }
    }
    result[g.id] = [...rows.values()]
      .map((r) => ({ ...r, goalDifference: r.goalsFor - r.goalsAgainst }))
      .sort((x, y) => y.points - x.points || y.goalDifference - x.goalDifference || y.goalsFor - x.goalsFor);
  }
  return result;
}

export interface ScorerRow {
  playerName: string;
  teamId: string;
  goals: number;
}

export function topScorers(category: Category, limit = 10): ScorerRow[] {
  const map = new Map<string, ScorerRow>();
  for (const m of matches) {
    if (m.category !== category) continue;
    if (m.resultStatus === "PENDING" && m.status !== "LIVE") continue;
    for (const e of m.events) {
      if (e.type !== "GOAL") continue;
      const key = `${e.teamId}-${e.playerName}`;
      const row = map.get(key) ?? { playerName: e.playerName, teamId: e.teamId, goals: 0 };
      row.goals++;
      map.set(key, row);
    }
  }
  return [...map.values()].sort((a, b) => b.goals - a.goals).slice(0, limit);
}

export function cardStats(category: Category, limit = 10) {
  const map = new Map<string, { playerName: string; teamId: string; yellow: number; red: number }>();
  for (const m of matches) {
    if (m.category !== category) continue;
    for (const e of m.events) {
      if (e.type !== "YELLOW_CARD" && e.type !== "RED_CARD") continue;
      const key = `${e.teamId}-${e.playerName}`;
      const row = map.get(key) ?? { playerName: e.playerName, teamId: e.teamId, yellow: 0, red: 0 };
      if (e.type === "YELLOW_CARD") row.yellow++;
      else row.red++;
      map.set(key, row);
    }
  }
  return [...map.values()].sort((a, b) => b.red * 3 + b.yellow - (a.red * 3 + a.yellow)).slice(0, limit);
}

export function playerStats(playerId: string) {
  const player = players.find((p) => p.id === playerId);
  if (!player) return { goals: 0, yellow: 0, red: 0, appearances: 0 };
  let goals = 0, yellow = 0, red = 0, appearances = 0;
  for (const m of matches) {
    if (m.homeTeamId !== player.teamId && m.awayTeamId !== player.teamId) continue;
    if (m.status === "FINISHED" || m.status === "LIVE") appearances++;
    for (const e of m.events) {
      if (e.playerName !== player.name) continue;
      if (e.type === "GOAL") goals++;
      if (e.type === "YELLOW_CARD") yellow++;
      if (e.type === "RED_CARD") red++;
    }
  }
  return { goals, yellow, red, appearances };
}

/* ---------- Lookups ---------- */

export const teamById = (id: string) => teams.find((t) => t.id === id);
export const teamName = (id: string) => teamById(id)?.name ?? "-";
export const teamShort = (id: string) => teamById(id)?.shortName ?? "-";
export const contingentById = (id: string) => contingents.find((c) => c.id === id);
export const groupById = (id: string) => groups.find((g) => g.id === id);
export const venueById = (id: string) => venues.find((v) => v.id === id);
export const matchById = (id: string) => matches.find((m) => m.id === id);
export const playerById = (id: string) => players.find((p) => p.id === id);

/* ---------- Content ---------- */

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "Technical Meeting Cabor Futsal PORPROV Sulsel 2026",
    date: "2026-08-20",
    summary: "Technical meeting akan dilaksanakan sebelum pertandingan perdana.",
    body: "Seluruh manajer tim dan official wajib menghadiri technical meeting cabang olahraga futsal. Agenda meliputi pembahasan regulasi pertandingan, pengundian grup, verifikasi akhir daftar pemain, serta penjelasan mekanisme protes dan sanksi.",
  },
  {
    id: "ann-2",
    title: "Batas Akhir Pendaftaran Pemain dan Official",
    date: "2026-08-15",
    summary: "Pendaftaran ditutup setelah masa perbaikan dokumen berakhir.",
    body: "Kontingen diminta menyelesaikan pengunggahan dokumen pemain dan official sebelum batas waktu. Berkas yang berstatus perlu koreksi harus diperbaiki dan dikirim ulang agar pemain dapat memperoleh status eligible.",
  },
  {
    id: "ann-3",
    title: "Penetapan Venue Pertandingan",
    date: "2026-08-10",
    summary: "Tiga venue ditetapkan untuk seluruh pertandingan futsal putra dan putri.",
    body: "Pertandingan akan digelar di GOR Sudiang, GOR Andi Mattalatta, dan GOR Sultan Hasanuddin. Jadwal rinci per lapangan diterbitkan pada halaman jadwal setelah proses penerbitan fixture selesai.",
  },
];

export const auditLog: AuditEntry[] = [
  { id: "au-1", actor: "verifier@porprov.id", action: "VERIFY", resource: "player", resourceId: "team-mks-putra-p1", at: "2026-08-21 10:12", ip: "10.10.4.21" },
  { id: "au-2", actor: "operator@porprov.id", action: "SCHEDULE_CHANGE", resource: "match", resourceId: "mt-4", at: "2026-08-21 09:40", ip: "10.10.4.33" },
  { id: "au-3", actor: "match@porprov.id", action: "MATCH_RESULT_CHANGE", resource: "match", resourceId: "mt-2", at: "2026-08-20 20:05", ip: "10.10.4.50" },
  { id: "au-4", actor: "futsal.admin@porprov.id", action: "STANDINGS_RECALCULATION", resource: "standings", resourceId: "grp-a-putra", at: "2026-08-20 20:07", ip: "10.10.4.12" },
  { id: "au-5", actor: "kontingen.gwa@porprov.id", action: "SUBMIT", resource: "player", resourceId: "team-gwa-putri-p3", at: "2026-08-20 15:31", ip: "10.10.7.90" },
  { id: "au-6", actor: "verifier@porprov.id", action: "REJECT", resource: "document", resourceId: "doc-pl-6-0", at: "2026-08-19 14:02", ip: "10.10.4.21" },
  { id: "au-7", actor: "super.admin@porprov.id", action: "LOGIN", resource: "session", resourceId: "sess-882", at: "2026-08-19 08:00", ip: "10.10.1.2" },
  { id: "au-8", actor: "verifier@porprov.id", action: "ELIGIBILITY_CHANGE", resource: "player", resourceId: "team-bne-putra-p5", at: "2026-08-18 16:45", ip: "10.10.4.21" },
];

export const notifications: NotificationItem[] = [
  { id: "nt-1", title: "Hasil verifikasi", message: "3 pemain Kota Makassar Putra telah diverifikasi.", at: "2026-08-21 10:15", read: false },
  { id: "nt-2", title: "Perlu koreksi", message: "Dokumen identitas 2 pemain Kabupaten Bulukumba perlu diperbaiki.", at: "2026-08-20 17:20", read: false },
  { id: "nt-3", title: "Jadwal diterbitkan", message: "Jadwal babak grup Putri telah dipublikasikan.", at: "2026-08-20 11:00", read: true },
  { id: "nt-4", title: "Hasil dipublikasikan", message: "Hasil pertandingan MT-2 telah dipublikasikan dan klasemen diperbarui.", at: "2026-08-19 21:00", read: true },
];
