"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { susAdjective } from "@/lib/study/sus";

type Summary = {
  id: string;
  participantId: string;
  group: string | null;
  scenariosAssigned: number;
  tasksCompleted: number;
  tasksCorrect: number;
  totalErrors: number;
  susScore: number | null;
  startedAt: string;
  completedAt: string | null;
};

export default function StudyAdminPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<{ sessions: Summary[]; totals: { sessions: number; completed: number; meanSus: number | null } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study/sessions", { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sessions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facilitator view</h1>
        <p className="mt-1 text-sm text-muted-foreground">Session progress and data export for analysis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facilitator token</CardTitle>
          <CardDescription>
            The value of STUDY_ADMIN_TOKEN on this deployment. It is not stored by the browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={load} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="token">Token</Label>
              <Input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading || !token}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Load sessions
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Sessions started", value: data.totals.sessions },
              { label: "Sessions completed", value: data.totals.completed },
              {
                label: "Mean SUS",
                value: data.totals.meanSus ?? "—",
                hint: data.totals.meanSus != null ? susAdjective(data.totals.meanSus) : undefined,
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-3xl">{stat.value}</CardTitle>
                  {stat.hint && <CardDescription>{stat.hint}</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export for SPSS / PSPP</CardTitle>
              <CardDescription>
                The session file has one row per participant. The task file has one row per case scenario, for the
                effectiveness and efficiency endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {[
                { dataset: "sessions", label: "Sessions CSV" },
                { dataset: "tasks", label: "Tasks CSV" },
              ].map((d) => (
                <a
                  key={d.dataset}
                  href={`/api/study/export?dataset=${d.dataset}&token=${encodeURIComponent(token)}`}
                  className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-accent"
                >
                  <Download className="size-4" />
                  {d.label}
                </a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    {["Participant", "Group", "Tasks", "Correct", "Errors", "SUS", "Status"].map((h) => (
                      <th key={h} className="py-2 pr-4 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((s) => (
                    <tr key={s.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-mono">{s.participantId}</td>
                      <td className="py-2 pr-4">{s.group?.replace(/_/g, " ") ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {s.tasksCompleted}/{s.scenariosAssigned}
                      </td>
                      <td className="py-2 pr-4">{s.tasksCorrect}</td>
                      <td className="py-2 pr-4">{s.totalErrors}</td>
                      <td className="py-2 pr-4">{s.susScore ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={s.completedAt ? "secondary" : "outline"}>
                          {s.completedAt ? "Complete" : "In progress"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {data.sessions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">
                        No sessions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
