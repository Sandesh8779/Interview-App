# InterviewFlow

InterviewFlow is a full-stack interview management application with three modules:

- Admin: manage users, assign roles, and schedule interviews.
- Interviewer: add questions and review submitted answers.
- Candidate: view assigned interviews and submit answers.

## Tech Stack

- Frontend: React + Vite
- Backend: Express
- Database/Auth: Supabase

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create a Supabase project.

3. Open Supabase SQL Editor and run:

```sql
-- paste the contents of supabase/schema.sql
```

4. Copy `.env.example` to `.env` and add your Supabase URL, anon key, and service role key.

5. Start the app.

```bash
npm run dev
```

The frontend runs at `http://127.0.0.1:5173` and the backend runs at `http://127.0.0.1:4000`.

## First Admin

Create an account from the sign-up page and choose the Admin module. After that, use the People panel to assign other users as interviewers or candidates.

## Important Supabase Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` only on the backend. Never expose it in frontend code.
- The frontend uses only `VITE_SUPABASE_ANON_KEY`.
- The backend checks the logged-in user and role before each protected action.

