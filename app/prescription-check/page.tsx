"use client"

import { useState } from "react"
import { Search, Stethoscope, Users, ClipboardCheck, History, Info, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const patients = [
  {
    id: "10001",
    name: "Eleanor Vance",
    genotypes: [
      { gene: "CYP2C19", variant: "*2/*2" },
      { gene: "VKORC1", variant: "GG" },
    ],
  },
  {
    id: "10002",
    name: "Marcus Chen",
    genotypes: [
      { gene: "CYP2D6", variant: "*1/*4" },
      { gene: "HLA-B", variant: "*57:01" },
    ],
  },
  {
    id: "10003",
    name: "Sarah Mitchell",
    genotypes: [
      { gene: "TPMT", variant: "*1/*3A" },
      { gene: "CYP2C19", variant: "*1/*1" },
    ],
  },
]

const availableDrugs = [
  "Abacavir",
  "Azathioprine",
  "Clopidogrel",
  "Codeine",
  "Mercaptopurine",
]

type AlertLevel = "normal" | "warning" | "critical"

interface CheckResult {
  drug: string
  patient: string
  level: AlertLevel
  gene: string
  phenotype: string
  recommendation: string
}

export default function PrescriptionCheckPage() {
  const [selectedPatient, setSelectedPatient] = useState(patients[0])
  const [drugInput, setDrugInput] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [activeNav, setActiveNav] = useState<"patients" | "check" | "history">("check")

  const runPgxCheck = () => {
    if (!drugInput.trim()) return
    
    setIsChecking(true)
    setCheckResult(null)

    // Simulate API call
    setTimeout(() => {
      const drug = drugInput.toLowerCase()
      let result: CheckResult

      if (drug === "clopidogrel" && selectedPatient.genotypes.some(g => g.gene === "CYP2C19" && g.variant === "*2/*2")) {
        result = {
          drug: drugInput,
          patient: selectedPatient.name,
          level: "critical",
          gene: "CYP2C19",
          phenotype: "Poor Metabolizer",
          recommendation: "Avoid clopidogrel. Consider alternative antiplatelet therapy such as prasugrel or ticagrelor as per CPIC guidelines.",
        }
      } else if (drug === "abacavir" && selectedPatient.genotypes.some(g => g.gene === "HLA-B" && g.variant === "*57:01")) {
        result = {
          drug: drugInput,
          patient: selectedPatient.name,
          level: "critical",
          gene: "HLA-B",
          phenotype: "HLA-B*57:01 Positive",
          recommendation: "Abacavir is contraindicated. High risk of hypersensitivity reaction. Use alternative antiretroviral.",
        }
      } else if (drug === "codeine" && selectedPatient.genotypes.some(g => g.gene === "CYP2D6" && g.variant.includes("*4"))) {
        result = {
          drug: drugInput,
          patient: selectedPatient.name,
          level: "warning",
          gene: "CYP2D6",
          phenotype: "Intermediate Metabolizer",
          recommendation: "Reduced codeine efficacy expected. Consider alternative analgesics or monitor closely for response.",
        }
      } else if ((drug === "azathioprine" || drug === "mercaptopurine") && selectedPatient.genotypes.some(g => g.gene === "TPMT" && g.variant.includes("*3"))) {
        result = {
          drug: drugInput,
          patient: selectedPatient.name,
          level: "warning",
          gene: "TPMT",
          phenotype: "Intermediate Metabolizer",
          recommendation: "Reduce dose by 30-70%. Monitor for myelosuppression. Consider starting at 50% of standard dose.",
        }
      } else {
        result = {
          drug: drugInput,
          patient: selectedPatient.name,
          level: "normal",
          gene: "N/A",
          phenotype: "Normal Function",
          recommendation: "No pharmacogenomic interactions detected. Standard dosing applies based on clinical guidelines.",
        }
      }

      setCheckResult(result)
      setIsChecking(false)
    }, 1500)
  }

  const handleQuickSelect = (drug: string) => {
    setDrugInput(drug)
    setCheckResult(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main Content */}
      <main className="flex-1 overflow-auto px-4 pb-24 pt-6">
        <div className="mx-auto max-w-lg">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Stethoscope className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-[#1a365d]">
                Prescription Check
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Cross-reference genotype against CPIC guidelines
            </p>
          </div>

          {/* Patient Card */}
          <Card className="mb-6 border border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Selected Patient
                </span>
                <select
                  value={selectedPatient.id}
                  onChange={(e) => {
                    const patient = patients.find(p => p.id === e.target.value)
                    if (patient) {
                      setSelectedPatient(patient)
                      setCheckResult(null)
                    }
                  }}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-[#1a365d]">
                  {selectedPatient.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  MRN: {selectedPatient.id}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedPatient.genotypes.map((genotype, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {genotype.gene} {genotype.variant}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drug Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={drugInput}
                onChange={(e) => {
                  setDrugInput(e.target.value)
                  setCheckResult(null)
                }}
                placeholder="e.g., Clopidogrel"
                className="h-12 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Quick Select Chips */}
          <div className="mb-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Available in Database
            </p>
            <div className="flex flex-wrap gap-2">
              {availableDrugs.map((drug) => (
                <button
                  key={drug}
                  onClick={() => handleQuickSelect(drug)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    drugInput === drug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {drug}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={runPgxCheck}
            disabled={!drugInput.trim() || isChecking}
            className="mb-6 h-14 w-full gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Run PGx Check
              </>
            )}
          </Button>

          {/* Check Result */}
          {checkResult && (
            <Card
              className={cn(
                "mb-6 border-l-4 shadow-sm",
                checkResult.level === "critical" && "border-l-[var(--alert-red)] bg-[var(--alert-red-bg)]",
                checkResult.level === "warning" && "border-l-[var(--alert-amber)] bg-[var(--alert-amber-bg)]",
                checkResult.level === "normal" && "border-l-[var(--alert-green)] bg-[var(--alert-green-bg)]"
              )}
            >
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      checkResult.level === "critical" && "text-[var(--alert-red)]",
                      checkResult.level === "warning" && "text-[var(--alert-amber)]",
                      checkResult.level === "normal" && "text-[var(--alert-green)]"
                    )}
                  >
                    {checkResult.level === "critical" && "Critical Alert"}
                    {checkResult.level === "warning" && "Warning"}
                    {checkResult.level === "normal" && "Normal"}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      checkResult.level === "critical" && "border-[var(--alert-red)] text-[var(--alert-red)]",
                      checkResult.level === "warning" && "border-[var(--alert-amber)] text-[var(--alert-amber)]",
                      checkResult.level === "normal" && "border-[var(--alert-green)] text-[var(--alert-green)]"
                    )}
                  >
                    {checkResult.gene}
                  </Badge>
                </div>
                
                <h3 className="mb-1 text-lg font-semibold text-[#1a365d]">
                  {checkResult.drug}
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Phenotype: {checkResult.phenotype}
                </p>
                
                <div className="rounded-lg bg-card/50 p-3">
                  <p className="text-sm font-medium text-[#1a365d]">
                    CPIC Recommendation
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {checkResult.recommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* How it Works */}
          <Card className="border-0 bg-primary/5 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-[#1a365d]">
                    How it works
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    This system matches patient genotypes against CPIC (Clinical Pharmacogenetics Implementation Consortium) evidence to provide{" "}
                    <span className="font-medium text-[var(--alert-green)]">Normal</span>,{" "}
                    <span className="font-medium text-[var(--alert-amber)]">Warning</span>, or{" "}
                    <span className="font-medium text-[var(--alert-red)]">Critical</span>{" "}
                    alert levels for drug-gene interactions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card shadow-lg">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
          <button
            onClick={() => setActiveNav("patients")}
            className={cn(
              "flex flex-col items-center gap-1 px-6 py-2 transition-colors",
              activeNav === "patients"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Patients</span>
          </button>
          
          <button
            onClick={() => setActiveNav("check")}
            className={cn(
              "flex flex-col items-center gap-1 px-6 py-2 transition-colors",
              activeNav === "check"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardCheck className="h-5 w-5" />
            <span className="text-xs font-medium">Check</span>
          </button>
          
          <button
            onClick={() => setActiveNav("history")}
            className={cn(
              "flex flex-col items-center gap-1 px-6 py-2 transition-colors",
              activeNav === "history"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History className="h-5 w-5" />
            <span className="text-xs font-medium">History</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
