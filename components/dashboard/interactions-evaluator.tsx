"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ExternalLink, FlaskConical, Info, Search, ShieldAlert } from "lucide-react"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculatePhenotype, GENE_REGISTRY, getPhenotypeDetails } from "@/lib/pharmacogenomics"

type Mode = "alleles" | "phenotype"
type Risk = "high" | "moderate" | "standard"

const drugs = [
  { name: "Clopidogrel", gene: "CYP2C19", riskPhenotypes: ["Poor Metabolizer", "Intermediate Metabolizer"], recommendation: "Consider prasugrel or ticagrelor; standard clopidogrel may provide inadequate platelet inhibition.", source: "CPIC 2022", context: "After a stent for acute coronary syndrome" },
  { name: "Codeine", gene: "CYP2D6", riskPhenotypes: ["Ultrarapid Metabolizer", "Poor Metabolizer"], recommendation: "Avoid codeine. Select an alternative analgesic with a predictable metabolic pathway.", source: "CPIC 2020", context: "Choosing an opioid for pain relief" },
  { name: "Tacrolimus", gene: "CYP3A5", riskPhenotypes: ["CYP3A5 Expressor"], recommendation: "Consider a higher starting dose and monitor trough concentrations closely.", source: "CPIC 2022", context: "Starting immunosuppression after transplant" },
  { name: "Warfarin", gene: "CYP2C9", riskPhenotypes: ["Variant carrier"], recommendation: "Use a validated pharmacogenetic dosing algorithm and monitor INR closely.", source: "CPIC 2017", context: "Starting anticoagulation for a clot" },
  { name: "Simvastatin", gene: "SLCO1B1", riskPhenotypes: ["Decreased Function"], recommendation: "Use a lower dose or consider an alternative statin to reduce myopathy risk.", source: "CPIC 2022", context: "Choosing a statin to lower cholesterol" },
]

const phenotypeOptionsByGene: Record<string, string[]> = Object.fromEntries(Object.entries(GENE_REGISTRY).map(([gene, data]) => [gene, Object.keys(data.phenotypes)]))

function riskFor(drugName: string, phenotype: string): Risk {
  const drug = drugs.find((item) => item.name === drugName)
  if (!drug || !phenotype) return "standard"
  if (drug.riskPhenotypes.includes(phenotype)) return drug.name === "Tacrolimus" ? "moderate" : "high"
  return "standard"
}

function SearchableSelect({ label, value, options, onChange, description }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; description?: string }) {
  const [open, setOpen] = useState(false)
  return <div className="flex flex-col gap-2"><label className="text-sm font-medium" htmlFor={`${label}-select`}>{label}</label><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button id={`${label}-select`} type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal"><span className="truncate">{options.find((option) => option.value === value)?.label ?? "Choose an option"}</span><ChevronDown className="opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start"><Command><CommandInput placeholder={`Search ${label.toLowerCase()}...`} /><CommandList><CommandEmpty>No matching options.</CommandEmpty><CommandGroup>{options.map((option) => <CommandItem key={option.value} value={`${option.value} ${option.label}`} onSelect={() => { onChange(option.value); setOpen(false) }}><Check className={value === option.value ? "opacity-100" : "opacity-0"} />{option.label}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover>{description && <p className="text-xs text-muted-foreground">{description}</p>}</div>
}

export function InteractionsEvaluator() {
  const [mode, setMode] = useState<Mode>("alleles")
  const [drugName, setDrugName] = useState("Clopidogrel")
  const [allele1, setAllele1] = useState("*1")
  const [allele2, setAllele2] = useState("*2")
  const [phenotype, setPhenotype] = useState("Intermediate Metabolizer")
  const [evaluated, setEvaluated] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const drug = drugs.find((item) => item.name === drugName) ?? drugs[0]
  const alleles = (GENE_REGISTRY[drug.gene]?.commonAlleles ?? []).map((allele) => ({ value: allele.name, label: `${allele.name} · ${allele.description}` }))
  const derivedPhenotype = useMemo(() => {
    if (mode === "phenotype") return phenotype
    if (drug.gene === "CYP2C19") {
      if (allele1 === "*2" && allele2 === "*2") return "Poor Metabolizer"
      if (allele1 === "*2" || allele2 === "*2" || allele1 === "*3" || allele2 === "*3" || allele1 === "*4" || allele2 === "*4") return "Intermediate Metabolizer"
    }
    return calculatePhenotype(allele1, allele2, drug.gene)
  }, [allele1, allele2, drug.gene, mode, phenotype])
  const currentRisk = evaluated ? riskFor(drugName, derivedPhenotype) : "standard"
  const details = getPhenotypeDetails(derivedPhenotype, drug.gene)

  function selectDrug(value: string) {
    const next = drugs.find((item) => item.name === value) ?? drugs[0]
    setDrugName(value); setPhenotype(phenotypeOptionsByGene[next.gene]?.[0] ?? "Normal Function"); setAllele1("*1"); setAllele2(next.gene === "CYP2C19" ? "*2" : "*1"); setEvaluated(false)
  }

  return <SidebarProvider><AppSidebar /><SidebarInset><header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4"><SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 h-4" /><Breadcrumb><BreadcrumbList><BreadcrumbItem className="hidden md:block"><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator className="hidden md:block" /><BreadcrumbItem><BreadcrumbPage>Drug-Gene Interaction</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb></header><main className="flex-1 overflow-auto bg-background"><div className="container max-w-7xl px-4 py-8 md:px-6 lg:px-8"><div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary"><FlaskConical /> Clinical pharmacogenomics</div><h1 className="text-3xl font-semibold tracking-tight">Drug-gene interaction evaluator</h1><p className="mt-2 max-w-2xl leading-6 text-muted-foreground">Choose a medication and enter the patient&apos;s result to get a clear, guideline-based next step.</p></div><Badge variant="outline" className="w-fit gap-2 px-3 py-1.5"><Info /> Clinical decision support</Badge></div><div className="mb-6 rounded-lg border border-dashed bg-muted/30 p-4"><p className="text-sm font-semibold">Worked example</p><p className="mt-1 text-sm text-muted-foreground">Try the pre-filled example: clopidogrel with CYP2C19 <span className="font-medium text-foreground">*1/*2</span>. It shows how a reduced-function result can change the medication recommendation.</p></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]"><Card><CardHeader><CardTitle>Evaluate a medication</CardTitle><CardDescription>Start with the medication, then enter either the allele result or a known phenotype.</CardDescription><div className="flex gap-2 pt-3"><Button type="button" variant={mode === "alleles" ? "default" : "outline"} onClick={() => setMode("alleles")}>Allele result</Button><Button type="button" variant={mode === "phenotype" ? "default" : "outline"} onClick={() => setMode("phenotype")}>Known phenotype</Button></div></CardHeader><CardContent className="flex flex-col gap-5"><SearchableSelect label="Medication" value={drugName} onChange={selectDrug} options={drugs.map((item) => ({ value: item.name, label: `${item.name} · ${item.gene}` }))} description={drug.context} />{mode === "alleles" ? <div className="grid gap-4 sm:grid-cols-2"><SearchableSelect label="Allele 1" value={allele1} onChange={(value) => { setAllele1(value); setEvaluated(false) }} options={alleles} description="Select the first allele from the lab report." /><SearchableSelect label="Allele 2" value={allele2} onChange={(value) => { setAllele2(value); setEvaluated(false) }} options={alleles} description="Select the second allele from the lab report." /></div> : <SearchableSelect label="Patient phenotype" value={phenotype} onChange={(value) => { setPhenotype(value); setEvaluated(false) }} options={(phenotypeOptionsByGene[drug.gene] ?? []).map((item) => ({ value: item, label: item }))} />}<Button onClick={() => setEvaluated(true)} className="w-full">Evaluate interaction</Button><p className="text-xs leading-5 text-muted-foreground">Research prototype. Not for clinical use.</p></CardContent></Card><Card className="h-fit"><CardHeader><CardTitle>Evaluation result</CardTitle><CardDescription>{evaluated ? `${drug.name} · ${drug.gene} · ${derivedPhenotype}` : "Run an evaluation to generate a result."}</CardDescription></CardHeader><CardContent>{!evaluated ? <div className="flex flex-col items-center gap-3 py-10 text-center"><div className="rounded-full bg-muted p-4"><FlaskConical className="size-7 text-muted-foreground" /></div><p className="max-w-xs text-sm leading-6 text-muted-foreground">Your plain-language recommendation and guideline summary will appear here.</p></div> : <Result risk={currentRisk} drug={drug.name} phenotype={derivedPhenotype} details={details?.clinicalMeaning} recommendation={drug.recommendation} source={drug.source} open={detailsOpen} onOpenChange={setDetailsOpen} />}</CardContent></Card></div></div></main></SidebarInset></SidebarProvider>
}

function Result({ risk, drug, phenotype, details, recommendation, source, open, onOpenChange }: { risk: Risk; drug: string; phenotype: string; details?: string; recommendation: string; source: string; open: boolean; onOpenChange: (value: boolean) => void }) {
  const high = risk === "high"
  const moderate = risk === "moderate"
  const action = high ? (drug === "Codeine" ? "Avoid this drug" : "Choose an alternative or adjust therapy") : moderate ? "Consider a higher starting dose" : "No change needed"
  const Icon = high ? ShieldAlert : moderate ? AlertTriangle : CheckCircle2
  return <div className="flex flex-col gap-5"><div className={`rounded-lg border p-5 ${high ? "border-destructive/40 bg-destructive/10" : moderate ? "border-amber-500/40 bg-amber-500/10" : "border-emerald-500/40 bg-emerald-500/10"}`}><div className="flex items-start gap-3"><Icon className="mt-0.5 shrink-0" aria-hidden="true" /><div><p className="text-xl font-semibold tracking-tight">{action}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{drug} with {phenotype}</p><p className="sr-only">{high ? "Safety alert" : moderate ? "Caution" : "Standard profile"}</p></div></div></div><Collapsible open={open} onOpenChange={onOpenChange} className="rounded-lg border"><CollapsibleTrigger asChild><Button variant="ghost" className="w-full justify-between px-4"><span>Clinical details and sources</span><ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} /></Button></CollapsibleTrigger><CollapsibleContent className="flex flex-col gap-4 border-t px-4 py-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full CPIC recommendation</p><p className="mt-1 text-sm leading-6">{recommendation}</p></div>{details && <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phenotype interpretation</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{details}</p></div>}<div className="flex items-center justify-between"><Badge variant={high ? "destructive" : "secondary"}>{source}</Badge><Button variant="ghost" size="sm" asChild><a href="https://cpicpgx.org/guidelines/" target="_blank" rel="noreferrer">Guideline source <ExternalLink data-icon="inline-end" /></a></Button></div></CollapsibleContent></Collapsible></div>
}

export default InteractionsEvaluator
