import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { participants, sessions } from "@/lib/db/schema";
import { assignScenarios, DEFAULT_SCENARIOS_PER_PARTICIPANT } from "@/lib/study/assign";
import { PLATFORM_VERSION } from "@/lib/version";

const GROUPS = ["pharmd_student", "trainee", "clinician"] as const;

/** Enrols a participant (by study ID only) and opens a session. */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Study database is not configured. Set DATABASE_URL on the deployment." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const participantId = typeof body?.participantId === "string" ? body.participantId.trim().toUpperCase() : "";
  const group = body?.group;
  const experienceYears = body?.experienceYears;
  const scenarioCount = Number(body?.scenarioCount) || DEFAULT_SCENARIOS_PER_PARTICIPANT;

  if (!/^P-\d{3,}$/.test(participantId)) {
    return NextResponse.json({ error: "Participant ID must look like P-001." }, { status: 400 });
  }
  if (!GROUPS.includes(group)) {
    return NextResponse.json({ error: `Group must be one of: ${GROUPS.join(", ")}` }, { status: 400 });
  }
  if (experienceYears != null && (typeof experienceYears !== "number" || experienceYears < 0 || experienceYears > 60)) {
    return NextResponse.json({ error: "Years of experience must be between 0 and 60." }, { status: 400 });
  }
  if (scenarioCount < 5 || scenarioCount > 8) {
    return NextResponse.json({ error: "The protocol allows 5 to 8 scenarios per participant." }, { status: 400 });
  }

  const existing = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
  if (existing.length === 0) {
    await db.insert(participants).values({ id: participantId, group, experienceYears: experienceYears ?? null });
  }

  const scenarioIds = assignScenarios(participantId, scenarioCount).map((s) => s.id);
  const [session] = await db
    .insert(sessions)
    .values({
      participantId,
      facilitator: typeof body?.facilitator === "string" ? body.facilitator.slice(0, 120) : null,
      platformVersion: PLATFORM_VERSION,
      scenarioIds,
    })
    .returning();

  return NextResponse.json({ sessionId: session.id, scenarioIds });
}
