// PharmVar allele definitions with activity scores and phenotype mappings

export interface Allele {
  name: string
  gene: string
  activityScore: number
  functionalStatus: "normal" | "decreased" | "absent" | "increased"
  description: string
}

export interface GeneAlleles {
  gene: string
  commonAlleles: Allele[]
  phenotypes: Record<string, Phenotype>
}

export interface Phenotype {
  name: string
  activityScore: number | [number, number]
  description: string
  clinicalMeaning: string
}

// CYP2C19 alleles and phenotypes
export const CYP2C19_ALLELES: Allele[] = [
  {
    name: "*1",
    gene: "CYP2C19",
    activityScore: 1,
    functionalStatus: "normal",
    description: "Normal function allele",
  },
  {
    name: "*2",
    gene: "CYP2C19",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function allele (splicing defect)",
  },
  {
    name: "*3",
    gene: "CYP2C19",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function allele (premature stop codon)",
  },
  {
    name: "*4",
    gene: "CYP2C19",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function allele (frameshift)",
  },
  {
    name: "*17",
    gene: "CYP2C19",
    activityScore: 1.5,
    functionalStatus: "increased",
    description: "Increased-function allele",
  },
]

export const CYP2C19_PHENOTYPES: Record<string, Phenotype> = {
  "Rapid Metabolizer": {
    name: "Rapid Metabolizer",
    activityScore: [1.25, 2.5],
    description: "*1/*17, *17/*17 or similar combinations",
    clinicalMeaning: "Increased enzyme activity leading to faster drug metabolism",
  },
  "Normal Metabolizer": {
    name: "Normal Metabolizer",
    activityScore: [1, 1.25],
    description: "*1/*1, *1/*17 (some variants)",
    clinicalMeaning: "Standard enzyme activity with typical drug metabolism",
  },
  "Intermediate Metabolizer": {
    name: "Intermediate Metabolizer",
    activityScore: 0.5,
    description: "*1/*2, *1/*3, *2/*17",
    clinicalMeaning: "Reduced enzyme activity leading to slower drug metabolism",
  },
  "Poor Metabolizer": {
    name: "Poor Metabolizer",
    activityScore: 0,
    description: "*2/*2, *2/*3, *3/*3, *4/*4",
    clinicalMeaning: "Absent or severely reduced enzyme activity",
  },
}

// CYP2D6 alleles and phenotypes
export const CYP2D6_ALLELES: Allele[] = [
  {
    name: "*1",
    gene: "CYP2D6",
    activityScore: 1,
    functionalStatus: "normal",
    description: "Normal function allele",
  },
  {
    name: "*4",
    gene: "CYP2D6",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function allele (splicing defect)",
  },
  {
    name: "*5",
    gene: "CYP2D6",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function (gene deletion)",
  },
  {
    name: "*6",
    gene: "CYP2D6",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function allele (frameshift)",
  },
  {
    name: "*2xN",
    gene: "CYP2D6",
    activityScore: 2,
    functionalStatus: "increased",
    description: "Gene duplication/multiduplication",
  },
  {
    name: "*41",
    gene: "CYP2D6",
    activityScore: 0.5,
    functionalStatus: "decreased",
    description: "Decreased-function allele",
  },
]

export const CYP2D6_PHENOTYPES: Record<string, Phenotype> = {
  "Ultrarapid Metabolizer": {
    name: "Ultrarapid Metabolizer",
    activityScore: [2, 13],
    description: "Multiple gene copies (duplication/triplication/multiduplication)",
    clinicalMeaning: "Significantly increased enzyme activity, very rapid drug metabolism",
  },
  "Rapid Metabolizer": {
    name: "Rapid Metabolizer",
    activityScore: 1.5,
    description: "*1/*1 with gene duplication",
    clinicalMeaning: "Increased enzyme activity, faster than normal metabolism",
  },
  "Normal Metabolizer": {
    name: "Normal Metabolizer",
    activityScore: 1,
    description: "*1/*1, *1/*2xN",
    clinicalMeaning: "Standard enzyme activity",
  },
  "Intermediate Metabolizer": {
    name: "Intermediate Metabolizer",
    activityScore: 0.5,
    description: "*1/*4, *4/*41, *1/*5",
    clinicalMeaning: "Reduced enzyme activity",
  },
  "Poor Metabolizer": {
    name: "Poor Metabolizer",
    activityScore: 0,
    description: "*4/*4, *5/*6, *4/*5",
    clinicalMeaning: "Absent or severely reduced enzyme activity",
  },
}

// CYP3A5 alleles and phenotypes
export const CYP3A5_ALLELES: Allele[] = [
  {
    name: "*1",
    gene: "CYP3A5",
    activityScore: 1,
    functionalStatus: "normal",
    description: "Normal function allele (expressor)",
  },
  {
    name: "*3",
    gene: "CYP3A5",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function allele (non-expressor)",
  },
  {
    name: "*6",
    gene: "CYP3A5",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function allele",
  },
  {
    name: "*7",
    gene: "CYP3A5",
    activityScore: 0,
    functionalStatus: "absent",
    description: "Loss-of-function allele",
  },
]

export const CYP3A5_PHENOTYPES: Record<string, Phenotype> = {
  "CYP3A5 Expressor": {
    name: "CYP3A5 Expressor",
    activityScore: 1,
    description: "*1/*1, *1/*3",
    clinicalMeaning: "Functional CYP3A5 protein produced; higher enzyme activity",
  },
  "CYP3A5 Non-Expressor": {
    name: "CYP3A5 Non-Expressor",
    activityScore: 0,
    description: "*3/*3, *3/*6, *6/*7",
    clinicalMeaning: "Little to no CYP3A5 protein; lower enzyme activity",
  },
}

// HLA alleles for serious adverse reactions
export const HLA_ALLELES = {
  "HLA-B*57:01": "High risk for abacavir hypersensitivity",
  "HLA-B*15:02": "High risk for carbamazepine SJS/TEN",
  "HLA-A*31:01": "High risk for carbamazepine adverse reactions",
}

// Gene-allele registry
export const GENE_REGISTRY: Record<string, GeneAlleles> = {
  CYP2C19: {
    gene: "CYP2C19",
    commonAlleles: CYP2C19_ALLELES,
    phenotypes: CYP2C19_PHENOTYPES,
  },
  CYP2D6: {
    gene: "CYP2D6",
    commonAlleles: CYP2D6_ALLELES,
    phenotypes: CYP2D6_PHENOTYPES,
  },
  CYP3A5: {
    gene: "CYP3A5",
    commonAlleles: CYP3A5_ALLELES,
    phenotypes: CYP3A5_PHENOTYPES,
  },
}

// Utility: Calculate phenotype from diplotype
export function calculatePhenotype(allele1: string, allele2: string, gene: string): string {
  const geneData = GENE_REGISTRY[gene]
  if (!geneData) return "Unknown"

  const a1 = geneData.commonAlleles.find((a) => a.name === allele1)
  const a2 = geneData.commonAlleles.find((a) => a.name === allele2)

  if (!a1 || !a2) return "Unknown"

  const totalActivity = a1.activityScore + a2.activityScore

  // Find matching phenotype based on activity score
  let bestMatch = ""
  let bestMatchDiff = Infinity

  for (const [phenoName, pheno] of Object.entries(geneData.phenotypes)) {
    const targetActivity = Array.isArray(pheno.activityScore)
      ? (pheno.activityScore[0] + pheno.activityScore[1]) / 2
      : pheno.activityScore

    const diff = Math.abs(totalActivity - targetActivity)
    if (diff < bestMatchDiff) {
      bestMatchDiff = diff
      bestMatch = phenoName
    }
  }

  return bestMatch
}

// Utility: Get phenotype details
export function getPhenotypeDetails(phenotype: string, gene: string): Phenotype | null {
  const geneData = GENE_REGISTRY[gene]
  if (!geneData) return null
  return geneData.phenotypes[phenotype] || null
}
