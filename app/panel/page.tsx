"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, Plus, Printer, ShieldAlert, Sparkles, X } from "lucide-react";
import { alleleCatalog, GENE_HINTS, sampleProfiles } from "@/lib/engine/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type InputRow = { gene: string; diplotype: string };
type PanelEntry = { drug: string; tier: "critical" | "warning" | "normal" | "info"; phenotypes: { gene: string; phenotype: string | null }[]; recommendation: string | null; needsClinicalContext: boolean };
type PanelResponse = { summary: { critical: number; warning: number; normal: number; info: number; total: number }; entries: PanelEntry[] };

const genes = ["CYP2C19", "CYP2D6", "CYP2C9", "TPMT", "NUDT15", "DPYD", "SLCO1B1", "HLA-B", "HLA-A", "G6PD", "MT-RNR1"];
const tierMeta = {
  critical: { label: "Critical", icon: ShieldAlert, className: "border-destructive/30 bg-destructive/10 text-destructive" },
  warning: { label: "Warning", icon: AlertTriangle, className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  normal: { label: "Normal", icon: CheckCircle2, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  info: { label: "Review", icon: Sparkles, className: "border-primary/30 bg-primary/10 text-primary" },
};

function profileInputs(): InputRow[] {
  const profile = sampleProfiles()[0];
  if (profile?.genotypes) return Object.entries(profile.genotypes).map(([gene, diplotype]) => ({ gene, diplotype }));
  return [{ gene: "CYP2C19", diplotype: "*1/*2" }, { gene: "SLCO1B1", diplotype: "*5/*5" }];
}

export default function PanelPage() {
  const [inputs, setInputs] = useState<InputRow[]>([]);
  const [gene, setGene] = useState("CYP2C19");
  const [diplotype, setDiplotype] = useState("");
  const [result, setResult] = useState<PanelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [normalOpen, setNormalOpen] = useState(false);

  const alleleOptions = useMemo(() => alleleCatalog(gene), [gene]);
  const addGene = () => {
    if (!diplotype.trim()) return;
    setInputs((current) => [...current, { gene, diplotype: diplotype.trim() }]);
    setDiplotype("");
    setResult(null);
  };
  const loadExample = () => { setInputs(profileInputs()); setResult(null); };
  const evaluate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/panel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inputs }) });
      if (!response.ok) throw new Error("Unable to evaluate this patient");
      setResult(await response.json());
    } finally { setLoading(false); }
  };
  const grouped = (result?.entries ?? []).reduce<Record<string, PanelEntry[]>>((groups, entry) => { (groups[entry.tier] ??= []).push(entry); return groups; }, {});

  return <main className="min-h-screen bg-background px-4 py-8 print:bg-white print:px-0 print:py-0 sm:px-8"><div className="mx-auto max-w-6xl space-y-8">
    <header className="flex items-start justify-between gap-4 print:mb-5"><div><p className="text-sm font-medium text-primary">RxGenomics / Full patient check</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Full patient check</h1><p className="mt-2 max-w-2xl text-muted-foreground">Enter a patient&apos;s pharmacogene results once and see every CPIC Level A drug that needs attention.</p></div><Button variant="outline" onClick={() => window.print()} className="print:hidden"><Printer data-icon="inline-start" />Print report</Button></header>
    <section className="grid gap-6 lg:grid-cols-[380px_1fr] print:block">
      <Card className="print:hidden"><CardHeader><CardTitle className="text-lg">Patient profile</CardTitle><p className="text-sm text-muted-foreground">Add one gene at a time using a diplotype or carrier result.</p></CardHeader><CardContent className="flex flex-col gap-5"><Button variant="secondary" onClick={loadExample}><Sparkles data-icon="inline-start" />Load an example patient</Button><div className="flex flex-col gap-3"><Label htmlFor="panel-gene">Gene</Label><Select value={gene} onValueChange={(value) => { setGene(value); setDiplotype(""); }}><SelectTrigger id="panel-gene"><SelectValue /></SelectTrigger><SelectContent>{genes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Label htmlFor="panel-diplotype">Phenotype / allele result</Label><Select value={diplotype} onValueChange={setDiplotype}><SelectTrigger id="panel-diplotype"><SelectValue placeholder={GENE_HINTS[gene] ?? "Choose a result"} /></SelectTrigger><SelectContent>{alleleOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><div className="flex gap-2"><Input value={diplotype} onChange={(event) => setDiplotype(event.target.value)} placeholder={GENE_HINTS[gene] ?? "Or enter a result"} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) addGene(); }} /><Button onClick={addGene} disabled={!diplotype.trim()}><Plus data-icon="inline-start" />Add gene</Button></div></div>{inputs.length > 0 && <div className="flex flex-col gap-2"><Label>Entered results</Label>{inputs.map((item, index) => <div key={`${item.gene}-${index}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"><span><strong>{item.gene}</strong><span className="ml-2 text-muted-foreground">{item.diplotype}</span></span><Button variant="ghost" size="icon" aria-label={`Remove ${item.gene}`} onClick={() => { setInputs((current) => current.filter((_, itemIndex) => itemIndex !== index)); setResult(null); }}><X /></Button></div>)}</div>}<Button size="lg" onClick={evaluate} disabled={!inputs.length || loading}>{loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}{loading ? "Checking patient" : "Check all CPIC Level A drugs"}</Button></CardContent></Card>
      <div className="min-w-0">{!result ? <Card className="flex min-h-[360px] items-center justify-center border-dashed"><CardContent className="max-w-md text-center"><ShieldAlert className="mx-auto size-10 text-muted-foreground/50" /><h2 className="mt-4 text-xl font-semibold">Your patient report will appear here</h2><p className="mt-2 text-sm text-muted-foreground">Add pharmacogene results, then run the full check to group the most important CPIC findings first.</p></CardContent></Card> : <div className="space-y-6"><div className="grid grid-cols-3 gap-3">{(["critical", "warning", "normal"] as const).map((tier) => { const meta = tierMeta[tier]; const Icon = meta.icon; return <Card key={tier} className={meta.className}><CardContent className="p-4"><Icon className="size-5" /><p className="mt-3 text-2xl font-semibold">{result.summary[tier]}</p><p className="text-xs font-medium uppercase tracking-wide">{meta.label}</p></CardContent></Card>; })}</div><div className="flex items-center justify-between border-b pb-3"><div><h2 className="text-xl font-semibold">CPIC Level A findings</h2><p className="text-sm text-muted-foreground">{result.summary.total} drug{result.summary.total === 1 ? "" : "s"} reviewed across your entered genes.</p></div><Badge variant="outline">Sorted by severity</Badge></div>{(["critical", "warning", "info"] as const).map((tier) => grouped[tier]?.length ? <TierGroup key={tier} tier={tier} entries={grouped[tier]} /> : null)}{grouped.normal?.length ? <div className="rounded-xl border"><button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setNormalOpen((open) => !open)} aria-expanded={normalOpen}><span className="font-semibold">Normal findings <span className="ml-2 text-sm font-normal text-muted-foreground">{grouped.normal.length}</span></span><ChevronDown className={`size-5 transition-transform ${normalOpen ? "rotate-180" : ""}`} /></button>{normalOpen && <div className="border-t p-4"><EntryList entries={grouped.normal} /></div>}</div> : null}</div>}</div>
    </section>
  </div></main>;
}

function TierGroup({ tier, entries }: { tier: "critical" | "warning" | "info"; entries: PanelEntry[] }) { const meta = tierMeta[tier]; const Icon = meta.icon; return <section><div className="mb-3 flex items-center gap-2"><Icon className="size-5" /><h3 className="font-semibold">{meta.label}</h3><Badge variant="secondary">{entries.length}</Badge></div><EntryList entries={entries} /></section>; }
function EntryList({ entries }: { entries: PanelEntry[] }) { return <div className="flex flex-col gap-3">{entries.map((entry) => <article key={entry.drug} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold">{entry.drug}</h4><p className="mt-1 text-sm text-muted-foreground">{entry.phenotypes.map((item) => `${item.gene}: ${item.phenotype ?? "Indeterminate"}`).join(" · ")}</p></div><Badge variant="outline">{entry.tier}</Badge></div><p className="mt-3 text-sm leading-6">{entry.recommendation ?? "No CPIC recommendation matched this result."}</p>{entry.needsClinicalContext && <p className="mt-3 border-l-2 border-amber-500 pl-3 text-sm font-medium text-amber-700 dark:text-amber-300">Depends on clinical situation - check this drug individually.</p>}</article>)}</div>; }
