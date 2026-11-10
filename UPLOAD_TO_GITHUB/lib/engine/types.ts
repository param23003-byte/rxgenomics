export type AlleleInfo = {
  function: string | null;
  activityValue: string | null;
};

export type GeneResult = {
  phenotype: string;
  activityScore: string;
  ehrPriority: string;
  consultation: string;
};

export type GeneEntry = {
  symbol: string;
  /** CPIC keys this gene's recommendations on activity score (CYP2D6, CYP2C9, DPYD). */
  scoreBased: boolean;
  alleles: Record<string, AlleleInfo>;
  results: Record<string, GeneResult>;
  lookups: { key: Record<string, number>; resultId: number; description: string }[];
};

export type DrugEntry = {
  name: string;
  drugId: string;
  genes: string[];
  guidelines: { name: string; url: string }[];
};

export type Recommendation = {
  id: string;
  drug: string;
  population: string;
  lookup: Record<string, string>;
  recommendation: string;
  classification: string;
  implications: Record<string, string>;
  comments: string;
  alternateDrugAvailable: boolean;
  guidelineId: string;
};

export type KnowledgeBase = {
  meta: {
    recommendationsRetrieved: string;
    phenotypeTablesRetrieved: string;
    levelAPairs: number;
    builtAt: string;
  };
  drugs: Record<string, DrugEntry>;
  genes: Record<string, GeneEntry>;
  recommendations: Recommendation[];
};

export type ResolvedAllele = {
  input: string;
  name: string | null;
  function: string | null;
  activityValue: string | null;
  /** Set when the input was a combination such as "[c.85T>C (*9A) + c.2194G>A (*6)]". */
  components?: ResolvedAllele[];
};

export type GenotypeStatus = "ok" | "indeterminate" | "unknown-gene" | "unknown-allele" | "invalid";

export type GenotypeResult = {
  gene: string;
  diplotype: string;
  status: GenotypeStatus;
  alleles: ResolvedAllele[];
  phenotype: string | null;
  activityScore: string | null;
  /** The value CPIC recommendations are keyed on: activity score or phenotype. */
  lookupValue: string | null;
  ehrPriority: string | null;
  consultation: string | null;
  messages: string[];
};

export type AlertTier = "critical" | "warning" | "normal" | "info";

export type DrugCheck = {
  drug: string;
  known: boolean;
  guidelines: { name: string; url: string }[];
  genotypes: GenotypeResult[];
  /** Genes CPIC uses for this drug that were not supplied. */
  missingGenes: string[];
  /** Best-matching recommendation per population; unsupplied genes are read as "No Result". */
  primary: Recommendation[];
  /** Every recommendation consistent with the supplied genotypes. */
  candidates: Recommendation[];
  tier: AlertTier;
  messages: string[];
};
