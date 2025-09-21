# BloodSync — Phase-by-Phase Delivery Plan

## Phase 0 — Alignment & Foundations (Week 0)

- **Objectives**: Clarify scope, secure infrastructure access, lock acceptance criteria.
- **Deliverables**: Finalized SRS sign-off, project board, environment credentials.
- **Steps**:
  1. Stakeholder kickoff to confirm MVP scope (FR-010..FR-120, FR-140, FR-150, FR-170).
  2. Define success metrics and telemetry pipeline (North Star + leading indicators).
  3. Stand up repository conventions (branching, CI, code quality gates).
  4. Establish UI design direction: health-themed palette, typography tokens, Shadcn component usage guidelines.
  5. Provision Supabase/PostgreSQL, Vercel/Render projects, and secrets management.
  6. Set up sprint board with stories mapped to acceptance checks AC-001..AC-010.

## Phase 1 — Core Platform Backbone (Week 1)

- **Objectives**: Establish data model, authentication, and realtime plumbing.
- **Deliverables**: Prisma schema, migrations, seeded dev data, Socket.IO scaffolding.
- **Steps**:
  1. Model entities Event, Station, Donor, Appointment, Checkin, Feedback, Point, Badge, RewardItem, Redemption.
  2. Implement Prisma migrations; seed sample event, stations, donor tokens.
  3. Configure JWT-based auth for admin/volunteer roles with rate limiting (NFR-050).
  4. Stand up Socket.IO namespaces (`event:{id}:queue`, `event:{id}:kpi`, etc.).
  5. Implement event-driven logging for audit trail groundwork (FR-200 placeholder).

## Phase 2 — Donor Journey Experience (Week 2)

- **Objectives**: Deliver donor-facing flows from check-in to feedback.
- **Deliverables**: QR check-in flow, ticket view with dynamic ETA, PWA shell.
- **Steps**:
  1. Build QR check-in endpoint (`POST /checkin`) with ticket issuance (FR-010).
  2. Implement auto-queue assignment algorithm (FR-020) and ETA calculator (FR-030).
  3. Create donor-facing web screens (Next.js) for ticket, ETA, status updates.
  4. Add Service Worker + offline cache for ticket view (NFR-100).
  5. Integrate push/in-app turn notifications (FR-080) with fallback banners.
  6. Launch CSAT+NPS survey form (FR-110) and schedule poll (FR-120) using Shadcn form primitives for consistency.

## Phase 3 — Operations Console (Week 3)

- **Objectives**: Equip volunteers and organizers with control interfaces.
- **Deliverables**: Volunteer console, organizer broadcast tool, KPI dashboard.
- **Steps**:
  1. Build volunteer screen to advance statuses and view load per station (FR-060).
  2. Implement auto no-show bumping with timers and queue advancement (FR-040).
  3. Deliver live kiosk display with Next 5 donors, counters, progress bar (FR-050).
  4. Enable organizer broadcast endpoint/UI (FR-070) with kiosk/device fan-out.
  5. Construct real-time KPI dashboard (FR-090) backed by Socket.IO updates.
  6. Support CSV exports for check-ins, attendance, feedback (FR-100).

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
