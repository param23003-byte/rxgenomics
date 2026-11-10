"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LIKERT_LABELS } from "@/lib/study/sus";

export type LikertItem = { id: string; text: string };

/**
 * Shared 5-point Likert form for the SUS and TAM questionnaires.
 *
 * Every item must be answered: a partially completed instrument cannot be
 * scored, and the protocol excludes incomplete responses from analysis, so it
 * is better to prevent one than to discard it afterwards.
 */
export function LikertForm({
  title,
  description,
  items,
  instrument,
  sessionId,
  nextHref,
  openQuestions = [],
}: {
  title: string;
  description: string;
  items: LikertItem[];
  instrument: "SUS" | "TAM";
  sessionId: string;
  nextHref: string;
  openQuestions?: string[];
}) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = items.filter((i) => responses[i.id]).length;
  const complete = answered === items.length;

  async function submit() {
    if (!complete) return;
    setSaving(true);
    setError(null);
    try {
      const payload =
        instrument === "SUS"
          ? { sessionId, instrument, responses: items.map((i) => responses[i.id]) }
          : { sessionId, instrument, responses, openResponses: open };

      const res = await fetch("/api/study/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      router.push(nextHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answers");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {items.map((item, n) => (
            <fieldset key={item.id} className="flex flex-col gap-3 border-b pb-5 last:border-b-0 last:pb-0">
              <legend className="mb-1 leading-6">
                <span className="mr-2 text-sm text-muted-foreground">{n + 1}.</span>
                {item.text}
              </legend>
              <RadioGroup
                value={String(responses[item.id] ?? "")}
                onValueChange={(v) => setResponses((r) => ({ ...r, [item.id]: Number(v) }))}
                className="flex flex-col gap-2 sm:flex-row sm:justify-between"
              >
                {LIKERT_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center gap-2 sm:flex-col sm:gap-1.5 sm:text-center">
                    <RadioGroupItem value={String(i + 1)} id={`${item.id}-${i + 1}`} />
                    <Label
                      htmlFor={`${item.id}-${i + 1}`}
                      className="cursor-pointer text-xs font-normal leading-4 text-muted-foreground sm:max-w-20"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
          ))}
        </CardContent>
      </Card>

      {openQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>In your own words</CardTitle>
            <CardDescription>Optional, but very useful. There are no wrong answers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {openQuestions.map((q, i) => (
              <div key={q} className="flex flex-col gap-2">
                <Label htmlFor={`open-${i}`} className="font-normal leading-6">
                  {q}
                </Label>
                <Textarea
                  id={`open-${i}`}
                  value={open[`Q${i + 1}`] ?? ""}
                  onChange={(e) => setOpen((o) => ({ ...o, [`Q${i + 1}`]: e.target.value }))}
                  rows={3}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <Button onClick={submit} disabled={!complete || saving} size="lg">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {complete ? "Submit" : `Answer all ${items.length} statements (${answered} done)`}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
