# Study Mode — Setup and Run Book

Study mode records Phase III usability sessions: task success, time per task,
errors, SUS and TAM. The drug checker works without any of this; only the
`/study` routes need a database.

## One-time setup

1. **Add a Postgres database.** In the Vercel project: Storage → Marketplace →
   Neon. Pick the region closest to Ahmedabad. Vercel sets `DATABASE_URL`
   automatically.
2. **Create the tables.** Open the Neon SQL editor and paste the contents of
   `drizzle/0000_study_tables.sql`, then run it. (Locally you can instead run
   `pnpm exec drizzle-kit push`.)
3. **Set the facilitator token.** In Vercel → Settings → Environment Variables,
   add `STUDY_ADMIN_TOKEN` with a long random value. Without it, the session
   list and CSV export refuse every request.
4. **Turn on Vercel password protection** for the deployment. The token guards
   the export endpoints; password protection keeps the whole study site private.
   The protocol relies on both.
5. **Redeploy**, then open `/study`. If setup is incomplete the page says so.

## Running a session

1. Obtain **written informed consent on paper** first. The system stores no
   names, so consent is not and cannot be captured here.
2. Go to `/study`. Enter the participant ID (`P-001`), group, years of
   experience, and how many scenarios (5–8).
3. Hand the device to the participant. They work through their assigned
   scenarios, then the SUS, then the TAM questionnaire.
4. The session is marked complete when the TAM form is submitted.

The same participant ID always receives the same scenarios, so a session that
has to be restarted is directly comparable. Scenario order is counterbalanced
across participants, and every participant gets at least one *normal* case.

## What is recorded

| Endpoint | Data |
|---|---|
| Per task | scenario, start, submit, duration, answer, correct, input errors, number of evaluations run |
| SUS | all 10 responses and the 0–100 score |
| TAM | all 15 responses, the three construct means, and the open-text answers |
| Session | participant ID, group, experience, platform version, scenarios assigned |

**No names, contact details or patient data are stored at any point.**

Correctness is decided on the server against the frozen expected answer in
`study/scenarios.ts`. The browser never reports whether an answer was right, and
the participant is not told either — telling them would change how they approach
the remaining cases.

Task timings come from the participant's browser. In a supervised session that
is accurate enough, but note it: a participant who leaves the page open while
talking will record a long time for that task. The facilitator should note any
interruption on the paper record.

## Getting the data out

Go to `/study/admin`, enter the facilitator token, then download:

- **Sessions CSV** — one row per participant, with SUS score, TAM construct
  means, task success rate and median time. This is the file to open in SPSS or
  PSPP for the group comparisons.
- **Tasks CSV** — one row per case scenario attempted, for the effectiveness and
  efficiency endpoints.

Both files include `platform_version`, so data collected before and after a
change to the system can always be told apart.

## Before Phase III starts

- Freeze `lib/version.ts` at the version the participants will see, and do not
  change the system mid-phase. Fixes from Phase II feedback belong in Phase IV.
- Run `pnpm test` and `pnpm smoke` against the deployed URL, and keep the output.
- Pilot on about 10 participants first, as the protocol requires for Cronbach's
  α. Decide in advance, and write down, whether pilot participants are included
  in the main analysis.
