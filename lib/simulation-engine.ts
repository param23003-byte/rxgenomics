// Simulation Mode Engine - For testing different metabolizer phenotypes
export type MetabolizerPhenotype = 'Ultra-Rapid' | 'Rapid' | 'Normal' | 'Intermediate' | 'Poor'

export interface SimulationConfig {
  enabled: boolean
  selectedMetabolizer: MetabolizerPhenotype
  gene: string
  drug: string
}

export interface SimulationResult {
  baselineRecommendation: string
  simulatedRecommendation: string
  dosageAdjustment: string
  riskChanges: {
    score: number
    level: string
  }
  clinicalNotes: string[]
}

export function runSimulation(
  baselineRiskScore: number,
  metabolizer: MetabolizerPhenotype,
  drug: string,
  baselineRecommendation: string
): SimulationResult {
  const metabolizerScoreModifiers: { [key in MetabolizerPhenotype]: number } = {
    'Ultra-Rapid': -20,
    'Rapid': -10,
    'Normal': 0,
    'Intermediate': 10,
    'Poor': 25
  }

  const scoreChange = metabolizerScoreModifiers[metabolizer]
  const newScore = Math.max(0, Math.min(100, baselineRiskScore + scoreChange))

  let riskLevel = 'Low'
  if (newScore >= 70) riskLevel = 'High'
  else if (newScore >= 40) riskLevel = 'Moderate'

  let dosageAdjustment = 'Standard dosing'
  const clinicalNotes: string[] = []

  if (metabolizer === 'Ultra-Rapid' || metabolizer === 'Rapid') {
    dosageAdjustment = `Increase dose by 25-50% or consider more frequent dosing intervals`
    clinicalNotes.push('Patient may require higher doses for therapeutic effect')
    clinicalNotes.push('Monitor drug levels and clinical response closely')
  } else if (metabolizer === 'Poor' || metabolizer === 'Intermediate') {
    dosageAdjustment = `Reduce dose by 25-50% or extend dosing interval`
    clinicalNotes.push('Patient at increased risk for drug accumulation and toxicity')
    clinicalNotes.push('Consider starting at lowest effective dose and titrate carefully')
    clinicalNotes.push('Monitor for adverse effects more frequently')
  } else {
    clinicalNotes.push('Patient has predicted normal metabolizer phenotype')
    clinicalNotes.push('Standard dosing and monitoring recommended')
  }

  return {
    baselineRecommendation,
    simulatedRecommendation: `Based on ${metabolizer} metabolizer status: ${
      metabolizer === 'Ultra-Rapid' ? 'May require dose escalation' :
      metabolizer === 'Rapid' ? 'May require dose adjustment' :
      metabolizer === 'Normal' ? 'Standard therapy appropriate' :
      metabolizer === 'Intermediate' ? 'Monitor for inadequate response or toxicity' :
      'High risk for toxicity - dose reduction strongly recommended'
    }`,
    dosageAdjustment,
    riskChanges: {
      score: newScore,
      level: riskLevel
    },
    clinicalNotes
  }
}

export function compareMetabolizers(
  drug: string,
  baselineRiskScore: number
): { [key in MetabolizerPhenotype]: SimulationResult } {
  const results = {} as { [key in MetabolizerPhenotype]: SimulationResult }
  const phenotypes: MetabolizerPhenotype[] = ['Ultra-Rapid', 'Rapid', 'Normal', 'Intermediate', 'Poor']

  phenotypes.forEach(phenotype => {
    results[phenotype] = runSimulation(baselineRiskScore, phenotype, drug, 'See simulation for details')
  })

  return results
}
