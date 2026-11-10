"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GROUPS = [
  { value: "pharmd_student", label: "Pharm.D student" },
  { value: "trainee", label: "Clinical pharmacy trainee" },
  { value: "clinician", label: "Practicing clinician" },
];

export function EnrolmentForm({ defaultScenarioCount }: { defaultScenarioCount: number }) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState("P-");
  const [group, setGroup] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [facilitator, setFacilitator] = useState("");
  const [scenarioCount, setScenarioCount] = useState(String(defaultScenarioCount));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          group,
          experienceYears: experienceYears === "" ? null : Number(experienceYears),
          facilitator: facilitator || null,
          scenarioCount: Number(scenarioCount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      router.push(`/study/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a usability session</CardTitle>
        <CardDescription>
          Completed by the facilitator. Record the participant ID only — no names are collected by the system.
          Written informed consent must be obtained on paper before this form is submitted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pid">Participant ID</Label>
            <Input
              id="pid"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value.toUpperCase())}
              placeholder="P-001"
              pattern="P-\d{3,}"
              required
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">Format P-001. The same ID always receives the same scenarios.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="group">Participant group</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger id="group">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {GROUPS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="exp">Years of clinical / academic experience</Label>
              <Input
                id="exp"
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="e.g. 2"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="count">Scenarios this session</Label>
              <Select value={scenarioCount} onValueChange={setScenarioCount}>
                <SelectTrigger id="count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fac">Session facilitator (optional)</Label>
            <Input id="fac" value={facilitator} onChange={(e) => setFacilitator(e.target.value)} autoComplete="off" />
          </div>

          <Button type="submit" disabled={loading || !group}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Begin session
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
