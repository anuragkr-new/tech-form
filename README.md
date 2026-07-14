# Tech Form — JAS Targets Intake

A configurable intake form for collecting JAS Targets requirements, with Google sign-in and an admin panel for managing questions.

## Features

- Google OAuth login (email auto-filled from Google account)
- Dynamic form seeded from the JAS Targets CSV requirements
- Admin panel to edit question text, add/remove dropdown options, and mark fields mandatory
- Submission storage and admin review
- Optional real-time sync of new submissions to Google Sheets

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Create a Google OAuth client at [Google Cloud Console](https://console.cloud.google.com/):
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

3. Fill in `.env`:
   - `AUTH_SECRET` — random string (`openssl rand -base64 32`)
   - `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
   - `ADMIN_EMAILS` — comma-separated admin emails

4. Install and initialize the database:

```bash
npm install
npx prisma db push
npm run db:seed
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Google Sheets sync (optional)

To push every new submission to a Google Sheet:

1. Follow the setup guide in [`google-apps-script/README.md`](google-apps-script/README.md).
2. Add `GOOGLE_SHEETS_WEBHOOK_URL` and `GOOGLE_SHEETS_WEBHOOK_SECRET` to your `.env`.
3. Restart the app.

New rows are appended automatically after each successful form submission. If the Sheets sync fails, the submission is still saved in the database.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run db:seed` — Seed questions from JAS Targets CSV structure
- `npm run db:push` — Push Prisma schema to SQLite database

## Routes

- `/` — Form (requires Google login)
- `/admin` — Question editor and submissions (admin emails only)
- `/login` — Google sign-in page
