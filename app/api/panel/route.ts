import { NextResponse } from "next/server";
import { checkPanel, panelSummary } from "@/lib/engine/panel";

/**
 * Reverse check: a genotype panel in, every Level A drug it affects out.
 * Response entries are ordered most severe first.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.inputs)) {
    return NextResponse.json({ error: "Expected { inputs: [{ gene, diplotype }] }" }, { status: 400 });
  }

  const inputs = body.inputs
    .filter(
      (i: unknown): i is { gene: string; diplotype: string } =>
        typeof (i as { gene?: unknown })?.gene === "string" &&
        typeof (i as { diplotype?: unknown })?.diplotype === "string",
    )
    .slice(0, 25);

  const entries = checkPanel(inputs);
  return NextResponse.json({ summary: panelSummary(entries), entries });
}
