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

## How profiles are created and stored

- When a user signs up via the frontend, the app calls `supabase.auth.signUp(...)` and includes `options.data` with `full_name` and `role`.
- The project includes `supabase/schema.sql` which defines a trigger (`on_auth_user_created`) that automatically inserts a row into `public.profiles` for every new `auth.users` record using the provided metadata.
- To enable this automation you must apply the schema to your Supabase Postgres database. Two ways:

1) From your local machine (requires `DATABASE_URL` in `.env`):

```bash
npm run db:apply-schema
```

2) Or paste the contents of `supabase/schema.sql` into the Supabase project's SQL editor and run it there.

After the schema is applied, any new sign-up will result in a row in `public.profiles` containing `id`, `full_name`, `email`, `role`, and `created_at`.

## New: Generic store endpoint

The server exposes a simple endpoint to store arbitrary JSON into a table. It will create the table if it doesn't exist (with a `data jsonb` column).

- Endpoint: `POST /api/store`
- Body: `{ "table": "table_name", "data": { ... } }`

Example:

```bash
curl -X POST http://localhost:4000/api/store \
	-H "Content-Type: application/json" \
	-d '{"table":"user_payloads","data":{"name":"Alice","score":95}}'
```

Note: table names must be simple identifiers (letters, numbers, underscore).

