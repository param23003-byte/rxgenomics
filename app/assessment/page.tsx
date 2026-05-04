'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Download, ChevronRight, ChevronLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Naranjo Scale Questions
const NARANJO_QUESTIONS = [
  'Are there previous conclusive reports on this reaction?',
  'Did the adverse event appear after the suspected drug was administered?',
  'Did the adverse reaction improve when the drug was discontinued or a specific antagonist was administered?',
  'Did the adverse reaction reappear when the drug was readministered?',
  'Are there alternative causes (other than the drug) that could on their own have caused the reaction?',
  'Did the reaction reappear when a placebo was given?',
  'Was the drug detected in the blood (or other fluids) in concentrations known to be toxic?',
  'Was the reaction more severe when the dose was increased or less severe when the dose was decreased?',
  'Had the patient ever experienced this reaction to the same or chemically related drugs in any previous exposure?',
  'Was the adverse event confirmed by any objective evidence?',
]

const NARANJO_RESPONSES = [
  { label: 'Yes', value: 1, points: 1 },
  { label: 'No', value: 0, points: 0 },
  { label: 'Unknown', value: -1, points: 0 },
]

interface PatientData {
  name: string
  mrn: string
  age: string
  gender: string
  weight: string
  medications: string
  adverse_reaction: string
}

interface NaranjoResponse {
  questionIndex: number
  value: number
}

type CausalityGrade = 'Definite' | 'Probable' | 'Possible' | 'Doubtful'

interface AssessmentResult {
  naranjoScore: number
  causality: CausalityGrade
  pgxAlerts: Array<{
    drug: string
    gene: string
    phenotype: string
    recommendation: string
    severity: 'critical' | 'warning' | 'normal'
  }>
}

function getCausalityGrade(score: number): CausalityGrade {
  if (score >= 9) return 'Definite'
  if (score >= 5) return 'Probable'
  if (score >= 1) return 'Possible'
  return 'Doubtful'
}

function calculateNaranjoScore(responses: NaranjoResponse[]): number {
  return responses.reduce((total, response) => {
    const question = NARANJO_QUESTIONS[response.questionIndex]
    const responseItem = NARANJO_RESPONSES.find(r => r.value === response.value)
    
    if (!responseItem) return total

    // Different questions have different scoring rules
    switch (response.questionIndex) {
      case 0: // Previous reports
        return total + (response.value === 1 ? 1 : response.value === 0 ? 0 : 0)
      case 1: // Temporal relation
        return total + (response.value === 1 ? 2 : response.value === 0 ? -1 : 0)
      case 2: // Dechallenge
        return total + (response.value === 1 ? 3 : response.value === 0 ? -1 : 0)
      case 3: // Rechallenge
        return total + (response.value === 1 ? 3 : response.value === 0 ? -1 : 0)
      case 4: // Alternative causes
        return total + (response.value === 1 ? -3 : response.value === 0 ? 2 : 1)
      case 5: // Placebo
        return total + (response.value === 1 ? 1 : response.value === 0 ? 0 : 0)
      case 6: // Drug levels
        return total + (response.value === 1 ? 2 : response.value === 0 ? 0 : 0)
      case 7: // Dose effect
        return total + (response.value === 1 ? 1 : response.value === 0 ? 0 : 0)
      case 8: // Previous exposure
        return total + (response.value === 1 ? 1 : response.value === 0 ? 0 : 0)
      case 9: // Objective evidence
        return total + (response.value === 1 ? 2 : response.value === 0 ? 0 : 0)
      default:
        return total
    }
  }, 0)
}

function mapPgxRules(medication: string, adverseReaction: string): AssessmentResult['pgxAlerts'] {
  const lowerMed = medication.toLowerCase()
  const alerts: AssessmentResult['pgxAlerts'] = []

  if (lowerMed.includes('clopidogrel') || lowerMed.includes('plavix')) {
    alerts.push({
      drug: 'Clopidogrel',
      gene: 'CYP2C19',
      phenotype: 'Possible Poor Metabolizer',
      recommendation: 'Consider genotyping for CYP2C19. If poor metabolizer, consider prasugrel or ticagrelor.',
      severity: 'warning'
    })
  }

  if (lowerMed.includes('warfarin') || lowerMed.includes('coumadin')) {
    alerts.push({
      drug: 'Warfarin',
      gene: 'VKORC1 / CYP2C9',
      phenotype: 'Variable metabolism',
      recommendation: 'INR monitoring recommended. Pharmacogenetic testing may guide dosing.',
      severity: 'normal'
    })
  }

  if (lowerMed.includes('tacrolimus') || lowerMed.includes('prograf')) {
    alerts.push({
      drug: 'Tacrolimus',
      gene: 'CYP3A5',
      phenotype: 'CYP3A5 expression variant',
      recommendation: 'CYP3A5 genotyping recommended for optimal immunosuppression.',
      severity: 'normal'
    })
  }

  return alerts
}

export default function AssessmentPage() {
  const [currentStep, setCurrentStep] = useState<'patient' | 'medication' | 'naranjo' | 'results'>('patient')
  const [patientData, setPatientData] = useState<PatientData>({
    name: '',
    mrn: '',
    age: '',
    gender: '',
    weight: '',
    medications: '',
    adverse_reaction: '',
  })

  const [naranjoResponses, setNaranjoResponses] = useState<NaranjoResponse[]>([])
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)

  const handlePatientChange = (field: keyof PatientData, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }))
  }

  const handleNaranjoResponse = (questionIndex: number, value: number) => {
    setNaranjoResponses(prev => {
      const existing = prev.find(r => r.questionIndex === questionIndex)
      if (existing) {
        return prev.map(r => r.questionIndex === questionIndex ? { ...r, value } : r)
      }
      return [...prev, { questionIndex, value }]
    })
  }

  const canProceedFromStep = (): boolean => {
    switch (currentStep) {
      case 'patient':
        return patientData.name && patientData.mrn && patientData.age && patientData.gender && patientData.weight
      case 'medication':
        return patientData.medications && patientData.adverse_reaction
      case 'naranjo':
        return naranjoResponses.length === NARANJO_QUESTIONS.length
      default:
        return true
    }
  }

  const handleProceed = () => {
    if (currentStep === 'patient') {
      setCurrentStep('medication')
    } else if (currentStep === 'medication') {
      setCurrentStep('naranjo')
    } else if (currentStep === 'naranjo') {
      const score = calculateNaranjoScore(naranjoResponses)
      const causality = getCausalityGrade(score)
      const pgxAlerts = mapPgxRules(patientData.medications, patientData.adverse_reaction)
      
      setAssessmentResult({
        naranjoScore: score,
        causality,
        pgxAlerts,
      })
      setCurrentStep('results')
    }
  }

  const handleBack = () => {
    if (currentStep === 'medication') {
      setCurrentStep('patient')
    } else if (currentStep === 'naranjo') {
      setCurrentStep('medication')
    } else if (currentStep === 'results') {
      setCurrentStep('naranjo')
    }
  }

  const getStepProgress = (): number => {
    const steps = { patient: 25, medication: 50, naranjo: 75, results: 100 }
    return steps[currentStep]
  }

  const downloadReport = async () => {
    const element = document.getElementById('report-content')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 190
      const pageHeight = 277
      let heightLeft = (canvas.height * imgWidth) / canvas.width
      let position = 10

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, (canvas.height * imgWidth) / canvas.width)

      heightLeft -= pageHeight - 20

      while (heightLeft > 0) {
        position = heightLeft - (canvas.height * imgWidth) / canvas.width
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, (canvas.height * imgWidth) / canvas.width)
        heightLeft -= pageHeight
      }

      const fileName = `CDSS_Assessment_${patientData.mrn}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('[v0] Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const progressPercent = getStepProgress()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Clinical Decision Support System
          </h1>
          <p className="text-lg text-slate-600">
            Adverse Drug Reaction Assessment & Pharmacogenomic Analysis
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">
              Step {['patient', 'medication', 'naranjo', 'results'].indexOf(currentStep) + 1} of 4
            </span>
            <span className="text-sm font-medium text-slate-500">
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Patient Information Step */}
        {currentStep === 'patient' && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Patient Information</CardTitle>
              <CardDescription>Enter basic patient demographics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">Patient Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={patientData.name}
                    onChange={(e) => handlePatientChange('name', e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mrn" className="text-base font-medium">Medical Record Number</Label>
                  <Input
                    id="mrn"
                    placeholder="12345678"
                    value={patientData.mrn}
                    onChange={(e) => handlePatientChange('mrn', e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-base font-medium">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="45"
                    value={patientData.age}
                    onChange={(e) => handlePatientChange('age', e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-base font-medium">Gender</Label>
                  <Select value={patientData.gender} onValueChange={(value) => handlePatientChange('gender', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="O">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="weight" className="text-base font-medium">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={patientData.weight}
                    onChange={(e) => handlePatientChange('weight', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medication & Outcome Step */}
        {currentStep === 'medication' && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Medication & Adverse Reaction</CardTitle>
              <CardDescription>Document the suspected drug and adverse reaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="medications" className="text-base font-medium">Suspected Medication(s)</Label>
                <Input
                  id="medications"
                  placeholder="e.g., Clopidogrel, Warfarin"
                  value={patientData.medications}
                  onChange={(e) => handlePatientChange('medications', e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adverse_reaction" className="text-base font-medium">Adverse Reaction Description</Label>
                <Textarea
                  id="adverse_reaction"
                  placeholder="Describe the adverse reaction in detail..."
                  value={patientData.adverse_reaction}
                  onChange={(e) => handlePatientChange('adverse_reaction', e.target.value)}
                  className="min-h-32"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Naranjo Scale Step */}
        {currentStep === 'naranjo' && (
          <div className="space-y-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Naranjo Adverse Drug Reaction Probability Scale</h2>
              <p className="text-slate-600 mb-4">Answer the following questions to calculate causality probability</p>
            </div>

            {NARANJO_QUESTIONS.map((question, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-slate-900 flex-1 pr-4">
                        <span className="inline-block bg-blue-100 text-blue-700 rounded-full h-7 w-7 text-center mr-3 font-semibold">
                          {index + 1}
                        </span>
                        {question}
                      </h3>
                    </div>
                    <RadioGroup 
                      value={naranjoResponses.find(r => r.questionIndex === index)?.value?.toString() ?? ''}
                      onValueChange={(value) => handleNaranjoResponse(index, parseInt(value))}
                    >
                      <div className="flex items-center space-x-8">
                        {NARANJO_RESPONSES.map((response) => (
                          <div key={response.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={response.value.toString()} id={`q${index}-${response.value}`} />
                            <Label htmlFor={`q${index}-${response.value}`} className="font-normal cursor-pointer">
                              {response.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Step */}
        {currentStep === 'results' && assessmentResult && (
          <div id="report-content" className="space-y-6 mb-8">
            {/* Naranjo Score Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-2xl">Naranjo Assessment Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Naranjo Score</p>
                    <div className="text-5xl font-bold text-blue-600">
                      {assessmentResult.naranjoScore}
                    </div>
                    <p className="text-sm text-slate-500">out of 13 points</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-600">Causality Assessment</p>
                    <Badge className={cn(
                      'px-4 py-2 text-lg font-semibold',
                      assessmentResult.causality === 'Definite' && 'bg-red-100 text-red-800',
                      assessmentResult.causality === 'Probable' && 'bg-orange-100 text-orange-800',
                      assessmentResult.causality === 'Possible' && 'bg-yellow-100 text-yellow-800',
                      assessmentResult.causality === 'Doubtful' && 'bg-gray-100 text-gray-800',
                    )}>
                      {assessmentResult.causality}
                    </Badge>
                    <p className="text-xs text-slate-500">
                      {assessmentResult.causality === 'Definite' && '≥9 points: Strong evidence of causality'}
                      {assessmentResult.causality === 'Probable' && '5-8 points: Good evidence of causality'}
                      {assessmentResult.causality === 'Possible' && '1-4 points: Weak evidence of causality'}
                      {assessmentResult.causality === 'Doubtful' && '≤0 points: Little to no evidence of causality'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PGx Alerts */}
            {assessmentResult.pgxAlerts.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Pharmacogenomic Alerts</CardTitle>
                  <CardDescription>Drug-gene interaction findings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assessmentResult.pgxAlerts.map((alert, index) => (
                    <Alert 
                      key={index}
                      className={cn(
                        'border-l-4',
                        alert.severity === 'critical' && 'border-l-red-500 bg-red-50',
                        alert.severity === 'warning' && 'border-l-orange-500 bg-orange-50',
                        alert.severity === 'normal' && 'border-l-blue-500 bg-blue-50',
                      )}
                    >
                      <AlertCircle className={cn(
                        'h-4 w-4',
                        alert.severity === 'critical' && 'text-red-600',
                        alert.severity === 'warning' && 'text-orange-600',
                        alert.severity === 'normal' && 'text-blue-600',
                      )} />
                      <AlertDescription className="ml-2">
                        <p className="font-semibold text-slate-900 mb-1">{alert.drug} - {alert.gene}</p>
                        <p className="text-sm text-slate-700 mb-2">Phenotype: {alert.phenotype}</p>
                        <p className="text-sm text-slate-600">{alert.recommendation}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Patient Summary */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Patient Name</p>
                    <p className="text-lg font-semibold text-slate-900">{patientData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">MRN</p>
                    <p className="text-lg font-semibold text-slate-900">{patientData.mrn}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Suspected Medication</p>
                    <p className="text-lg font-semibold text-slate-900">{patientData.medications}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Adverse Reaction</p>
                    <p className="text-lg font-semibold text-slate-900">{patientData.adverse_reaction}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            className="gap-2"
            disabled={currentStep === 'patient'}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-4">
            {currentStep === 'results' && (
              <>
                <Button
                  onClick={() => {
                    setCurrentStep('patient')
                    setPatientData({ name: '', mrn: '', age: '', gender: '', weight: '', medications: '', adverse_reaction: '' })
                    setNaranjoResponses([])
                    setAssessmentResult(null)
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  Start New Assessment
                </Button>
                <Button
                  onClick={downloadReport}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
              </>
            )}
            {currentStep !== 'results' && (
              <Button
                onClick={handleProceed}
                disabled={!canProceedFromStep()}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
