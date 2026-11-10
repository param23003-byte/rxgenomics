import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { questionnaireResponses, sessions } from "@/lib/db/schema";
import { SUS_ITEMS, scoreSus } from "@/lib/study/sus";
import { TAM_ITEMS, scoreTam } from "@/lib/study/tam";

/** Stores a completed SUS or TAM questionnaire, scored on the server. */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Study database is not configured." }, { status: 503 });

  const body = await req.json().catch(() => null);
  const instrument = body?.instrument;
  if (typeof body?.sessionId !== "string") return NextResponse.json({ error: "Missing session." }, { status: 400 });

  try {
    if (instrument === "SUS") {
      const responses: number[] = body.responses;
      if (!Array.isArray(responses)) throw new Error("SUS responses must be an array.");
      const score = scoreSus(responses);
      await db.insert(questionnaireResponses).values({
        sessionId: body.sessionId,
        instrument: "SUS",
        responses: Object.fromEntries(responses.map((v, i) => [`SUS${i + 1}`, v])),
        score,
      });
      return NextResponse.json({ recorded: true, items: SUS_ITEMS.length });
    }

    if (instrument === "TAM") {
      const responses: Record<string, number> = body.responses;
      const subscales = scoreTam(responses);
      const open = body.openResponses;
      await db.insert(questionnaireResponses).values({
        sessionId: body.sessionId,
        instrument: "TAM",
        responses,
        subscales,
        openResponses:
          open && typeof open === "object"
            ? Object.fromEntries(Object.entries(open).map(([k, v]) => [k, String(v).slice(0, 4000)]))
            : null,
      });
      // TAM is the last step, so the session is complete once it is in.
      await db.update(sessions).set({ completedAt: new Date() }).where(eq(sessions.id, body.sessionId));
      return NextResponse.json({ recorded: true, items: TAM_ITEMS.length });
    }

    return NextResponse.json({ error: "Instrument must be SUS or TAM." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid responses." }, { status: 400 });
  }
}
