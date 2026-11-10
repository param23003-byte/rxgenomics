"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { PgxEvaluator } from "@/components/dashboard/pgx-evaluator";
import { ACTION_LABELS, type ActionAnswer, type Scenario } from "@/study/scenarios";
import type { DrugOption } from "@/lib/engine/catalog";
import type { DrugCheck } from "@/lib/engine/types";

const ACTIONS: ActionAnswer[] = ["use_as_planned", "adjust_dose", "avoid"];

export function SessionRunner({
  sessionId,
  scenarios,
  drugs,
  hints,
}: {
  sessionId: string;
  scenarios: Scenario[];
  drugs: DrugOption[];
  hints: Record<string, string>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenario = scenarios[index];
  const startedAt = useRef<string>(new Date().toISOString());
  const checksRun = useRef(0);
  const inputErrors = useRef(0);

  // Restart the clock and the error counters whenever a new scenario appears.
  useEffect(() => {
    startedAt.current = new Date().toISOString();
    checksRun.current = 0;
    inputErrors.current = 0;
    setAnswer("");
    setError(null);
    window.scrollTo({ top: 0 });
  }, [index]);

  /**
   * An error is any evaluation the participant ran that the system could not
   * act on: an unrecognised allele, a malformed diplotype, or a missing
   * genotype. These are the recoverable mistakes the protocol counts as errors.
   */
  const onResult = useCallback((result: DrugCheck) => {
    checksRun.current += 1;
    const badInput = result.genotypes.some((g) => g.status !== "ok" && g.status !== "indeterminate");
    if (badInput || result.genotypes.length === 0) inputErrors.current += 1;
  }, []);

  async function submit() {
    if (!answer) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/study/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          scenarioId: scenario.id,
          startedAt: startedAt.current,
          submittedAt: new Date().toISOString(),
          answer,
          inputErrors: inputErrors.current,
          checksRun: checksRun.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);

      if (index + 1 < scenarios.length) setIndex(index + 1);
      else router.push(`/study/${sessionId}/sus`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this task");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ClipboardList className="size-4" />
            Case scenario {index + 1} of {scenarios.length}
          </span>
          <span className="font-mono text-xs">{scenario.id}</span>
        </div>
        <Progress value={((index + 1) / scenarios.length) * 100} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinical situation</CardTitle>
          <CardDescription>Read the case, then use RxGenomics to decide what to do.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="leading-7">{scenario.vignette}</p>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pharmacogenomic laboratory report
            </p>
            <p className="mt-1 font-mono text-sm">{scenario.labReport}</p>
          </div>
        </CardContent>
      </Card>

      <PgxEvaluator drugs={drugs} hints={hints} onResult={onResult} />

      <Card>
        <CardHeader>
          <CardTitle>Your decision</CardTitle>
          <CardDescription>
            Based on what RxGenomics returned, what should happen with {scenario.drug}?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <RadioGroup value={answer} onValueChange={setAnswer} className="flex flex-col gap-3">
            {ACTIONS.map((action) => (
              <div key={action} className="flex items-start gap-3 rounded-lg border p-3">
                <RadioGroupItem value={action} id={`${scenario.id}-${action}`} className="mt-0.5" />
                <Label htmlFor={`${scenario.id}-${action}`} className="cursor-pointer font-normal leading-6">
                  {ACTION_LABELS[action]}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Button onClick={submit} disabled={!answer || saving} className="w-full">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {index + 1 < scenarios.length ? "Submit and continue" : "Submit and go to questionnaires"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            You will not be told whether your answer was correct, so that it does not influence the remaining cases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
