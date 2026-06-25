'use server'

export interface PgxQueryInput {
  drugName: string
  genotype: string
  ancestry?: string
}

export interface PgxAlertData {
  adverse_effect: string
  clinical_mechanism: string
  alternative_therapy: string
  evidence_level: string
}

export interface PgxQueryResponse {
  success: boolean
  matchCount: number
  data: PgxAlertData[]
}

/**
 * Server Action: Query Pharmacogenomics Database
 * Validates input and returns PGX alerts based on drug-gene interactions
 */
export async function queryPgxRisk(input: PgxQueryInput): Promise<PgxQueryResponse> {
  try {
    // Input validation
    if (!input.drugName || !input.genotype) {
      return {
        success: false,
        matchCount: 0,
        data: [],
      }
    }

    // Mock database simulation
    // In production, this would query a real PostgreSQL database
    const mockPgxDatabase: Record<string, Record<string, PgxAlertData[]>> = {
      'Clopidogrel': {
        'Poor Metabolizer': [
          {
            adverse_effect: 'Drug ineffective',
            clinical_mechanism: 'CYP2C19 poor metabolizer status reduces activation of clopidogrel',
            alternative_therapy: 'Consider prasugrel or ticagrelor; may require higher dosing or alternative antiplatelet agent',
            evidence_level: 'Level A - FDA Boxed Warning',
          },
        ],
      },
      'Omeprazole': {
        'Poor Metabolizer': [
          {
            adverse_effect: 'Reduced drug clearance',
            clinical_mechanism: 'CYP2C19 poor metabolizer - impaired omeprazole metabolism',
            alternative_therapy: 'Consider alternative proton pump inhibitor (pantoprazole) or dose adjustment',
            evidence_level: 'Level B',
          },
        ],
      },
      'Codeine': {
        'Ultra-Rapid Metabolizer': [
          {
            adverse_effect: 'Increased opioid toxicity',
            clinical_mechanism: 'CYP2D6 ultra-rapid metabolizer produces excessive morphine levels',
            alternative_therapy: 'Avoid codeine; use alternative opioid with less CYP2D6 metabolism',
            evidence_level: 'Level A - FDA Alert',
          },
        ],
        'Poor Metabolizer': [
          {
            adverse_effect: 'Reduced analgesic efficacy',
            clinical_mechanism: 'CYP2D6 poor metabolizer cannot convert codeine to active morphine',
            alternative_therapy: 'Use alternative analgesic with direct activity',
            evidence_level: 'Level B',
          },
        ],
      },
      'Tamoxifen': {
        'Poor Metabolizer': [
          {
            adverse_effect: 'Reduced therapeutic efficacy',
            clinical_mechanism: 'CYP2D6 poor metabolizer reduces conversion to active endoxifen',
            alternative_therapy: 'Consider aromatase inhibitor or dose escalation; monitor closely',
            evidence_level: 'Level B',
          },
        ],
      },
      'Tacrolimus': {
        'CYP3A5 Expresser': [
          {
            adverse_effect: 'Reduced drug exposure',
            clinical_mechanism: 'CYP3A5 expressers have increased tacrolimus metabolism',
            alternative_therapy: 'Dose escalation recommended; therapeutic drug monitoring essential',
            evidence_level: 'Level B',
          },
        ],
      },
    }

    // Look up the drug and genotype combination
    const drugAlerts = mockPgxDatabase[input.drugName]
    if (!drugAlerts || !drugAlerts[input.genotype]) {
      return {
        success: true,
        matchCount: 0,
        data: [],
      }
    }

    const alerts = drugAlerts[input.genotype]
    return {
      success: true,
      matchCount: alerts.length,
      data: alerts,
    }
  } catch (error) {
    console.error('[PGX Error]', error)
    return {
      success: false,
      matchCount: 0,
      data: [],
    }
  }
}
