# Deena Health Hub · Doctor Registration

Next.js 15 (App Router) + Neon Postgres. No other services.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (Neon), `ADMIN_PASSWORD`, `SESSION_SECRET`
3. `npm run db:migrate`
4. `npm run dev` → form at `/`, admin at `/admin`

## Deploy (Vercel)
Add the same three env vars, deploy. Vercel caps request bodies at 4.5 MB, so limits are licence 3 MB + photo 1.5 MB (photo is resized client-side to ~900px).

## Notes
- Files are stored as `bytea` in `application_files` and only served via the auth-gated `/admin/files/[id]/[kind]`.
- File type is verified from magic bytes server-side, not the client MIME.
- Duplicate emails are rejected (unique index). A hidden honeypot field catches basic bots.
- To move files to R2/S3 later, only the insert in `api/applications/route.ts` and `admin/files/.../route.ts` change.
