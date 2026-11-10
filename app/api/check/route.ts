import { NextResponse } from "next/server";
import { checkDrug } from "@/lib/engine";

/**
 * Genotype + drug -> CPIC phenotype, alert tier and recommendation.
 * All work happens in lib/engine against the frozen CPIC snapshot.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.drug !== "string" || !Array.isArray(body.inputs)) {
    return NextResponse.json(
      { error: "Expected { drug, inputs: [{ gene, diplotype }], population? }" },
      { status: 400 },
    );
  }
  const inputs = body.inputs
    .filter(
      (i: unknown): i is { gene: string; diplotype: string } =>
        typeof (i as { gene?: unknown })?.gene === "string" &&
        typeof (i as { diplotype?: unknown })?.diplotype === "string",
    )
    .slice(0, 5);

  return NextResponse.json(checkDrug(body.drug, inputs, body.population || undefined));
}
