"use client";

import { useMemo, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  FlaskConical,
  Info,
  Loader2,
  OctagonAlert,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DrugOption } from "@/lib/engine/catalog";
import type { AlertTier, DrugCheck } from "@/lib/engine/types";

/**
 * Screen tags S1-S4 let expert CVI ratings and heuristic-evaluation findings
 * refer to a specific output screen without ambiguity.
 */
function ScreenTag({ id }: { id: string }) {
  return <span className="font-mono text-[10px] tracking-wider text-muted-foreground/70">SCREEN {id}</span>;
}

const TIER: Record<AlertTier, { label: string; icon: typeof Info; className: string }> = {
  critical: {
    label: "Critical alert",
    icon: OctagonAlert,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  warning: {
    label: "Warning",
    icon: CircleAlert,
    className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  normal: {
    label: "No change needed",
    icon: CircleCheck,
    className: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  info: { label: "No recommendation", icon: Info, className: "border-border bg-muted text-muted-foreground" },
};

export function PgxEvaluator({
  drugs,
  hints,
  onResult,
}: {
  drugs: DrugOption[];
  hints: Record<string, string>;
  /** Study mode hook: fires after every check so a session can log errors. */
  onResult?: (result: DrugCheck) => void;
}) {
  const [drugName, setDrugName] = useState("");
  const [genotypes, setGenotypes] = useState<Record<string, string>>({});
  const [population, setPopulation] = useState("");
  const [result, setResult] = useState<DrugCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drug = useMemo(() => drugs.find((d) => d.name === drugName), [drugs, drugName]);
  const needsPopulation = !!drug && drug.populations.length > 1;

  function selectDrug(name: string) {
    setDrugName(name);
    setGenotypes({});
    setPopulation("");
    setResult(null);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!drug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drug: drug.name,
          inputs: drug.genes.map((gene) => ({ gene, diplotype: genotypes[gene] ?? "" })),
          population: population || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: DrugCheck = await res.json();
      setResult(data);
      onResult?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const tier = result ? TIER[result.tier] : null;
  const TierIcon = tier?.icon ?? Info;
  const rec = result?.primary[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* S1 - input */}
      <Card className="h-fit">
        <CardHeader>
          <ScreenTag id="S1" />
          <CardTitle>Patient genotype</CardTitle>
          <CardDescription>Enter the result exactly as written on the laboratory report.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="drug">Drug to prescribe</Label>
              <Select value={drugName} onValueChange={selectDrug}>
                <SelectTrigger id="drug">
                  <SelectValue placeholder="Select a drug" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {drugs.map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name} · {d.genes.join(", ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {drug?.genes.map((gene) => (
              <div key={gene} className="flex flex-col gap-2">
                <Label htmlFor={`g-${gene}`}>{gene} result</Label>
                <Input
                  id={`g-${gene}`}
                  value={genotypes[gene] ?? ""}
                  onChange={(e) => setGenotypes((g) => ({ ...g, [gene]: e.target.value }))}
                  placeholder={`e.g. ${hints[gene] ?? "*1/*2"}`}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ))}
            {drug && drug.genes.length > 1 && (
              <p className="text-xs text-muted-foreground">Leave a gene blank if it was not tested.</p>
            )}

            {needsPopulation && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="population">Clinical context</Label>
                <Select value={population} onValueChange={setPopulation}>
                  <SelectTrigger id="population">
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    {drug.populations.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  CPIC gives different advice for this drug depending on the clinical situation.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!drug || loading || (needsPopulation && !population)}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Evaluate
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs leading-5 text-muted-foreground">
              Decision-support aid only. Not a substitute for clinical judgment, a complete medication review, or
              current prescribing information.
            </p>
          </form>
        </CardContent>
      </Card>

      {!result ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted p-4">
              <FlaskConical className="size-7 text-muted-foreground" />
            </div>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              The phenotype, alert and CPIC recommendation will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* S2 - phenotype */}
          <Card>
            <CardHeader>
              <ScreenTag id="S2" />
              <CardTitle>Phenotype</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {result.genotypes.length === 0 && (
                <p className="text-sm text-muted-foreground">No genotype entered.</p>
              )}
              {result.genotypes.map((g) => (
                <div key={g.gene} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {g.gene} <span className="font-mono text-sm text-muted-foreground">{g.diplotype}</span>
                    </span>
                    {g.phenotype && <Badge variant="secondary">{g.phenotype}</Badge>}
                  </div>
                  {g.activityScore && (
                    <p className="mt-1 text-sm text-muted-foreground">Activity score: {g.activityScore}</p>
                  )}
                  {g.status !== "unknown-allele" && g.alleles.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {g.alleles.map((a) => `${a.name}: ${a.function ?? "function not assigned"}`).join(" · ")}
                    </p>
                  )}
                  {g.messages.map((m) => (
                    <p
                      key={m}
                      className={cn("mt-1 text-sm", g.status === "ok" ? "text-muted-foreground" : "text-destructive")}
                    >
                      {m}
                    </p>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* S3 - alert */}
          <div className={cn("rounded-xl border p-4", tier!.className)} role="status">
            <ScreenTag id="S3" />
            <div className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold">
              <TierIcon className="size-5" />
              {tier!.label}
              <span className="font-normal">· {result.drug}</span>
            </div>
            {rec && <p className="mt-1 text-sm font-medium text-foreground">{rec.recommendation}</p>}
            {result.messages.map((m) => (
              <p key={m} className="mt-1 text-sm text-foreground/80">
                {m}
              </p>
            ))}
          </div>

          {/* S4 - recommendation and evidence */}
          {rec && (
            <Card>
              <CardHeader>
                <ScreenTag id="S4" />
                <CardTitle>CPIC recommendation</CardTitle>
                <CardDescription>
                  Evidence strength: <strong>{rec.classification}</strong>
                  {rec.population !== "general" && <> · Context: {rec.population}</>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {Object.entries(rec.implications).map(([gene, text]) => (
                  <p key={gene}>
                    <span className="font-medium">Implication ({gene}):</span> {text}
                  </p>
                ))}
                {rec.comments && <p className="text-muted-foreground">{rec.comments}</p>}
                {result.primary.length > 1 && (
                  <p className="text-muted-foreground">
                    CPIC gives {result.primary.length} recommendations for this result; the first is shown.
                  </p>
                )}
                <div className="flex flex-wrap gap-3 border-t pt-3">
                  {result.guidelines.map((g) => (
                    <a
                      key={g.url}
                      href={g.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {g.name} <ExternalLink className="size-3" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
