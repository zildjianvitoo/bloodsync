# BloodSync

Next.js 15 App Router application for managing Sinergi Fest donor operations.

## Getting Started

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and adjust values as needed:

- `DATABASE_URL=file:./dev.db`
- `SOCKET_HOST_URL=http://localhost:3000`
- `NEXT_PUBLIC_SOCKET_HOST_URL=http://localhost:3000`
- Optional VAPID + Sentry keys.

Regenerate the local SQLite DB any time with:

```bash
npm run db:push
npm run db:seed
```

## Realtime & Notifications

- Socket.IO runs from the Next.js server (`/api/socket`). Ensure `SOCKET_HOST_URL` and `NEXT_PUBLIC_SOCKET_HOST_URL` reflect the deployed domain.
- For Web Push, generate VAPID keys and add them to Doppler (`PUSH_WEB_VAPID_PUBLIC_KEY`, `PUSH_WEB_VAPID_PRIVATE_KEY`). Donors still receive in-app banners if Push is disabled.

## Telemetry

- `lib/telemetry` logs events to the console by default.
- Provide a Sentry DSN via `SENTRY_DSN` to forward errors.
- Configure alert thresholds (queue lag > 1s, socket disconnect spike > 15%) in your monitoring tool of choice.

## Staging SQLite Ops

- Provision a persistent directory on the host (e.g., `/var/lib/bloodsync`).
- Upload a copy of `prisma/dev.db` as `staging.db` during deploy and set `DATABASE_URL=file:/var/lib/bloodsync/staging.db`.
- Nightly backup: `cp staging.db staging-$(date +%Y%m%d).db` and upload to secure storage.
