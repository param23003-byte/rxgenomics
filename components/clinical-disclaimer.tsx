'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ClinicalDisclaimerProps {
  type?: 'assessment' | 'pgx' | 'ddi' | 'general'
  compact?: boolean
}

export function ClinicalDisclaimer({ type = 'general', compact = false }: ClinicalDisclaimerProps) {
  const disclaimers = {
    assessment: `This Clinical Decision Support System (CDSS) provides evidence-based guidance for adverse drug reaction assessment using the Naranjo scale. This tool is designed to assist healthcare professionals in clinical decision-making and should NOT replace professional medical judgment. All recommendations should be validated against current clinical guidelines and patient-specific factors.`,
    pgx: `Pharmacogenomic insights provided herein are based on published guidelines (CPIC, FDA) and represent current understanding of drug-gene interactions. These predictions require laboratory confirmation through genetic testing. This tool should not be used for diagnostic or therapeutic decision-making without appropriate clinical context and genetic confirmation.`,
    ddi: `Drug-drug interactions identified by this system are based on published literature and known mechanisms. This is not an exhaustive interaction checker. Clinicians should consult comprehensive drug interaction databases and apply clinical judgment, especially in complex polypharmacy situations.`,
    general: `This is a clinical decision support tool intended for use by licensed healthcare professionals only. It provides evidence-based recommendations that supplement, not replace, clinical judgment. All clinical decisions should be made in consultation with appropriate specialists and validated against current guidelines.`
  }

  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${compact ? 'mb-4' : 'mb-6'}`}>
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className={`text-yellow-900 ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="font-semibold mb-1">Clinical Disclaimer</div>
        <div>{disclaimers[type]}</div>
      </AlertDescription>
    </Alert>
  )
}

export function GeneticTestingDisclaimer() {
  return (
    <Alert className="border-blue-200 bg-blue-50 mb-4">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-900 text-sm">
        <div className="font-semibold mb-1">Genetic Testing Notice</div>
        <div>
          Pharmacogenomic recommendations in this system are based on established CPIC guidelines and represent
          consensus on drug-gene interactions. However, predictive insights should be confirmed through clinical-grade
          genetic testing before implementing major therapy changes. Consider ordering appropriate genetic testing panels
          when indicated by clinical findings.
        </div>
      </AlertDescription>
    </Alert>
  )
}
