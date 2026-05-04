"use client"

import { AlertTriangle, AlertCircle, CheckCircle2, ExternalLink, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type AlertLevel = "red" | "amber" | "green"

interface InteractionData {
  drug: string
  gene: string
  phenotype: string
  level: AlertLevel
  recommendation: string
  cpicLevel: string
  evidence: string
  implications: string
}

const interactionDatabase: Record<string, InteractionData> = {
  Clopidogrel: {
    drug: "Clopidogrel",
    gene: "CYP2C19",
    phenotype: "Poor Metabolizer",
    level: "red",
    recommendation:
      "Consider alternative antiplatelet therapy (prasugrel, ticagrelor) due to reduced effectiveness of clopidogrel. Standard dosing of clopidogrel is unlikely to provide adequate platelet inhibition.",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "Poor metabolizers have reduced conversion of clopidogrel to its active metabolite, leading to decreased platelet inhibition and increased risk of cardiovascular events.",
  },
  Warfarin: {
    drug: "Warfarin",
    gene: "CYP2C9 / VKORC1",
    phenotype: "CYP2C9 *1/*3, VKORC1 A/A",
    level: "amber",
    recommendation:
      "Consider reduced initial dose based on genotype. Use pharmacogenetic dosing algorithms. Monitor INR closely during initiation and dose adjustments.",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "This genotype combination suggests increased sensitivity to warfarin. Patients may require lower doses to achieve therapeutic INR and are at increased risk of bleeding during initiation.",
  },
  Codeine: {
    drug: "Codeine",
    gene: "CYP2D6",
    phenotype: "Ultrarapid Metabolizer",
    level: "red",
    recommendation:
      "AVOID codeine use due to potential for toxicity. Select alternative analgesics such as morphine (not tramadol or hydrocodone). If codeine is required, use lowest possible dose with close monitoring.",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "Ultrarapid metabolizers convert codeine to morphine very rapidly, leading to higher morphine levels and increased risk of respiratory depression and overdose.",
  },
  Simvastatin: {
    drug: "Simvastatin",
    gene: "SLCO1B1",
    phenotype: "Decreased Function",
    level: "amber",
    recommendation:
      "Prescribe lower dose or consider alternative statin (pravastatin, rosuvastatin). If using simvastatin, avoid doses >20mg daily and monitor for myopathy symptoms.",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "Decreased SLCO1B1 function leads to higher simvastatin acid plasma concentrations, significantly increasing the risk of myopathy and rhabdomyolysis.",
  },
  Tamoxifen: {
    drug: "Tamoxifen",
    gene: "CYP2D6",
    phenotype: "Normal Metabolizer",
    level: "green",
    recommendation:
      "Use tamoxifen at standard dosing. No dosage adjustment needed based on CYP2D6 genotype. Monitor for expected efficacy and standard side effects.",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "Normal metabolizers have adequate conversion of tamoxifen to its active metabolite endoxifen, supporting expected therapeutic efficacy.",
  },
  Abacavir: {
    drug: "Abacavir",
    gene: "HLA-B*57:01",
    phenotype: "Positive",
    level: "red",
    recommendation:
      "CONTRAINDICATED. Do NOT prescribe abacavir. HLA-B*57:01 positive status significantly increases risk of potentially life-threatening hypersensitivity reaction.",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "Patients carrying the HLA-B*57:01 allele have a high risk of developing abacavir hypersensitivity reaction, which can be fatal upon rechallenge.",
  },
  Carbamazepine: {
    drug: "Carbamazepine",
    gene: "HLA-B*15:02",
    phenotype: "Positive",
    level: "red",
    recommendation:
      "CONTRAINDICATED in HLA-B*15:02 positive patients. Do NOT prescribe carbamazepine. Risk of severe cutaneous adverse reactions (Stevens-Johnson syndrome/toxic epidermal necrolysis).",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "HLA-B*15:02 carriers have significantly increased risk of carbamazepine-induced SJS/TEN, particularly in Asian populations.",
  },
  Azathioprine: {
    drug: "Azathioprine",
    gene: "TPMT / NUDT15",
    phenotype: "Intermediate Metabolizer",
    level: "amber",
    recommendation:
      "Start with reduced dose (30-80% of standard). Monitor closely for myelotoxicity. Consider additional dose reduction if toxicity occurs.",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "Intermediate metabolizers have reduced thiopurine metabolism, leading to accumulation of active metabolites and increased risk of myelosuppression.",
  },
  Mercaptopurine: {
    drug: "Mercaptopurine",
    gene: "TPMT / NUDT15",
    phenotype: "Poor Metabolizer",
    level: "red",
    recommendation:
      "If drug is required, reduce dose to 10% of standard and monitor closely. Consider alternative therapy. Significant risk of life-threatening myelotoxicity.",
    cpicLevel: "Strong",
    evidence: "High",
    implications:
      "Poor metabolizers are at very high risk of severe, life-threatening myelotoxicity due to accumulation of cytotoxic thiopurine metabolites.",
  },
  Tacrolimus: {
    drug: "Tacrolimus",
    gene: "CYP3A5",
    phenotype: "Extensive Metabolizer",
    level: "amber",
    recommendation:
      "May require higher initial doses (1.5-2x standard). Monitor drug levels closely and titrate to therapeutic target. More frequent monitoring during initiation.",
    cpicLevel: "Moderate",
    evidence: "Moderate",
    implications:
      "CYP3A5 expressers metabolize tacrolimus more rapidly, potentially requiring higher doses to achieve therapeutic drug concentrations.",
  },
}

interface InteractionAlertProps {
  selectedDrug: string | null
}

export function InteractionAlert({ selectedDrug }: InteractionAlertProps) {
  const interaction = selectedDrug ? interactionDatabase[selectedDrug] : null

  const getLevelConfig = (level: AlertLevel) => {
    switch (level) {
      case "red":
        return {
          bgColor: "bg-alert-red-bg",
          borderColor: "border-alert-red/30",
          textColor: "text-alert-red",
          icon: AlertTriangle,
          label: "High Risk",
          badgeClass: "bg-alert-red text-white",
        }
      case "amber":
        return {
          bgColor: "bg-alert-amber-bg",
          borderColor: "border-alert-amber/30",
          textColor: "text-alert-amber",
          icon: AlertCircle,
          label: "Moderate Risk",
          badgeClass: "bg-alert-amber text-white",
        }
      case "green":
        return {
          bgColor: "bg-alert-green-bg",
          borderColor: "border-alert-green/30",
          textColor: "text-alert-green",
          icon: CheckCircle2,
          label: "Normal",
          badgeClass: "bg-alert-green text-white",
        }
    }
  }

  if (!interaction) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-primary" />
            Interaction Alert
          </CardTitle>
          <CardDescription>
            Select a drug from the search above to view CPIC dosing guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No drug selected. Search for a drug to view pharmacogenomic recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const config = getLevelConfig(interaction.level)
  const Icon = config.icon

  return (
    <Card className={`border-2 ${config.borderColor} ${config.bgColor} shadow-sm`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${config.textColor} bg-card`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">{interaction.drug}</CardTitle>
              <CardDescription className="text-foreground/70">
                {interaction.gene} - {interaction.phenotype}
              </CardDescription>
            </div>
          </div>
          <Badge className={config.badgeClass}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground mb-2">Clinical Implications</h4>
          <p className="text-sm text-foreground/80">{interaction.implications}</p>
        </div>

        <Separator className="bg-foreground/10" />

        <div>
          <h4 className="font-semibold text-foreground mb-2">CPIC Recommendation</h4>
          <p className="text-sm text-foreground/80">{interaction.recommendation}</p>
        </div>

        <Separator className="bg-foreground/10" />

        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-xs text-foreground/60">CPIC Recommendation Level</span>
            <p className="font-medium text-foreground">{interaction.cpicLevel}</p>
          </div>
          <div>
            <span className="text-xs text-foreground/60">Evidence Level</span>
            <p className="font-medium text-foreground">{interaction.evidence}</p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto border-foreground/20 text-foreground hover:bg-foreground/10"
            asChild
          >
            <a
              href={`https://cpicpgx.org/guidelines/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Full CPIC Guidelines
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
