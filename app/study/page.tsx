import { EnrolmentForm } from "@/components/study/enrolment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDbConfigured } from "@/lib/db";
import { DEFAULT_SCENARIOS_PER_PARTICIPANT } from "@/lib/study/assign";

export default function StudyStartPage() {
  if (!isDbConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Study mode is not set up on this deployment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Sessions cannot be recorded until a database is connected. Add a Postgres database to the project (Vercel
            Marketplace → Neon), which sets <code className="font-mono">DATABASE_URL</code>, then run the migration in{" "}
            <code className="font-mono">drizzle/0000_study_tables.sql</code> and redeploy.
          </p>
          <p>
            Also set <code className="font-mono">STUDY_ADMIN_TOKEN</code>, which protects the facilitator export.
          </p>
          <p>The drug checker works without a database and is unaffected.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usability session</h1>
        <p className="mt-1 text-sm text-muted-foreground">Phase III — user usability testing.</p>
      </div>
      <EnrolmentForm defaultScenarioCount={DEFAULT_SCENARIOS_PER_PARTICIPANT} />
    </div>
  );
}
