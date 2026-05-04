// PGx Risk Score Engine
export type RiskLevel = 'Low' | 'Moderate' | 'High'
export type CPICLevel = 'A' | 'B' | 'C'

export interface PGxRiskScore {
  score: number // 0-100
  riskLevel: RiskLevel
  cpicLevel: CPICLevel
  factors: string[]
  recommendations: string[]
}

export interface PGxAlert {
  drug: string
  gene: string
  phenotype: string
  cpicLevel: CPICLevel
  metabolizerStatus: 'Ultra-Rapid' | 'Rapid' | 'Normal' | 'Intermediate' | 'Poor'
  dosageAdjustment: string
  clinicalRecommendation: string
  severity: 'critical' | 'warning' | 'normal'
}

export function calculatePGxRiskScore(
  alerts: PGxAlert[],
  adverseReactionSeverity: 'mild' | 'moderate' | 'severe',
  naranjoScore: number,
  patientFactors?: {
    age?: number
    hasRenal?: boolean
    hasHepatic?: boolean
    pregnancyStatus?: 'pregnant' | 'breastfeeding' | 'none'
  }
): PGxRiskScore {
  let score = 0
  const factors: string[] = []
  const recommendations: string[] = []

  // Base score from adverse reaction severity
  const severityScores = { mild: 10, moderate: 35, severe: 60 }
  score += severityScores[adverseReactionSeverity] || 0
  factors.push(`Adverse reaction severity: ${adverseReactionSeverity}`)

  // Naranjo score contribution
  if (naranjoScore >= 9) {
    score += 25
    factors.push('High Naranjo score (Definite causality)')
  } else if (naranjoScore >= 5) {
    score += 15
    factors.push('Moderate Naranjo score (Probable causality)')
  } else if (naranjoScore >= 1) {
    score += 8
    factors.push('Low Naranjo score (Possible causality)')
  }

  // PGx alerts contribution
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length

  score += criticalAlerts * 20
  score += warningAlerts * 10

  if (criticalAlerts > 0) {
    factors.push(`${criticalAlerts} critical PGx alert(s)`)
  }
  if (warningAlerts > 0) {
    factors.push(`${warningAlerts} warning PGx alert(s)`)
  }

  // Patient factors
  if (patientFactors?.age && patientFactors.age > 75) {
    score += 10
    factors.push('Elderly patient (>75 years)')
  }

  if (patientFactors?.hasRenal) {
    score += 15
    factors.push('Renal impairment detected')
  }

  if (patientFactors?.hasHepatic) {
    score += 15
    factors.push('Hepatic impairment detected')
  }

  if (patientFactors?.pregnancyStatus && patientFactors.pregnancyStatus !== 'none') {
    score += 20
    factors.push(`Patient is ${patientFactors.pregnancyStatus}`)
  }

  // Cap score at 100
  score = Math.min(score, 100)

  // Determine risk level
  let riskLevel: RiskLevel = 'Low'
  let cpicLevel: CPICLevel = 'C'

  if (score >= 70) {
    riskLevel = 'High'
    cpicLevel = 'A'
    recommendations.push('Urgent pharmacogenomic testing recommended')
    recommendations.push('Consider immediate drug alternative or dose adjustment')
    recommendations.push('Recommend specialist consultation')
  } else if (score >= 40) {
    riskLevel = 'Moderate'
    cpicLevel = 'B'
    recommendations.push('Pharmacogenomic testing recommended')
    recommendations.push('Monitor patient closely for adverse reactions')
    recommendations.push('Consider dose adjustment based on metabolizer status')
  } else {
    riskLevel = 'Low'
    cpicLevel = 'C'
    recommendations.push('Standard monitoring recommended')
    recommendations.push('Pharmacogenomic testing optional')
  }

  // Add alert-specific recommendations
  for (const alert of alerts) {
    if (alert.severity === 'critical') {
      recommendations.push(`${alert.drug}: ${alert.clinicalRecommendation}`)
    }
  }

  return {
    score,
    riskLevel,
    cpicLevel,
    factors,
    recommendations
  }
}

export function getMolecularMetabolizer(
  genotype: string
): 'Ultra-Rapid' | 'Rapid' | 'Normal' | 'Intermediate' | 'Poor' {
  // Simplified genotype to phenotype mapping
  if (genotype.includes('*1/*1')) return 'Normal'
  if (genotype.includes('*1/*2') || genotype.includes('*2/*2')) return 'Intermediate'
  if (genotype.includes('*3') || genotype.includes('*4')) return 'Poor'
  if (genotype.includes('*17/*1')) return 'Rapid'
  if (genotype.includes('*17/*17')) return 'Ultra-Rapid'
  return 'Normal'
}

export function generatePGxAlert(
  drug: string,
  gene: string,
  genotype: string,
  cpicGuidelines?: { [key: string]: string }
): PGxAlert {
  const metabolizer = getMolecularMetabolizer(genotype)

  let dosageAdjustment = 'Standard dosing'
  let severity: 'critical' | 'warning' | 'normal' = 'normal'
  let cpicLevel: CPICLevel = 'C'

  // Drug-specific adjustments
  if (drug.toLowerCase().includes('clopidogrel') && gene === 'CYP2C19') {
    if (metabolizer === 'Poor') {
      dosageAdjustment = '75mg daily NOT recommended; consider prasugrel or ticagrelor'
      severity = 'critical'
      cpicLevel = 'A'
    } else if (metabolizer === 'Intermediate') {
      dosageAdjustment = 'Consider 600mg loading dose, then 75mg daily'
      severity = 'warning'
      cpicLevel = 'B'
    }
  } else if (drug.toLowerCase().includes('warfarin') && (gene === 'VKORC1' || gene === 'CYP2C9')) {
    if (metabolizer === 'Poor') {
      dosageAdjustment = 'Lower initial dose recommended; frequent INR monitoring'
      severity = 'warning'
      cpicLevel = 'B'
    }
  } else if (drug.toLowerCase().includes('tacrolimus') && gene === 'CYP3A5') {
    if (metabolizer === 'Normal' || metabolizer === 'Rapid') {
      dosageAdjustment = 'May require higher doses for therapeutic levels'
      severity = 'warning'
      cpicLevel = 'B'
    } else if (metabolizer === 'Poor') {
      dosageAdjustment = 'Lower doses may be sufficient; monitor levels'
      severity = 'normal'
      cpicLevel = 'B'
    }
  }

  return {
    drug,
    gene,
    phenotype: metabolizer,
    cpicLevel,
    metabolizerStatus: metabolizer,
    dosageAdjustment,
    clinicalRecommendation: cpicGuidelines?.[`${drug}_${metabolizer}`] ||
      `${drug} dosing should be adjusted based on ${metabolizer} metabolizer status`,
    severity
  }
}
