# single-file-website-personal

## Contact form deployment

The production contact form uses Vercel serverless endpoints and stores messages in Supabase.

1. Run `supabase/schema.sql` in the Supabase SQL Editor to create the `contact_submissions` table and its row-level security policies.
2. Add these environment variables to the Vercel project for Production (and Preview if needed):
   - `SUPABASE_URL`: the project URL from Supabase Project Settings → API.
   - `SUPABASE_ANON_KEY`: the project's publishable/anon key. Never use the service-role key.
   - `CAPTCHA_SECRET`: a private random secret used to sign captcha challenges. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Redeploy the Vercel project after saving the environment variables.

For local development, copy `.env.example` to `.env`, fill in the same values, and run `npm start`. Without Supabase configured, the local Express server stores entries in `data/contact-submissions.json`; that file is ignored by Git.