// Enhanced Recommendation Engine
export type RecommendationType = 'Continue' | 'Adjust' | 'Alternative' | 'Discontinue'

export interface Recommendation {
  type: RecommendationType
  priority: 'urgent' | 'high' | 'moderate' | 'low'
  title: string
  description: string
  dosageAdjustment?: string
  alternatives?: string[]
  monitoringRequirements?: string[]
  evidenceLevel: 'A' | 'B' | 'C'
}

export interface RecommendationResult {
  primaryRecommendation: Recommendation
  secondaryRecommendations: Recommendation[]
  clinicalSummary: string
}

export function generateRecommendations(
  naranjoScore: number,
  pgxAlerts: Array<{
    drug: string
    severity: 'critical' | 'warning' | 'normal'
    dosageAdjustment: string
    cpicLevel: 'A' | 'B' | 'C'
  }>,
  adverseReactionSeverity: 'mild' | 'moderate' | 'severe',
  outcomeType?: 'ADR' | 'Drug_Failure' | 'Effective'
): RecommendationResult {
  const recommendations: Recommendation[] = []
  let primaryRecommendation: Recommendation

  // Analyze Naranjo score for causality
  const isCausal = naranjoScore >= 5

  // Get critical PGx alerts
  const criticalAlerts = pgxAlerts.filter(a => a.severity === 'critical')
  const warningAlerts = pgxAlerts.filter(a => a.severity === 'warning')

  // Primary recommendation logic
  if (criticalAlerts.length > 0 && isCausal && adverseReactionSeverity !== 'mild') {
    // Critical situation - recommend discontinuation or alternative
    primaryRecommendation = {
      type: 'Discontinue',
      priority: 'urgent',
      title: 'Discontinue Current Medication',
      description: `Based on high Naranjo score (${naranjoScore}) and critical PGx findings, discontinuation is strongly recommended. Severe ADR risk confirmed.`,
      alternatives: criticalAlerts.map(a => `Alternative to ${a.drug}`),
      monitoringRequirements: [
        'Monitor for ADR resolution',
        'Document withdrawal effects',
        'Initiate alternative therapy'
      ],
      evidenceLevel: 'A'
    }
  } else if ((criticalAlerts.length > 0 || warningAlerts.length > 0) && isCausal) {
    // Moderate to high concern - recommend adjustment or alternative
    primaryRecommendation = {
      type: 'Alternative',
      priority: 'high',
      title: 'Switch to Alternative Medication',
      description: `PGx analysis suggests poor metabolizer status or significant interaction risk. Consider switching to pharmacogenomically compatible alternative.`,
      alternatives: generateAlternatives(pgxAlerts[0]?.drug || ''),
      monitoringRequirements: [
        'Taper current medication appropriately',
        'Monitor for withdrawal effects',
        'Assess response to new medication'
      ],
      evidenceLevel: 'B'
    }
  } else if (warningAlerts.length > 0 && isCausal) {
    // Moderate concern - dose adjustment
    primaryRecommendation = {
      type: 'Adjust',
      priority: 'high',
      title: 'Adjust Medication Dosage',
      description: `Pharmacogenomic analysis indicates need for dose adjustment based on metabolizer status. Adjust dose to mitigate ADR risk.`,
      dosageAdjustment: warningAlerts[0]?.dosageAdjustment || 'Reduce dose by 25-50%',
      monitoringRequirements: [
        'Monitor therapeutic levels',
        'Assess ADR improvement',
        'Check for signs of under-treatment'
      ],
      evidenceLevel: 'B'
    }
  } else if (outcomeType === 'Drug_Failure' && !isCausal) {
    // Drug not working - PGx-based adjustment
    primaryRecommendation = {
      type: 'Adjust',
      priority: 'moderate',
      title: 'Increase Medication Dosage',
      description: 'Patient has poor therapeutic response. PGx analysis suggests ultra-rapid or rapid metabolizer status. Consider dose escalation.',
      dosageAdjustment: 'Increase dose by 25-50% based on metabolizer status',
      monitoringRequirements: [
        'Reassess therapeutic response in 2-4 weeks',
        'Monitor for adverse effects',
        'Check therapeutic drug levels if available'
      ],
      evidenceLevel: 'B'
    }
  } else {
    // Continue with monitoring
    primaryRecommendation = {
      type: 'Continue',
      priority: 'low',
      title: 'Continue Current Medication',
      description: 'Naranjo score and PGx analysis indicate low causality and minimal interaction risk. Continue current therapy with monitoring.',
      monitoringRequirements: ['Standard clinical monitoring', 'Routine follow-up'],
      evidenceLevel: 'C'
    }
  }

  // Generate secondary recommendations
  if (criticalAlerts.length > 0) {
    recommendations.push({
      type: 'Adjust',
      priority: 'high',
      title: 'Pharmacogenetic Testing Recommended',
      description: `Critical PGx findings detected: ${criticalAlerts.map(a => a.drug).join(', ')}. Confirm genotype with testing.`,
      monitoringRequirements: ['Order CYP450 panel', 'Document genetic results', 'Adjust therapy based on results'],
      evidenceLevel: 'A'
    })
  }

  if (warningAlerts.length > 0) {
    recommendations.push({
      type: 'Adjust',
      priority: 'moderate',
      title: 'Consider Pharmacogenetic Testing',
      description: `Warning-level PGx findings detected. Consider genetic testing to optimize dosing.`,
      monitoringRequirements: ['Optional CYP450 testing', 'Monitor clinical response'],
      evidenceLevel: 'B'
    })
  }

  // Clinical summary
  let clinicalSummary = `Assessment Summary:\n`
  clinicalSummary += `- Naranjo Score: ${naranjoScore} (${getCausalityText(naranjoScore)})\n`
  clinicalSummary += `- Adverse Reaction Severity: ${adverseReactionSeverity}\n`
  clinicalSummary += `- Critical PGx Alerts: ${criticalAlerts.length}\n`
  clinicalSummary += `- Warning PGx Alerts: ${warningAlerts.length}\n`
  clinicalSummary += `\nRecommendation: ${primaryRecommendation.type}`

  return {
    primaryRecommendation,
    secondaryRecommendations: recommendations,
    clinicalSummary
  }
}

function getCausalityText(score: number): string {
  if (score >= 9) return 'Definite'
  if (score >= 5) return 'Probable'
  if (score >= 1) return 'Possible'
  return 'Doubtful'
}

function generateAlternatives(drug: string): string[] {
  const alternatives: { [key: string]: string[] } = {
    'clopidogrel': ['Prasugrel', 'Ticagrelor', 'Aspirin + other anticoagulant'],
    'warfarin': ['Apixaban', 'Rivaroxaban', 'Dabigatran', 'Edoxaban'],
    'tacrolimus': ['Cyclosporine', 'Mycophenolate mofetil'],
    'metoprolol': ['Atenolol', 'Bisoprolol', 'Carvedilol'],
    'simvastatin': ['Pravastatin', 'Rosuvastatin', 'Atorvastatin'],
    'omeprazole': ['Pantoprazole', 'Lansoprazole', 'Ranitidine H2 blocker']
  }

  const lowerDrug = drug.toLowerCase()
  for (const [key, alts] of Object.entries(alternatives)) {
    if (lowerDrug.includes(key)) {
      return alts
    }
  }
  return ['Consult with specialist for alternatives']
}
