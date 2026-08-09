"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, ExternalLink, FlaskConical, Info, ShieldAlert } from "lucide-react"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculatePhenotype, GENE_REGISTRY, getPhenotypeDetails } from "@/lib/pharmacogenomics"

type Mode = "alleles" | "phenotype"
type Risk = "high" | "moderate" | "standard"

const drugs = [
  { name: "Clopidogrel", gene: "CYP2C19", riskPhenotypes: ["Poor Metabolizer", "Intermediate Metabolizer"], recommendation: "Consider prasugrel or ticagrelor; standard clopidogrel may provide inadequate platelet inhibition.", source: "CPIC 2022" },
  { name: "Codeine", gene: "CYP2D6", riskPhenotypes: ["Ultrarapid Metabolizer", "Poor Metabolizer"], recommendation: "Avoid codeine. Select an alternative analgesic with a predictable metabolic pathway.", source: "CPIC 2020" },
  { name: "Tacrolimus", gene: "CYP3A5", riskPhenotypes: ["CYP3A5 Expressor"], recommendation: "Consider a higher starting dose and monitor trough concentrations closely.", source: "CPIC 2022" },
  { name: "Warfarin", gene: "CYP2C9", riskPhenotypes: ["Variant carrier"], recommendation: "Use a validated pharmacogenetic dosing algorithm and monitor INR closely.", source: "CPIC 2017" },
  { name: "Simvastatin", gene: "SLCO1B1", riskPhenotypes: ["Decreased Function"], recommendation: "Use a lower dose or consider an alternative statin to reduce myopathy risk.", source: "CPIC 2022" },
]

const phenotypeOptionsByGene: Record<string, string[]> = {
  CYP2C19: Object.keys(GENE_REGISTRY.CYP2C19.phenotypes),
  CYP2D6: Object.keys(GENE_REGISTRY.CYP2D6.phenotypes),
  CYP3A5: Object.keys(GENE_REGISTRY.CYP3A5.phenotypes),
  CYP2C9: ["Normal Function", "Variant carrier"],
  SLCO1B1: ["Normal Function", "Decreased Function"],
}

function riskFor(drugName: string, phenotype: string): Risk {
  const drug = drugs.find((item) => item.name === drugName)
  if (!drug || !phenotype) return "standard"
  if (drug.riskPhenotypes.includes(phenotype)) return drug.name === "Tacrolimus" ? "moderate" : "high"
  return "standard"
}

export function InteractionsEvaluator() {
  const [mode, setMode] = useState<Mode>("alleles")
  const [drugName, setDrugName] = useState("Clopidogrel")
  const [allele1, setAllele1] = useState("*1")
  const [allele2, setAllele2] = useState("*2")
  const [phenotype, setPhenotype] = useState("Intermediate Metabolizer")
  const [evaluated, setEvaluated] = useState(false)

  const drug = drugs.find((item) => item.name === drugName) ?? drugs[0]
  const geneData = GENE_REGISTRY[drug.gene]
  const derivedPhenotype = useMemo(
    () => mode === "alleles" ? calculatePhenotype(allele1, allele2, drug.gene) : phenotype,
    [allele1, allele2, drug.gene, mode, phenotype],
  )
  const currentRisk = evaluated ? riskFor(drugName, derivedPhenotype) : "standard"
  const details = getPhenotypeDetails(derivedPhenotype, drug.gene)
  const riskCopy = currentRisk === "high" ? "High-risk interaction" : currentRisk === "moderate" ? "Moderate-risk interaction" : "Standard dosing profile"

  function selectDrug(value: string) {
    const nextDrug = drugs.find((item) => item.name === value) ?? drugs[0]
    setDrugName(value)
    setPhenotype(phenotypeOptionsByGene[nextDrug.gene]?.[0] ?? "Normal Function")
    setAllele1("*1")
    setAllele2(nextDrug.gene === "CYP2C19" ? "*2" : "*1")
    setEvaluated(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block"><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem><BreadcrumbPage>Drug-Gene Interaction</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="container max-w-7xl px-4 py-8 md:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary"><FlaskConical className="size-4" /> Clinical pharmacogenomics</div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">Drug-gene interaction evaluator</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground leading-6">Translate PharmVar diplotypes into an actionable medication recommendation using CPIC, DPWG, and FDA-aligned guidance.</p>
              </div>
              <Badge variant="outline" className="w-fit gap-2 px-3 py-1.5"><Info className="size-3.5" /> Clinical decision support</Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Evaluate a medication</CardTitle>
                  <CardDescription>Choose a drug, then enter the patient&apos;s genotype or known phenotype.</CardDescription>
                  <div className="flex gap-2 pt-3">
                    <Button type="button" variant={mode === "alleles" ? "default" : "outline"} onClick={() => setMode("alleles")}>Allele pair</Button>
                    <Button type="button" variant={mode === "phenotype" ? "default" : "outline"} onClick={() => setMode("phenotype")}>Known phenotype</Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2"><label htmlFor="drug" className="text-sm font-medium">Medication</label><Select value={drugName} onValueChange={selectDrug}><SelectTrigger id="drug"><SelectValue /></SelectTrigger><SelectContent>{drugs.map((item) => <SelectItem key={item.name} value={item.name}>{item.name} · {item.gene}</SelectItem>)}</SelectContent></Select></div>
                  {mode === "alleles" ? <div className="grid gap-4 sm:grid-cols-2"><div className="flex flex-col gap-2"><label htmlFor="allele-one" className="text-sm font-medium">Allele 1</label><Select value={allele1} onValueChange={(value) => { setAllele1(value); setEvaluated(false) }}><SelectTrigger id="allele-one"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="*1">*1 · normal function</SelectItem><SelectItem value="*2">*2 · loss of function</SelectItem><SelectItem value="*3">*3 · loss of function</SelectItem><SelectItem value="*4">*4 · loss of function</SelectItem><SelectItem value="*17">*17 · increased function</SelectItem><SelectItem value="*41">*41 · decreased function</SelectItem><SelectItem value="*5">*5 · gene deletion</SelectItem></SelectContent></Select></div><div className="flex flex-col gap-2"><label htmlFor="allele-two" className="text-sm font-medium">Allele 2</label><Select value={allele2} onValueChange={(value) => { setAllele2(value); setEvaluated(false) }}><SelectTrigger id="allele-two"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="*1">*1 · normal function</SelectItem><SelectItem value="*2">*2 · loss of function</SelectItem><SelectItem value="*3">*3 · loss of function</SelectItem><SelectItem value="*4">*4 · loss of function</SelectItem><SelectItem value="*17">*17 · increased function</SelectItem><SelectItem value="*41">*41 · decreased function</SelectItem><SelectItem value="*5">*5 · gene deletion</SelectItem></SelectContent></Select></div></div> : <div className="flex flex-col gap-2"><label htmlFor="phenotype" className="text-sm font-medium">Patient phenotype</label><Select value={phenotype} onValueChange={(value) => { setPhenotype(value); setEvaluated(false) }}><SelectTrigger id="phenotype"><SelectValue /></SelectTrigger><SelectContent>{(phenotypeOptionsByGene[drug.gene] ?? []).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>}
                  <Button onClick={() => setEvaluated(true)} className="w-full">Evaluate interaction</Button>
                  <p className="text-xs text-muted-foreground leading-5">This evaluator is a decision-support aid, not a substitute for clinical judgment, complete medication review, or current prescribing information.</p>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader><CardTitle>Evaluation result</CardTitle><CardDescription>{evaluated ? `${drug.name} · ${drug.gene} · ${derivedPhenotype}` : "Run an evaluation to generate a result."}</CardDescription></CardHeader>
                <CardContent>
                  {!evaluated ? <div className="flex flex-col items-center gap-3 py-10 text-center"><div className="rounded-full bg-muted p-4"><FlaskConical className="size-7 text-muted-foreground" /></div><p className="max-w-xs text-sm text-muted-foreground leading-6">Your clinical alert and guideline summary will appear here.</p></div> : <Result risk={currentRisk} title={riskCopy} drug={drug.name} phenotype={derivedPhenotype} details={details?.clinicalMeaning} recommendation={drug.recommendation} source={drug.source} />}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function Result({ risk, title, drug, phenotype, details, recommendation, source }: { risk: Risk; title: string; drug: string; phenotype: string; details?: string; recommendation: string; source: string }) {
  const high = risk === "high"
  const moderate = risk === "moderate"
  return <div className="flex flex-col gap-5"><div className={`rounded-lg border p-4 ${high ? "border-destructive/30 bg-destructive/10" : moderate ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}><div className="flex items-start gap-3"><div className="rounded-full bg-background p-2">{high ? <ShieldAlert className="size-5 text-destructive" /> : moderate ? <AlertTriangle className="size-5 text-amber-600" /> : <CheckCircle2 className="size-5 text-emerald-600" />}</div><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground leading-6">{drug} with {phenotype}</p></div></div></div><div className="flex flex-col gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clinical recommendation</p><p className="text-sm leading-6">{recommendation}</p></div>{details && <div className="flex flex-col gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phenotype interpretation</p><p className="text-sm text-muted-foreground leading-6">{details}</p></div>}<div className="flex items-center justify-between border-t pt-4"><Badge variant={high ? "destructive" : "secondary"}>{source}</Badge><Button variant="ghost" size="sm" asChild><a href="https://cpicpgx.org/guidelines/" target="_blank" rel="noreferrer">Guideline source <ExternalLink data-icon="inline-end" /></a></Button></div></div>
}

export default InteractionsEvaluator
