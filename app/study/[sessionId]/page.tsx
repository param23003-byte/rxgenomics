import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { SessionRunner } from "@/components/study/session-runner";
import { getDb } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { drugCatalog, GENE_HINTS } from "@/lib/engine/catalog";
import { scenariosByIds } from "@/lib/study/assign";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const db = getDb();
  if (!db) notFound();

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session) notFound();

  const scenarios = scenariosByIds(session.scenarioIds);
  if (scenarios.length === 0) notFound();

  return (
    <SessionRunner sessionId={session.id} scenarios={scenarios} drugs={drugCatalog()} hints={GENE_HINTS} />
  );
}
