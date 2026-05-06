// Predicted PGx Phenotype Engine
export type PredictedPhenotype = 'Possible Poor Metabolizer' | 'Possible Intermediate Metabolizer' | 'Possible Normal Metabolizer' | 'Possible Ultra-rapid Metabolizer'

export interface PhenotypePrediction {
  gene: string
  predictedPhenotype: PredictedPhenotype
  clinicalResponse: 'Effective' | 'Drug_Failure' | 'ADR'
  mechanismExplanation: string
  cpicLevel: 'A' | 'B' | 'C'
}

export function predictPhenotypeFromOutcome(
  drug: string,
  gene: string,
  clinicalOutcome: 'Effective' | 'Drug_Failure' | 'ADR'
): PhenotypePrediction {
  // Drug-Gene relationships with phenotype predictions based on outcome
  const drugGeneMappings: Record<string, Record<string, Record<string, any>>> = {
    'Clopidogrel': {
      'CYP2C19': {
        'Drug_Failure': {
          phenotype: 'Possible Poor Metabolizer',
          explanation: 'Clopidogrel requires CYP2C19 activation. Reduced enzyme activity may lead to decreased active metabolite formation and reduced efficacy.',
          cpicLevel: 'A'
        },
        'ADR': {
          phenotype: 'Possible Ultra-rapid Metabolizer',
          explanation: 'Increased CYP2C19 activity may lead to excessive active metabolite formation, resulting in bleeding complications.',
          cpicLevel: 'A'
        },
        'Effective': {
          phenotype: 'Possible Normal Metabolizer',
          explanation: 'Normal metabolizer phenotype with adequate enzyme activity for standard dosing.',
          cpicLevel: 'A'
        }
      }
    },
    'Codeine': {
      'CYP2D6': {
        'ADR': {
          phenotype: 'Possible Ultra-rapid Metabolizer',
          explanation: 'Increased CYP2D6 activity leads to excessive morphine production, causing toxicity.',
          cpicLevel: 'A'
        },
        'Drug_Failure': {
          phenotype: 'Possible Poor Metabolizer',
          explanation: 'Reduced CYP2D6 activity limits conversion to active metabolite morphine, reducing analgesic efficacy.',
          cpicLevel: 'A'
        },
        'Effective': {
          phenotype: 'Possible Normal Metabolizer',
          explanation: 'Normal metabolizer phenotype with appropriate pain relief at standard doses.',
          cpicLevel: 'A'
        }
      }
    },
    'Warfarin': {
      'CYP2C9': {
        'ADR': {
          phenotype: 'Possible Poor Metabolizer',
          explanation: 'Reduced CYP2C9 activity leads to increased warfarin accumulation and bleeding risk.',
          cpicLevel: 'A'
        },
        'Drug_Failure': {
          phenotype: 'Possible Ultra-rapid Metabolizer',
          explanation: 'Increased CYP2C9 activity results in rapid warfarin metabolism and reduced anticoagulation.',
          cpicLevel: 'A'
        },
        'Effective': {
          phenotype: 'Possible Normal Metabolizer',
          explanation: 'Normal metabolizer phenotype with appropriate anticoagulation at standard dosing.',
          cpicLevel: 'A'
        }
      },
      'VKORC1': {
        'ADR': {
          phenotype: 'Possible Intermediate Metabolizer',
          explanation: 'Genetic variation in VKORC1 affects vitamin K recycling, increasing warfarin sensitivity.',
          cpicLevel: 'A'
        },
        'Drug_Failure': {
          phenotype: 'Possible Normal Metabolizer',
          explanation: 'Normal VKORC1 function with expected warfarin response.',
          cpicLevel: 'A'
        },
        'Effective': {
          phenotype: 'Possible Normal Metabolizer',
          explanation: 'Normal metabolizer phenotype with appropriate anticoagulation.',
          cpicLevel: 'A'
        }
      }
    },
    'Tacrolimus': {
      'CYP3A5': {
        'Drug_Failure': {
          phenotype: 'Possible Ultra-rapid Metabolizer',
          explanation: 'Increased CYP3A5 activity requires higher tacrolimus doses to maintain therapeutic levels.',
          cpicLevel: 'B'
        },
        'ADR': {
          phenotype: 'Possible Poor Metabolizer',
          explanation: 'Reduced CYP3A5 activity leads to tacrolimus accumulation and nephrotoxicity.',
          cpicLevel: 'B'
        },
        'Effective': {
          phenotype: 'Possible Normal Metabolizer',
          explanation: 'Normal metabolizer phenotype with appropriate immunosuppression.',
          cpicLevel: 'B'
        }
      }
    },
    'Simvastatin': {
      'CYP3A4': {
        'ADR': {
          phenotype: 'Possible Poor Metabolizer',
          explanation: 'Reduced CYP3A4 activity leads to simvastatin accumulation and increased myopathy risk.',
          cpicLevel: 'B'
        },
        'Drug_Failure': {
          phenotype: 'Possible Ultra-rapid Metabolizer',
          explanation: 'Increased CYP3A4 activity requires higher doses for lipid-lowering efficacy.',
          cpicLevel: 'B'
        },
        'Effective': {
          phenotype: 'Possible Normal Metabolizer',
          explanation: 'Normal metabolizer phenotype with appropriate cholesterol reduction.',
          cpicLevel: 'B'
        }
      }
    }
  }

  const drugMapping = drugGeneMappings[drug]?.[gene]?.[clinicalOutcome]
  
  if (drugMapping) {
    return {
      gene,
      predictedPhenotype: drugMapping.phenotype,
      clinicalResponse: clinicalOutcome,
      mechanismExplanation: drugMapping.explanation,
      cpicLevel: drugMapping.cpicLevel
    }
  }

  // Default prediction if no specific mapping exists
  return {
    gene,
    predictedPhenotype: 'Possible Normal Metabolizer',
    clinicalResponse: clinicalOutcome,
    mechanismExplanation: 'The observed clinical response may be associated with altered enzyme activity influenced by genetic variability.',
    cpicLevel: 'C'
  }
}

export function generatePhenotypePredictions(
  medications: string,
  clinicalOutcome: 'Effective' | 'Drug_Failure' | 'ADR'
): PhenotypePrediction[] {
  const drugList = medications.split(',').map(m => m.trim().split(' ')[0])
  const predictions: PhenotypePrediction[] = []

  const knownGenes: Record<string, string[]> = {
    'Clopidogrel': ['CYP2C19'],
    'Codeine': ['CYP2D6'],
    'Warfarin': ['CYP2C9', 'VKORC1'],
    'Tacrolimus': ['CYP3A5'],
    'Simvastatin': ['CYP3A4'],
    'Metoprolol': ['CYP2D6'],
    'Venlafaxine': ['CYP2D6'],
    'Atomoxetine': ['CYP2D6'],
  }

  drugList.forEach(drug => {
    const genes = knownGenes[drug]
    if (genes) {
      genes.forEach(gene => {
        const prediction = predictPhenotypeFromOutcome(drug, gene, clinicalOutcome)
        predictions.push(prediction)
      })
    }
  })

  return predictions
}
