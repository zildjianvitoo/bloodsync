# BloodSync — Phase-by-Phase Delivery Plan

## Phase 0 — Alignment & Foundations (Week 0) ✅

- **Objectives**: Clarify scope, secure infrastructure access, lock acceptance criteria.
- **Deliverables**: Finalized SRS sign-off, project board, environment credentials.
- **Steps**:
  1. Stakeholder kickoff to confirm MVP scope (FR-010..FR-120, FR-140, FR-150, FR-170).
  2. Define success metrics and telemetry pipeline (North Star + leading indicators).
  3. Stand up repository conventions (branching, CI, code quality gates).
  4. Establish UI design direction: health-themed palette, typography tokens, Shadcn component usage guidelines.
  5. Provision sqlite, and secrets management.

### Phase 0 tracker

- [x] MVP scope & acceptance criteria linked to `BloodSync_SRS_EN_V1.txt` (FR-010–FR-170, AC-001–AC-010 confirmed).
- [x] Success metrics telemetry plan drafted (North Star + leading indicators owner + logging targets).
- [x] Repository conventions captured (branch naming, CI steps, lint/test gates).
- [x] UI guardrails documented (palette tokens, typography scale, Shadcn usage playbook).
- [x] Infrastructure checklist populated (SQLite instance, secrets storage, access credentials).

#### Success metrics & telemetry

- **North Star**: Donor-to-completion rate (blood bags/hour) sourced from appointments marked `DONE` vs. start window; emit `event_throughput` metric per event every 5 minutes.
- **Leading indicators**: Track check-in rate, attendance %, avg wait, CSAT/NPS, referral conversion, reminder opt-ins. Each API mutation emits structured log events via `lib/telemetry` to a central logger (e.g. Sentry breadcrumbs + Logflare) with `eventId`, timestamp, and actor role.
- **Instrumentation**: Socket.IO middleware records latency + reconnect stats; check-in, status transitions, survey submissions fire analytics hooks that update Redis counters for kiosk dashboards. Schedule nightly batch export to storage for CSV parity checks.
- **Ownership**: Ops lead monitors dashboards during events; engineering on-call reviews alert thresholds (queue lag >1s, no-show spike >20%).

#### Repository conventions

- **Branches**: `main` reflects release-ready demo state; feature branches use `feat/<ticket>` or `chore/<topic>`. Use squash merge via PR with reviewer sign-off.
- **CI pipeline**: GitHub Actions template running `npm lint`, `npm test`, `npm typecheck`, and Prisma format check. Build must pass before merge.
- **Code quality**: Enforce Prettier + ESLint (Next.js 15) with `@typescript-eslint` rules. Commit messages **must** follow Conventional Commits (`type: summary`) before merge. Include unit or integration tests for business logic touching queueing, rewards, or telemetry.
- **Secrets**: `.env` handled via Doppler/1Password; never commit. Local dev uses `.env.local` ignored by git.

#### UI guardrails

- **Palette**: Base `--brand-primary` blues (`#2F6BFF`), calming mint accents (`#83D9C8`), warm neutral backgrounds (`#F4F6F8`). Maintain WCAG AA contrast; Shadcn `theme.json` tokens capture palette.
- **Typography**: Use Inter (sans) for UI, with 12/14/16/20/24px scale; headings use `font-semibold`, body `font-medium`. Define Tailwind font variables in `globals.css`.
- **Components**: Prefer Shadcn primitives (Button, Card, Tabs, Dialog, Form) for accessibility. Extend via `lib/ui/` wrappers for kiosk vs. mobile surfaces; avoid custom motion unless necessary.
- **Spacing**: Base spacing unit 4px (Tailwind `rem` scale). Kiosk layouts adopt 24px gutters; mobile 16px.

#### Infrastructure checklist

- [x] SQLite dev database seeded via Prisma; staging/production will reuse SQLite file deployments for MVP.
  - Artifacts: `prisma/schema.prisma`, `prisma/seed.mjs`, `.env.example` with `DATABASE_URL=file:./dev.db`.
  - Next action: `npm run db:push && npm run db:seed` (creates `prisma/dev.db`, ignored from git).
- [x] Secrets manager selected (Doppler) with placeholders for JWT secret, push key, Sentry DSN.
- [x] Socket.IO host approach defined: reuse Next.js app server with Socket.IO handler under `/api/socket`, capacity target 1,000 concurrent connections. `SOCKET_HOST_URL=http://localhost:3000` documented in `.env.example`; staging uses same value behind reverse proxy.
- [x] Push notification plan locked: for MVP rely on in-app banners with optional Web Push via VAPID keys (`PUSH_WEB_VAPID_PUBLIC_KEY/PRIVATE_KEY`) stored in Doppler; setup steps captured in README under “Realtime & Notifications”.
- [x] Telemetry sink configured: default console listener via `lib/telemetry` plus optional Sentry DSN env (`SENTRY_DSN`) captured in `.env.example`; alert thresholds noted in Ops notes.
- [x] Staging SQLite database path provisioned: README documents staging path `file:/var/lib/bloodsync/staging.db` plus nightly backup rotation; Doppler stores the staged `DATABASE_URL`.

## Phase 1 — Core Platform Backbone (Week 1) ✅

- **Objectives**: Establish data model, authentication, and realtime plumbing.
- **Deliverables**: Prisma schema, migrations, seeded dev data, Socket.IO scaffolding, shared UI foundation.
- **Steps**:
  1. Model entities Event, Station, Donor, Appointment, Checkin, Feedback, Point, Badge, RewardItem, Redemption.
  2. Implement Prisma migrations; seed sample event, stations, donor tokens.
  3. Configure JWT-based auth for admin/volunteer roles with rate limiting (NFR-050).
  4. Stand up Socket.IO namespaces (`event:{id}:queue`, `event:{id}:kpi`, etc.).
  5. Implement event-driven logging for audit trail groundwork (FR-200 placeholder).

### Phase 1 kickoff focus

- Expose `GET /api/events` using the new Prisma access helpers to unblock kiosk/console UIs.
- Wire a Socket.IO server endpoint under `/api/socket` with simple connection logging.
- Scaffold admin/volunteer layout (App Router nested routes) consuming the events API.
- Integrate Tailwind CSS tokens + Shadcn UI components; swap admin overview/detail to shared UI primitives.

## Phase 2 — Donor Journey Experience (Week 2) ✅

- **Objectives**: Deliver donor-facing flows from check-in to feedback.
- **Deliverables**: QR check-in flow, ticket view with dynamic ETA, PWA shell.
- **Steps**:
  1. Build QR check-in endpoint (`POST /checkin`) with ticket issuance (FR-010).
  2. Implement auto-queue assignment algorithm (FR-020) and ETA calculator (FR-030).
  3. Create donor-facing web screens (Next.js) for ticket, ETA, status updates.
  4. Add Service Worker + offline cache for ticket view (NFR-100).
  5. Integrate push/in-app turn notifications (FR-080) with fallback banners.
  6. Launch CSAT+NPS survey form (FR-110) and schedule poll (FR-120) using Shadcn form primitives for consistency.

## Phase 3 — Operations Console (Week 3) ✅

- **Objectives**: Equip volunteers and organizers with control interfaces.
- **Deliverables**: Volunteer console, organizer broadcast tool, KPI dashboard.
- **Steps**:
  1. Build volunteer screen to advance statuses and view load per station (FR-060).
  2. Implement auto no-show bumping with timers and queue advancement (FR-040).
  3. Deliver live kiosk display with Next 5 donors, counters, progress bar (FR-050).
  4. Enable organizer broadcast endpoint/UI (FR-070) with kiosk/device fan-out.
  5. Construct real-time KPI dashboard (FR-090) backed by Socket.IO updates.
  6. Support CSV exports for check-ins, attendance, feedback (FR-100).

### Phase 3 completion notes

- Volunteer console, kiosk surfaces, auto no-show sweep, broadcasts, and KPI dashboards are live in production code (Ops can already run an event with these tools).
- CSV exports for check-ins/attendance/feedback are wired to `/api/export.csv`, aligning with FR-100.
- Outstanding polish items (e.g., volunteer queue deep-link) are tracked as nice-to-haves but not blocking the ✅.

## Phase 4 — Engagement & Gamification (Week 4)

- **Objectives**: Reinforce donor motivation with tangible rewards and sharing loops.
- **Deliverables**: Points engine, snack reward catalog, badges, leaderboard, reminder scheduling.
- **Steps**:
  1. Implement action points awarding on key events (FR-140).
  2. Build reward catalog administration, inventory tracking, and redemption ledger for snacks/merch (FR-145).
  3. Issue badges (First Drop, Three's a Charm, On-Time) with event listeners (FR-150).
  4. Ship team & individual leaderboard views (FR-160, optional toggle for MVP).
  5. Set up next-donation reminder scheduling with cooldown rules (FR-170).
  6. Capture referral K-factor metrics and hook into KPI dashboard.

### Phase 4 kickoff focus

- Ship the points + rewards ledger (FR-140/145) so donors can earn/redeem snacks and merch safely.
- Implement badge issuance listeners (FR-150) and prep leaderboard scaffolding for teams/individuals (FR-160).
- Build the reminder scheduler + eligibility rules (FR-170) to nudge donors post-event and surface referral/K-factor hooks.

## Phase 5 — Hardening & Compliance (Week 5)

- **Objectives**: Meet non-functional requirements and competition polish.
- **Deliverables**: Accessibility audit, load verification, security posture, documentation.
- **Steps**:
  1. Execute performance testing for 500 kiosk sessions / 1,000 sockets (NFR-080).
  2. Conduct accessibility sweep (WCAG AA) and responsive QA (NFR-020, NFR-030).
  3. Validate reconnection + graceful degradation scenarios (NFR-060).
  4. Integrate observability stack (structured logs, Sentry/error tracking) (NFR-070).
  5. Review privacy compliance: consent flows, hashed contacts, data retention (NFR-040).
  6. Finalize documentation: AGENTS.md, implementation notes, API references.

## Phase 6 — Demo Readiness & Launch (Week 6)

- **Objectives**: Ensure flawless judging experience and fallback plans.
- **Deliverables**: Demo script, practice environment, contingency kits.
- **Steps**:
  1. Rehearse 3-minute demo storyboard (Section 12) with live data.
  2. Prepare sandbox event data + volunteer scripts for judges.
  3. Assemble backup connectivity (hotspot) and kiosk hardware checklist (Risk mitigation).
  4. Validate push-notification opt-out fallbacks (in-app banners, audible callouts).
  5. Package sponsor impact snapshot and KPI highlights for post-demo handoff.
