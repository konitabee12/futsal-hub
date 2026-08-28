# Futsal Hub

PORPROV SULSEL 2026 FUTSAL — Master Product Blueprint v1.0

1. Product Identity

Nama Produk

PORPROV SULSEL 2026 — FUTSAL Competition Management System

Nama pendek:

PORPROV FUTSAL CMS

Tujuan utama:

Membangun platform digital untuk mengelola seluruh siklus kompetisi Futsal PORPROV SULSEL 2026, mulai dari:

Kontingen
   ↓
Pendaftaran Tim
   ↓
Pendaftaran Pemain & Official
   ↓
Verifikasi
   ↓
Eligibility
   ↓
Kompetisi
   ↓
Jadwal
   ↓
Pertandingan
   ↓
Hasil
   ↓
Klasemen
   ↓
Statistik
   ↓
Public Information

Platform mencakup:

 Futsal Putra

 Futsal Putri

2. Product Vision

Vision

Menjadi single source of truth untuk data administrasi dan informasi pertandingan Futsal PORPROV SULSEL 2026.

Mission

Platform harus mampu:

 Mengurangi proses administrasi manual.

 Mengurangi kesalahan data pemain.

 Memastikan pemain dan official memiliki status verifikasi yang jelas.

 Menyediakan kontrol akses berdasarkan role dan scope.

 Menyediakan data pertandingan secara real-time atau near-real-time.

 Menyediakan klasemen yang dihitung otomatis.

 Menyediakan informasi publik yang transparan.

 Menyediakan audit trail untuk seluruh aktivitas kritis.

3. Product Boundary

In Scope

Administrative

 Event management

 Kontingen registration

 Team registration

 Player registration

 Official registration

 Document management

 Verification

 Eligibility

 Approval workflow

Competition

 Competition category

 Group

 Draw

 Fixture

 Schedule

 Venue

 Match

 Match officials

 Match result

 Match events

 Standings

 Statistics

Public

 Event information

 Team list

 Player public profile

 Schedule

 Results

 Standings

 Match center

 Statistics

 Announcements

Security

 Authentication

 RBAC

 Permission

 Scope-based authorization

 RLS

 Audit log

 Data isolation

4. Out of Scope v1.0

Jangan memasukkan fitur berikut ke MVP kecuali kemudian diputuskan:

 Ticketing

 Payment gateway

 Merchandise

 Hotel management

 Transportation management

 Full accreditation system seluruh PORPROV

 Social media network

 Chat antar pengguna

 AI scouting

 Video streaming

 Betting/gambling

 Medical record system penuh

5. Competition Structure

PORPROV SULSEL 2026
│
└── CABOR FUTSAL
    │
    ├── FUTSAL PUTRA
    │   ├── Teams
    │   ├── Players
    │   ├── Officials
    │   ├── Groups
    │   ├── Matches
    │   └── Standings
    │
    └── FUTSAL PUTRI
        ├── Teams
        ├── Players
        ├── Officials
        ├── Groups
        ├── Matches
        └── Standings

Putra dan Putri menggunakan domain model yang sama, tetapi memiliki competition_category berbeda.

6. User Roles

System Level

SUPER_ADMIN

Akses penuh sistem.

EVENT_ADMIN

Mengelola PORPROV 2026.

FUTSAL_ADMIN

Mengelola kompetisi futsal.

Operational Level

VERIFIER

Melakukan verifikasi:

 Pemain

 Official

 Dokumen

 Eligibility

COMPETITION_OPERATOR

Mengelola:

 Group

 Draw

 Fixture

 Schedule

MATCH_OPERATOR

Mengelola:

 Match

 Lineup

 Score

 Match events

MATCH_OFFICIAL

Melihat pertandingan yang ditugaskan dan memberikan laporan sesuai kewenangan.

Participant Level

CONTINGENT_ADMIN

Mengelola kontingen.

TEAM_MANAGER

Mengelola tim yang ditugaskan.

Public

PUBLIC_USER

Tidak membutuhkan authentication.

Hanya dapat mengakses data publik.

7. Permission Model

Authorization harus berbentuk:

USER
 +
ROLE
 +
PERMISSION
 +
SCOPE

Contoh:

CONTINGENT_ADMIN
    +
team.update
    +
CONTINGENT_SCOPE

berarti user hanya dapat mengubah team yang berada dalam kontingennya.

Bukan:

team.update = TRUE

secara global.

8. Organization Hierarchy

EVENT
  │
  └── FUTSAL
       │
       ├── PUTRA
       │
       └── PUTRI
            │
            └── CONTINGENT
                 │
                 └── TEAM
                      │
                      ├── PLAYER
                      └── OFFICIAL

9. Kontingen Registration

Data minimum:

Contingent
├── ID
├── Code
├── Name
├── Kabupaten/Kota
├── Logo
├── Contact
├── PIC
├── Email
├── Phone
├── Documents
└── Status

Status:

DRAFT
SUBMITTED
UNDER_REVIEW
NEEDS_CORRECTION
VERIFIED
REJECTED
ACTIVE
INACTIVE

10. Team Registration

Setiap kontingen dapat memiliki tim berdasarkan kategori kompetisi.

CONTINGENT
│
├── MEN TEAM
│
└── WOMEN TEAM

Team memiliki:

 Team identity

 Logo

 Manager

 Players

 Officials

 Registration status

 Eligibility status

11. Player Registry

Player harus memiliki identitas unik.

Struktur:

PLAYER
├── Identity
├── Personal Information
├── Contact
├── Photo
├── Documents
├── Registration
├── Verification
├── Eligibility
└── Audit

Untuk warga negara Indonesia:

identity_type = NIK

Untuk foreign national jika regulasi mengizinkan:

identity_type = PASSPORT

Catatan: aturan eligibility, batas usia, status domisili, dan persyaratan identitas harus mengikuti regulasi resmi PORPROV SULSEL 2026 dan ketentuan kompetisi futsal yang berlaku. Jangan di-hard-code sebelum regulasi final tersedia.

12. Official Registry

Official:

OFFICIAL
├── Identity
├── Photo
├── Position
├── Documents
├── Team Assignment
├── Verification
└── Eligibility

Role:

TEAM_MANAGER
HEAD_COACH
ASSISTANT_COACH
TEAM_DOCTOR
PHYSIO
KIT_MANAGER
OTHER

13. Document Management

Semua dokumen harus memiliki metadata.

DOCUMENT
├── owner_type
├── owner_id
├── document_type
├── file_reference
├── version
├── uploaded_by
├── uploaded_at
├── status
└── verification

Jangan menyimpan file binary langsung di PostgreSQL.

Database menyimpan metadata/reference.

Object storage menyimpan file.

14. Verification Engine

Workflow:

DRAFT
   ↓
SUBMITTED
   ↓
UNDER_REVIEW
   ├──→ NEEDS_CORRECTION
   │        ↓
   │      RESUBMITTED
   │        ↓
   └──── UNDER_REVIEW
            ↓
        VERIFIED
            │
            ▼
        ELIGIBLE

Reject:

UNDER_REVIEW
      ↓
REJECTED

Setiap keputusan wajib menyimpan:

verified_by
verified_at
decision
reason
notes

15. Eligibility Engine

Status pemain tidak cukup:

VERIFIED

Harus ada status:

ELIGIBLE
NOT_ELIGIBLE
PENDING

Contoh:

Player
 ├── Identity = VERIFIED
 ├── Documents = VERIFIED
 ├── Registration = VERIFIED
 └── Eligibility = ELIGIBLE

Hanya:

ELIGIBLE

yang dapat digunakan dalam lineup pertandingan.

16. Competition Engine

Competition terdiri dari:

Competition
├── Category
├── Stage
├── Group
├── Team
├── Fixture
├── Match
├── Venue
└── Rules

Stage dapat berupa:

GROUP_STAGE
QUARTER_FINAL
SEMI_FINAL
THIRD_PLACE
FINAL

Tetapi struktur harus configurable.

17. Fixture & Scheduling

Match menyimpan:

Match
├── competition
├── category
├── stage
├── group
├── home_team
├── away_team
├── venue
├── date
├── kickoff_time
├── referee
├── match_official
└── status

Status:

SCHEDULED
CHECK_IN
LIVE
HALFTIME
FINISHED
POSTPONED
CANCELLED
VOID

18. Match Management

Match Operator dapat:

 Start match

 Record lineup

 Record goals

 Record cards

 Record substitutions

 Record fouls

 Record timeout

 End match

 Submit match report

19. Match Events

Minimal:

GOAL
OWN_GOAL
YELLOW_CARD
RED_CARD
FOUL
SUBSTITUTION
TIMEOUT
PENALTY

Event harus memiliki timestamp/period.

Contoh:

00:45
GOAL
Player #10
Team A

20. Match Result

Result tidak boleh langsung memengaruhi klasemen sebelum status hasil memenuhi aturan validasi.

Contoh:

MATCH FINISHED
      ↓
RESULT SUBMITTED
      ↓
RESULT VERIFIED
      ↓
STANDINGS RECALCULATED
      ↓
RESULT PUBLISHED

Ini mencegah operator salah input yang langsung mengubah klasemen publik.

21. Standings Engine

Standings dihitung dari match result yang valid.

Minimal:

Team
Played
Won
Draw
Lost
Goals For
Goals Against
Goal Difference
Points

Ranking rule harus configurable berdasarkan regulasi.

Jangan hard-code tie-breaker sebelum aturan resmi dikonfirmasi.

22. Statistics Engine

Statistik minimum:

Team

 Matches

 Wins

 Draws

 Losses

 Goals For

 Goals Against

 Points

Player

 Goals

 Cards

 Appearances

Jika match-event tracking cukup detail, dapat ditambahkan:

 Assists

 Fouls

 Saves

 Clean sheets

23. Public Portal

Public homepage:

PORPROV SULSEL 2026
FUTSAL

[PUTRA] [PUTRI]

LIVE NOW

NEXT MATCHES

LATEST RESULTS

STANDINGS

TOP SCORERS

Navigation:

Home
Teams
Players
Schedule
Results
Standings
Matches
Statistics
Announcements

24. Public Data Privacy

Data berikut tidak boleh public:

 NIK

 Passport number

 alamat

 nomor telepon

 email personal

 dokumen identitas

 dokumen administrasi

 verification notes internal

Public hanya mendapatkan data yang memang ditetapkan sebagai public.

25. Notification System

MVP:

In-app notification
Email notification

Event:

Registration Submitted
Verification Result
Correction Required
Player Approved
Player Rejected
Schedule Published
Match Updated
Result Published

WhatsApp dapat menjadi fase berikutnya apabila diperlukan.

26. Audit Trail

Audit untuk aktivitas kritis:

LOGIN
CREATE
UPDATE
DELETE
SUBMIT
VERIFY
REJECT
APPROVE
ELIGIBILITY_CHANGE
MATCH_RESULT_CHANGE
SCHEDULE_CHANGE
STANDINGS_RECALCULATION

Audit:

actor
action
resource
resource_id
before
after
timestamp
ip
user_agent

27. Security Architecture

Authentication
       ↓
Identity
       ↓
Role
       ↓
Permission
       ↓
Scope
       ↓
Business Rule
       ↓
Database RLS

Defense in depth.

Frontend tidak boleh menjadi security boundary.

28. Database Domain

Minimal domain database:

Identity
├── users
├── roles
├── permissions
├── user_roles
└── role_permissions

Event
├── events
├── sports
├── competitions
├── competition_categories
├── competition_stages
└── competition_rules

Organization
├── contingents
├── teams
├── team_members
└── officials

People
├── players
├── player_registrations
├── official_registrations
└── identities

Documents
├── documents
├── document_types
└── document_verifications

Verification
├── verification_cases
├── verification_items
└── verification_decisions

Competition
├── groups
├── group_teams
├── venues
├── fixtures
├── matches
├── match_officials
├── lineups
├── match_events
└── match_results

Standings
├── standings
└── standings_snapshots

Audit
├── audit_logs
└── system_logs

Target final ERD: ±35–45 entities, tergantung detail implementasi.

29. Core Business Rule

Prinsip yang harus dijaga:

No Eligible Player → No Match Lineup

Player
  ↓
Verified
  ↓
Eligible
  ↓
Team Registered
  ↓
Match Squad
  ↓
Lineup

Dan:

No Valid Match Result → No Official Standings Update

30. System State Machine

Keseluruhan sistem:

REGISTRATION
      ↓
VERIFICATION
      ↓
ELIGIBILITY
      ↓
COMPETITION
      ↓
MATCH
      ↓
RESULT
      ↓
STANDINGS
      ↓
PUBLICATION

Setiap tahap memiliki state machine sendiri.

31. MVP

MVP harus mencakup:

Admin

 Login

 Dashboard

 Kontingen

 Tim

 Pemain

 Official

 Dokumen

 Verification

 Eligibility

Competition

 Category

 Group

 Schedule

 Match

 Result

 Standings

Public

 Home

 Teams

 Schedule

 Results

 Standings

 Match detail

Security

 RBAC

 Permission

 Scope

 Audit

 RLS

32. Definition of Done

Sebuah modul dianggap selesai jika:

Functional
✓ Business rules implemented
✓ API implemented
✓ UI implemented
✓ Validation implemented

Security
✓ Authentication
✓ Authorization
✓ Scope isolation
✓ RLS
✓ Audit

Testing
✓ Unit test
✓ Integration test
✓ Authorization test
✓ Negative test

Documentation
✓ API documentation
✓ Domain documentation
✓ Business rule documentation

33. AI Development Strategy

Kita akan membuat satu source of truth:

MASTER PRODUCT BLUEPRINT
          │
          ├───────────────┐
          ▼               ▼
     Backend Spec      Frontend Spec
          │               │
          ▼               ▼
        TRAE           LOVABLE
          │               │
          └───────┬───────┘
                  ▼
             GITHUB
                  │
                  ▼
              COPILOT
                  │
                  ▼
             TEST / QA

fokus hanya membuat UI

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8a578434-8819-4264-8841-5e145c4da9cd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
