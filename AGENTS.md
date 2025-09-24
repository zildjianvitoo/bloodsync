# BloodSync — Overview & Requirements

## Executive Overview

- **Purpose**: Real-time operations platform for Sinergi Fest blood donation events to reduce friction, delight donors, and increase completed blood bags per hour.
- **North Star Metric**: Donor-to-completion rate (blood bags/hour).
- **Leading Indicators**: Check-in rate, attendance rate, average wait time, CSAT/NPS, referral conversion, donors setting next-donation reminder.
- **Competition Goal**: Deliver immediate operational impact, standout UX, and demonstrable real-time metrics during judging.

## Stakeholders & Roles

- **Donors**: Check in, track queue status, receive turn alerts, give feedback, earn rewards.
- **Volunteers**: Advance donor status, balance station load, manage on-ground flow.
- **Organizers/Admins**: Monitor KPIs, broadcast updates, configure events and stations.
- **Sponsors/Partners**: Review impact summaries and engagement outcomes.
- **IT/Ops**: Ensure deployment, integrations, and system reliability.

## MVP Scope

- QR check-in and ticketing with dynamic ETA.
- Auto-queue and no-show bumping across stations.
- Live kiosk display with real-time donor queue and metrics.
- Push/in-app notifications for donor turns.
- Volunteer console for advancing donor status.
- Post-donation CSAT+NPS survey, optional comments, schedule polling.
- Gamification: action points, snack reward redemption, badges, leaderboard.
- Real-time KPI dashboard and CSV exports.
- UI aesthetic guardrails: modern, clean health-themed design leveraging Shadcn component library.

## Functional Requirements

- **FR-010** ✅ QR check-in generates queue ticket per event.
- **FR-020** ✅ Auto-queue assignment based on active station capacity.
- **FR-030** ✅ Dynamic ETA = ceil(waiting donors ÷ active stations) × average stage duration.
- **FR-040** Auto no-show bump: mark NO_SHOW after grace period and advance queue.
- **FR-050** ✅ Live kiosk display: Next 5 donors, counters, progress bar, average ETA.
- **FR-060** Volunteer console: advance donor through Waiting → Screening → Donation → Done.
- **FR-070** Organizer broadcast messages push to kiosk and donor devices.
- **FR-080** Turn notifications via push or in-app fallback when donor is called.
- **FR-090** Real-time KPI dashboard (check-in rate, attendance, avg wait, throughput, target progress).
- **FR-100** CSV export for check-ins, attendance, feedback.
- **FR-110** CSAT+NPS micro-survey with optional 120-character comment.
- **FR-120** Schedule polling for preferred future time slots.
- **FR-130** Comment moderation: private storage, aggregate surfacing only.
- **FR-140** Action points: sign-up +5, attend +20, complete +50, referral +15.
- **FR-145** Reward redemption: donors exchange accumulated points for event perks (e.g., snacks, merch) with inventory and eligibility controls.
- **FR-150** Badges: First Drop, Three's a Charm (3×), On-Time.
- **FR-160** Teams & leaderboard (could-have) for team and individual rankings.
- **FR-170** Next-donation reminder push when donor becomes eligible again.
- **FR-180** Consent & Terms of Service with minimum data capture (hashed contact info).
- **FR-190** Admin management: events, stations, role-based access.
- **FR-200** Audit trail logging key status changes and critical actions.

## Non-Functional Requirements

- **Latency**: ≤1 second end-to-end for queue and kiosk updates.
- **Responsiveness**: Optimized for 360px mobile through fullscreen kiosk displays.
- **Accessibility**: Meet WCAG AA contrast and keyboard/focus standards.
- **Privacy**: Store minimal personal data; hash contact info; no medical records.
- **Security**: Rate-limit public endpoints; JWT auth for admins/volunteers.
- **Reliability**: Graceful handling of station failure; automatic reconnection.
- **Observability**: Structured logs, KPI metrics, error tracking (e.g., Sentry).
- **Performance**: Support 500 kiosk sessions and 1,000 concurrent sockets.
- **Internationalization**: Ready for Indonesian and English UI copy.
- **PWA**: Installable with offline cache for ticket/turn info (read-only).
- **UI Styling**: Calm health-clinic palette, high legibility, consistent spacing; Shadcn components for key forms and inputs to ensure accessibility. Forms should be implemented with React Hook Form + Shadcn Form primitives for consistent validation UX.

## Data Model Snapshot

- **Event**(id, name, targetUnits, startAt, endAt)
- **Station**(id, eventId → Event, type['SCREENING'|'DONOR'], isActive)
- **Donor**(id, name, phoneHash, bloodType?, lastDonationAt?)
- **Appointment**(id, eventId → Event, donorId → Donor, slotTime, status['BOOKED'|'CHECKED_IN'|'SCREENING'|'DONOR'|'DONE'|'NO_SHOW'])
- **Screening**(id, appointmentId → Appointment, answersJson, riskFlags)
- **Checkin**(id, appointmentId → Appointment, timestamp)
- **Feedback**(id, eventId → Event, donorId → Donor, csat, nps, comment)
- **Point**(id, donorId → Donor, value, source)
- **Badge**(id, donorId → Donor, key)
- **RewardItem**(id, name, cost, stock, isActive, sponsorId?)
- **Redemption**(id, donorId → Donor, rewardItemId → RewardItem, cost, status['RESERVED'|'FULFILLED'|'CANCELLED'], fulfilledBy?)
- **Team**(id, name), **TeamMember**(teamId → Team, donorId → Donor), **TeamPoint**(teamId → Team, value)

## API & Realtime Interfaces

- `POST /checkin { eventId, donorToken }` → ticket(queueNo, station, eta)
- `PATCH /appointments/:id/status { status }` → updated appointment state
- `GET /events/:id/kpi` → { checkInRate, attendanceRate, avgWait, throughput, targetProgress }
- `POST /feedback { csat, nps, comment }`
- `POST /poll/:id/respond { optionId }`
- `POST /broadcast { message, level }`
- `GET /leaderboard?scope=team|individual`
- `GET /export.csv?type=checkins|feedback|attendance`
- WebSocket channels: `event:{id}:queue`, `event:{id}:kpi`, `kiosk:{id}:display`, `donor:{id}:notify`

## Core Algorithms & Logic

- **ETA**: `ceil(people_in_front / active_stations) × avg_stage_duration` (by stage type).
- **Auto No-Show**: If BOOKED/CHECKED_IN exceeds grace window from slotTime/lastUpdate, mark NO_SHOW and advance queue.
- **Referral K-Factor**: Track invites × conversion; surface metric when enabled.
- **Reward Ledger**: Deduct points atomically on redemption; enforce stock and cooldown per item.

## Architecture & Deployment Assumptions

- **Stack**: Next.js 15 (App Router) front-end, Prisma ORM, SQLite, Tailwind v4, Shadcn UI kit (forms/layout), React Query, Socket.IO realtime, PWA with Service Worker.
- **Hosting Targets**: Frontend (Vercel/Netlify), Backend (Railway/Render/VPS), Database (SQLite on persistent volume), optional Redis for queue/state caching.
- **Security Baseline**: HTTPS everywhere, strict CORS, JWT with roles, rate limiting, audit logging, double-entry reward ledger to prevent fraud.

## Roadmap Focus

- **MVP (Event Day)**: FR-010–FR-120, FR-140, FR-150, FR-170, NFR-010–NFR-050.
- **V1.1 (Post-Event)**: Team leaderboard, enhanced exports, sponsor report, optional volunteer time-banking.

## Suggested Workflow Practices

- Commit and push after completing each task. Every commit **must** use a Conventional Commit message (`type: short summary`, e.g., `feat: add friend request flow`).
- Centralize fetch/service logic under `lib/api/` modules so components stay declarative and reuse consistent request helpers.
