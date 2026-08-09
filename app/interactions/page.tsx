import type { Metadata } from "next"
import InteractionsEvaluator from "@/components/dashboard/interactions-evaluator"

export const metadata: Metadata = {
  title: "Drug-Gene Interaction Evaluator | PGx Dashboard",
  description: "Evaluate pharmacogenomic drug-gene interactions using allele pairs and clinical phenotypes.",
}

export default function InteractionsPage() {
  return <InteractionsEvaluator />
}
