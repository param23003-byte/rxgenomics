"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, CircleAlert, CircleCheck, ExternalLink, FlaskConical, Info, Loader2, OctagonAlert, Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { alleleCatalog, isSingleEntryGene, type DrugOption } from "@/lib/engine/catalog";
import type { AlertTier, DrugCheck } from "@/lib/engine/types";

function ScreenTag({ id, visible }: { id: string; visible: boolean }) {
  return visible ? <span className="font-mono text-[10px] tracking-wider text-muted-foreground">SCREEN {id}</span> : null;
}

const tierInfo: Record<AlertTier, { label: string; sentence: string; icon: typeof Info; className: string }> = {
  critical: { label: "Safety alert", sentence: "Avoid this drug", icon: OctagonAlert, className: "border-destructive/40 bg-destructive/10" },
  warning: { label: "Dose adjustment", sentence: "Reduce the dose", icon: CircleAlert, className: "border-amber-500/40 bg-amber-500/10" },
  normal: { label: "No action needed", sentence: "No change needed", icon: CircleCheck, className: "border-emerald-600/40 bg-emerald-600/10" },
  info: { label: "Review guidance", sentence: "Review the guidance", icon: Info, className: "border-border bg-muted" },
};

function SearchSelect({ label, value, options, placeholder, onChange }: { label: string; value: string; options: string[]; placeholder: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={open} className="h-12 justify-between px-4 font-normal"><span className={cn(!value && "text-muted-foreground")}>{value || placeholder}</span><ChevronDown className="size-4 opacity-50" /></Button></PopoverTrigger>
        <PopoverContent className="w-[min(560px,calc(100vw-2rem))] p-0" align="start"><Command><CommandInput placeholder={`Search ${label.toLowerCase()}...`} /><CommandList><CommandEmpty>No matching option.</CommandEmpty><CommandGroup>{options.map((option) => <CommandItem key={option} value={option} onSelect={() => { onChange(option); setOpen(false); }}><Check className={cn("mr-2 size-4", value === option ? "opacity-100" : "opacity-0")} />{option}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
      </Popover>
    </div>
  );
}

export function PgxEvaluator({ drugs, hints, onResult }: { drugs: DrugOption[]; hints: Record<string, string>; onResult?: (result: DrugCheck) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [drugName, setDrugName] = useState("");
  const [genotypes, setGenotypes] = useState<Record<string, string>>({});
  const [freeText, setFreeText] = useState<Record<string, boolean>>({});
  const [population, setPopulation] = useState("");
  const [result, setResult] = useState<DrugCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expert, setExpert] = useState(false);
  const drug = useMemo(() => drugs.find((item) => item.name === drugName), [drugs, drugName]);
  const needsPopulation = !!drug && drug.populations.length > 1;

  useEffect(() => setExpert(new URLSearchParams(window.location.search).get("expert") === "1"), []);

  function selectDrug(name: string) { setDrugName(name); setGenotypes({}); setPopulation(""); setResult(null); setError(null); setStep(2); }
  function setGeneValue(gene: string, value: string) { setGenotypes((current) => ({ ...current, [gene]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!drug || drug.genes.some((gene) => !genotypes[gene])) { setError("Choose a reported result for each gene before continuing."); return; }
    if (needsPopulation && !population) { setError("Choose the clinical context before continuing."); return; }
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ drug: drug.name, inputs: drug.genes.map((gene) => ({ gene, diplotype: genotypes[gene] ?? "" })), population: population || undefined }) });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data: DrugCheck = await response.json(); setResult(data); onResult?.(data); setStep(3);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Something went wrong"); } finally { setLoading(false); }
  }

  const tier = result ? tierInfo[result.tier] : null;
  const rec = result?.primary[0];
  const phenotype = result?.genotypes.filter((item) => item.phenotype).map((item) => `${item.gene}: ${item.phenotype}`).join(" · ");

  return <div className="mx-auto w-full max-w-3xl">
    <div className="mb-8 grid grid-cols-3 gap-2" aria-label="Evaluator steps">
      {["Which drug?", "Genotype report", "What to do"] .map((label, index) => { const number = index + 1; return <div key={label} className={cn("border-t-2 pt-3 text-sm", step >= number ? "border-primary text-foreground" : "border-border text-muted-foreground")}><span className="mr-2 font-mono text-xs">0{number}</span>{label}</div>; })}
    </div>

    {step === 1 && <Card className="animate-in fade-in slide-in-from-right-2 duration-300"><CardHeader className="space-y-4 pb-4"><ScreenTag id="S1" visible={expert} /><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FlaskConical className="size-6" /></div><CardTitle className="text-3xl">Which drug?</CardTitle><CardDescription className="text-base">Choose a medication to see the relevant gene and CPIC-guided options.</CardDescription></CardHeader><CardContent className="flex flex-col gap-8"><SearchSelect label="Drug to evaluate" value={drugName} placeholder="Search all CPIC Level A drugs" options={drugs.map((item) => `${item.name} · ${item.genes.join(", ")}`)} onChange={(value) => selectDrug(value.split(" · ")[0])} /><div className="rounded-xl border border-dashed bg-muted/30 p-5"><p className="text-sm font-medium">Worked example</p><p className="mt-2 text-sm leading-6 text-muted-foreground"><span className="font-medium text-foreground">clopidogrel</span> with <span className="font-mono text-foreground">CYP2C19 *2/*2</span> can lead to <span className="font-medium text-foreground">Avoid this drug</span>.</p></div></CardContent></Card>}

    {step === 2 && drug && <Card className="animate-in fade-in slide-in-from-right-2 duration-300"><CardHeader className="space-y-3"><ScreenTag id="S2" visible={expert} /><CardTitle className="text-3xl">What did the genotype report say?</CardTitle><CardDescription className="text-base">Select the reported allele for each gene. The evaluator will send the same allele pair format used by the rule engine.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-6">
      {drug.genes.map((gene) => { const single = isSingleEntryGene(gene); const options = alleleCatalog(gene); return <div key={gene} className="rounded-xl border bg-muted/20 p-4"><div className="mb-4 flex items-start justify-between gap-4"><div><Label className="text-base">{gene}</Label><p className="mt-1 text-xs text-muted-foreground">{gene === "HLA-A" || gene === "HLA-B" ? "Labs usually report carrier status." : single ? "This gene is X-linked; enter one allele." : "Choose both reported alleles."}</p></div><button type="button" className="text-xs text-primary underline-offset-4 hover:underline" onClick={() => setFreeText((current) => ({ ...current, [gene]: !current[gene] }))}>{freeText[gene] ? "Use allele choices" : "Enter free text instead"}</button></div>{freeText[gene] ? <Input aria-label={`${gene} genotype`} value={genotypes[gene] ?? ""} onChange={(event) => setGeneValue(gene, event.target.value)} placeholder={hints[gene] ?? "Enter the report exactly"} /> : <div className={cn("grid gap-4", single ? "grid-cols-1" : "sm:grid-cols-2")}><SearchSelect label={single ? "Reported allele" : "Allele 1"} value={single ? (genotypes[gene] ?? "") : (genotypes[gene] ?? "").split("/")[0] ?? ""} placeholder="Choose an allele" options={options} onChange={(value) => setGeneValue(gene, single ? value : `${value}/${(genotypes[gene] ?? "").split("/")[1] || ""}`.replace(/\/$/, ""))} />{!single && <SearchSelect label="Allele 2" value={(genotypes[gene] ?? "").split("/")[1] ?? ""} placeholder="Choose an allele" options={options} onChange={(value) => setGeneValue(gene, `${(genotypes[gene] ?? "").split("/")[0] || ""}/${value}`.replace(/^\//, ""))} />}</div>}</div>; })}
      {needsPopulation && <div className="flex flex-col gap-2"><Label htmlFor="population">Clinical context</Label><Select value={population} onValueChange={setPopulation}><SelectTrigger id="population"><SelectValue placeholder="Choose the situation" /></SelectTrigger><SelectContent>{drug.populations.map((item) => <SelectItem key={item} value={item}>{item === "CVI ACS PCI" ? "After a stent for acute coronary syndrome" : item === "CBZ naive" ? "Starting carbamazepine for the first time" : item} <span className="text-muted-foreground">({item})</span></SelectItem>)}</SelectContent></Select></div>}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button><Button type="submit" size="lg" disabled={loading}>{loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Search data-icon="inline-start" />} Check this result</Button></div><p className="text-xs leading-5 text-muted-foreground">Decision-support aid only. Not a substitute for clinical judgment or current prescribing information.</p>
    </form></CardContent></Card>}

    {step === 3 && result && tier && <div className="animate-in fade-in slide-in-from-right-2 duration-300"><Card className={cn("overflow-hidden", tier.className)}><CardHeader className="pb-5"><ScreenTag id="S3" visible={expert} /><div className="flex items-center gap-3"><tier.icon className="size-6" aria-hidden="true" /><Badge variant="outline">{tier.label}</Badge></div><CardTitle className="text-3xl leading-tight">{tier.sentence} with {result.drug}</CardTitle><CardDescription className="text-base text-foreground/75">{phenotype || "The reported result did not resolve to a phenotype."}</CardDescription></CardHeader><CardContent className="flex flex-col gap-5"><div className="rounded-lg bg-background/70 p-4 text-sm leading-6"><p className="font-medium">How it was derived</p>{result.genotypes.map((item) => <p key={item.gene} className="text-muted-foreground">{item.gene}: <span className="font-mono text-foreground">{item.diplotype}</span>{item.phenotype ? ` → ${item.phenotype}` : ""}</p>)}</div>{rec && <details className="group rounded-lg border bg-background/50"><summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium"><span><ScreenTag id="S4" visible={expert} /> <span className="ml-2">Full CPIC recommendation and evidence</span></span><ChevronDown className="size-4 transition-transform group-open:rotate-180" /></summary><div className="flex flex-col gap-3 border-t p-4 text-sm leading-6"><p>{rec.recommendation}</p><p><span className="font-medium">Evidence strength:</span> {rec.classification}</p>{Object.entries(rec.implications).map(([gene, text]) => <p key={gene}><span className="font-medium">Implication ({gene}):</span> {text}</p>)}{rec.comments && <p className="text-muted-foreground">{rec.comments}</p>}<div className="flex flex-wrap gap-3 border-t pt-3">{result.guidelines.map((guideline) => <a key={guideline.url} href={guideline.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">{guideline.name}<ExternalLink className="size-3" /></a>)}</div></div></details>}{result.messages.map((message) => <p key={message} className="text-sm text-foreground/75">{message}</p>)}<Button variant="outline" size="lg" onClick={() => { setStep(1); setDrugName(""); setResult(null); setGenotypes({}); }}><ShieldAlert data-icon="inline-start" /> Check another</Button></CardContent></Card></div>}
  </div>;
}
