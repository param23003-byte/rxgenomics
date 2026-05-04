'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Download, ChevronRight, ChevronLeft, Save, RotateCcw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { ClinicalDisclaimer, GeneticTestingDisclaimer } from '@/components/clinical-disclaimer'
import { checkDrugInteractions } from '@/lib/ddi-database'
import { calculatePGxRiskScore, generatePGxAlert, type PGxAlert } from '@/lib/pgx-risk-engine'
import { generateRecommendations } from '@/lib/recommendations-engine'

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
  patientId: string
  name: string
  mrn: string
  age: string
  gender: string
  weight: string
  diagnosis: string
  medications: string
  adverse_reaction: string
  adr_severity: 'mild' | 'moderate' | 'severe'
  outcomeType: 'ADR' | 'Drug_Failure' | 'Effective'
}

interface NaranjoResponse {
  questionIndex: number
  value: number
}

type CausalityGrade = 'Definite' | 'Probable' | 'Possible' | 'Doubtful'

interface AssessmentResult {
  naranjoScore: number
  causality: CausalityGrade
  pgxAlerts: PGxAlert[]
  ddiAlerts: any[]
  riskScore: any
  recommendations: any
}

// Generate unique patient ID
function generatePatientId(): string {
  return `PT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
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

    switch (response.questionIndex) {
      case 0: return total + (response.value === 1 ? 1 : response.value === 0 ? 0 : 0)
      case 1: return total + (response.value === 1 ? 2 : response.value === 0 ? -1 : 0)
      case 2: return total + (response.value === 1 ? 3 : response.value === 0 ? -1 : 0)
      case 3: return total + (response.value === 1 ? 3 : response.value === 0 ? -1 : 0)
      case 4: return total + (response.value === 1 ? -3 : response.value === 0 ? 2 : 1)
      case 5: return total + (response.value === 1 ? 1 : response.value === 0 ? 0 : 0)
      case 6: return total + (response.value === 1 ? 2 : response.value === 0 ? 0 : 0)
      case 7: return total + (response.value === 1 ? 1 : response.value === 0 ? 0 : 0)
      case 8: return total + (response.value === 1 ? 1 : response.value === 0 ? 0 : 0)
      case 9: return total + (response.value === 1 ? 2 : response.value === 0 ? 0 : 0)
      default: return total
    }
  }, 0)
}

function mapPgxRules(medication: string, adverseReaction: string): PGxAlert[] {
  const lowerMed = medication.toLowerCase()
  const alerts: PGxAlert[] = []

  if (lowerMed.includes('clopidogrel') || lowerMed.includes('plavix')) {
    alerts.push(generatePGxAlert('Clopidogrel', 'CYP2C19', '*2/*2'))
  }

  if (lowerMed.includes('warfarin') || lowerMed.includes('coumadin')) {
    alerts.push(generatePGxAlert('Warfarin', 'VKORC1', '*1/*1'))
  }

  if (lowerMed.includes('tacrolimus') || lowerMed.includes('prograf')) {
    alerts.push(generatePGxAlert('Tacrolimus', 'CYP3A5', '*1/*1'))
  }

  return alerts
}

export default function AssessmentPage() {
  const [currentStep, setCurrentStep] = useState<'patient' | 'medication' | 'naranjo' | 'results'>('patient')
  const [patientData, setPatientData] = useState<PatientData>({
    patientId: generatePatientId(),
    name: '',
    mrn: '',
    age: '',
    gender: '',
    weight: '',
    diagnosis: '',
    medications: '',
    adverse_reaction: '',
    adr_severity: 'moderate',
    outcomeType: 'ADR'
  })
  const [naranjoResponses, setNaranjoResponses] = useState<NaranjoResponse[]>([])
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [showSimulationMode, setShowSimulationMode] = useState(false)

  const canProceedFromStep = (): boolean => {
    switch (currentStep) {
      case 'patient':
        return !!(patientData.name && patientData.age && patientData.gender && patientData.diagnosis)
      case 'medication':
        return !!(patientData.medications && patientData.adverse_reaction && patientData.adr_severity)
      case 'naranjo':
        return naranjoResponses.length === NARANJO_QUESTIONS.length
      default:
        return false
    }
  }

  const handleProceed = () => {
    if (currentStep === 'patient') {
      setCurrentStep('medication')
    } else if (currentStep === 'medication') {
      setCurrentStep('naranjo')
    } else if (currentStep === 'naranjo') {
      // Calculate results
      const naranjoScore = calculateNaranjoScore(naranjoResponses)
      const pgxAlerts = mapPgxRules(patientData.medications, patientData.adverse_reaction)
      const drugList = patientData.medications.split(',').map(d => d.trim())
      const ddiAlerts = checkDrugInteractions(drugList)
      
      const riskScore = calculatePGxRiskScore(pgxAlerts, patientData.adr_severity, naranjoScore, {
        age: parseInt(patientData.age),
        hasRenal: false,
        hasHepatic: false
      })

      const recommendations = generateRecommendations(
        naranjoScore,
        pgxAlerts.map(a => ({
          drug: a.drug,
          severity: a.severity,
          dosageAdjustment: a.dosageAdjustment,
          cpicLevel: a.cpicLevel
        })),
        patientData.adr_severity,
        patientData.outcomeType
      )

      setAssessmentResult({
        naranjoScore,
        causality: getCausalityGrade(naranjoScore),
        pgxAlerts,
        ddiAlerts,
        riskScore,
        recommendations
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

      const fileName = `CDSS_Assessment_${patientData.mrn || patientData.patientId}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('[v0] Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const saveCase = () => {
    const caseData = {
      patientData,
      naranjoResponses,
      assessmentResult,
      timestamp: new Date().toISOString()
    }
    const savedCases = JSON.parse(localStorage.getItem('savedCases') || '[]')
    savedCases.push(caseData)
    localStorage.setItem('savedCases', JSON.stringify(savedCases))
    alert('Case saved successfully!')
  }

  const resetAssessment = () => {
    setCurrentStep('patient')
    setPatientData({
      patientId: generatePatientId(),
      name: '',
      mrn: '',
      age: '',
      gender: '',
      weight: '',
      diagnosis: '',
      medications: '',
      adverse_reaction: '',
      adr_severity: 'moderate',
      outcomeType: 'ADR'
    })
    setNaranjoResponses([])
    setAssessmentResult(null)
  }

  const progressPercentage = ((Object.keys({
    'patient': currentStep === 'patient' || currentStep === 'medication' || currentStep === 'naranjo' || currentStep === 'results',
    'medication': currentStep === 'medication' || currentStep === 'naranjo' || currentStep === 'results',
    'naranjo': currentStep === 'naranjo' || currentStep === 'results',
    'results': currentStep === 'results'
  }).filter(k => {
    const isComplete: { [key: string]: boolean } = {
      'patient': currentStep !== 'patient',
      'medication': currentStep === 'medication' || currentStep === 'naranjo' || currentStep === 'results',
      'naranjo': currentStep === 'naranjo' || currentStep === 'results',
      'results': currentStep === 'results'
    }
    return isComplete[k]
  }).length) / 4) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinical Assessment</h1>
          <p className="text-gray-600">Comprehensive ADR & PGx Analysis</p>
          <p className="text-sm text-blue-600 font-mono mt-2">Case ID: {patientData.patientId}</p>
        </div>

        {/* Clinical Disclaimer */}
        <ClinicalDisclaimer type="assessment" />

        {/* Progress Indicator */}
        <Card className="mb-6 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-blue-600">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between mt-4 text-xs text-gray-600">
              <span className={currentStep === 'patient' ? 'font-semibold text-blue-600' : ''}>Patient Info</span>
              <span className={currentStep === 'medication' ? 'font-semibold text-blue-600' : ''}>Medication & ADR</span>
              <span className={currentStep === 'naranjo' ? 'font-semibold text-blue-600' : ''}>Naranjo Scale</span>
              <span className={currentStep === 'results' ? 'font-semibold text-blue-600' : ''}>Results</span>
            </div>
          </CardContent>
        </Card>

        {/* Patient Information Step */}
        {currentStep === 'patient' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Enter basic patient demographics and clinical diagnosis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Patient Name</Label>
                  <Input
                    id="name"
                    value={patientData.name}
                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <Label htmlFor="mrn">Medical Record Number</Label>
                  <Input
                    id="mrn"
                    value={patientData.mrn}
                    onChange={(e) => setPatientData({ ...patientData, mrn: e.target.value })}
                    placeholder="MRN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={patientData.age}
                    onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={patientData.gender} onValueChange={(value) => setPatientData({ ...patientData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={patientData.weight}
                    onChange={(e) => setPatientData({ ...patientData, weight: e.target.value })}
                    placeholder="Weight"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="diagnosis">Clinical Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={patientData.diagnosis}
                  onChange={(e) => setPatientData({ ...patientData, diagnosis: e.target.value })}
                  placeholder="e.g., Acute MI, Atrial Fibrillation, Post-transplant"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medication & Adverse Reaction Step */}
        {currentStep === 'medication' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Medication & Adverse Reaction</CardTitle>
              <CardDescription>Enter current medications and suspected adverse reaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  value={patientData.medications}
                  onChange={(e) => setPatientData({ ...patientData, medications: e.target.value })}
                  placeholder="Enter medications separated by commas (e.g., Clopidogrel 75mg daily, Omeprazole 20mg daily)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="reaction">Suspected Adverse Reaction</Label>
                <Textarea
                  id="reaction"
                  value={patientData.adverse_reaction}
                  onChange={(e) => setPatientData({ ...patientData, adverse_reaction: e.target.value })}
                  placeholder="Describe the adverse reaction in detail"
                  rows={3}
                />
              </div>

              <div>
                <Label>ADR Severity</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {(['mild', 'moderate', 'severe'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={patientData.adr_severity === level ? 'default' : 'outline'}
                      onClick={() => setPatientData({ ...patientData, adr_severity: level })}
                      className="capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Clinical Outcome Type</Label>
                <Select value={patientData.outcomeType} onValueChange={(value) => setPatientData({ ...patientData, outcomeType: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADR">Adverse Drug Reaction (ADR)</SelectItem>
                    <SelectItem value="Drug_Failure">Drug Failure / Lack of Efficacy</SelectItem>
                    <SelectItem value="Effective">Effective (No ADR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Naranjo Scale Step */}
        {currentStep === 'naranjo' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Naranjo ADR Probability Scale</CardTitle>
              <CardDescription>Answer each question about the suspected adverse reaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {NARANJO_QUESTIONS.map((question, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <p className="font-medium text-gray-900 mb-3">{index + 1}. {question}</p>
                  <RadioGroup
                    value={naranjoResponses.find(r => r.questionIndex === index)?.value.toString() || ''}
                    onValueChange={(value) => {
                      const existing = naranjoResponses.find(r => r.questionIndex === index)
                      if (existing) {
                        setNaranjoResponses(naranjoResponses.map(r =>
                          r.questionIndex === index ? { ...r, value: parseInt(value) } : r
                        ))
                      } else {
                        setNaranjoResponses([...naranjoResponses, { questionIndex: index, value: parseInt(value) }])
                      }
                    }}
                  >
                    <div className="flex gap-6">
                      {NARANJO_RESPONSES.map((response) => (
                        <div key={response.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={response.value.toString()} id={`q${index}_${response.value}`} />
                          <Label htmlFor={`q${index}_${response.value}`} className="font-normal cursor-pointer">
                            {response.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Results Step */}
        {currentStep === 'results' && assessmentResult && (
          <>
            <div id="report-content" className="space-y-6">
              {/* Naranjo Score Card */}
              <Card className="border-blue-300 bg-blue-50">
                <CardHeader>
                  <CardTitle>Naranjo Score Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600">{assessmentResult.naranjoScore}</div>
                      <div className="text-sm text-gray-600">Naranjo Score</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-xl font-bold text-gray-900">{assessmentResult.causality}</div>
                      <div className="text-sm text-gray-600">Causality Grade</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-xl font-bold text-blue-600">{assessmentResult.riskScore.riskLevel}</div>
                      <div className="text-sm text-gray-600">Risk Level</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p><strong>Interpretation:</strong> {assessmentResult.causality === 'Definite' && 'The ADR is definitively caused by the drug.'}</p>
                    {assessmentResult.causality === 'Probable' && 'The ADR is probably caused by the drug.'}
                    {assessmentResult.causality === 'Possible' && 'The ADR is possibly caused by the drug.'}
                    {assessmentResult.causality === 'Doubtful' && 'The ADR causality is doubtful.'}
                  </div>
                </CardContent>
              </Card>

              {/* PGx Risk Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Pharmacogenomic Risk Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-bold text-blue-600">{assessmentResult.riskScore.score}</div>
                        <div className="text-sm text-gray-600">Risk Score (0-100)</div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-lg py-2 px-4 ${
                          assessmentResult.riskScore.riskLevel === 'High' ? 'bg-red-600' :
                          assessmentResult.riskScore.riskLevel === 'Moderate' ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}>
                          {assessmentResult.riskScore.riskLevel}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-2">CPIC Level: {assessmentResult.riskScore.cpicLevel}</p>
                      </div>
                    </div>
                    <Progress value={assessmentResult.riskScore.score} className="mt-4 h-3" />
                  </div>

                  {assessmentResult.riskScore.factors.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Risk Factors:</p>
                      <ul className="space-y-1">
                        {assessmentResult.riskScore.factors.map((factor, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PGx Alerts */}
              {assessmentResult.pgxAlerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pharmacogenomic Alerts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assessmentResult.pgxAlerts.map((alert, i) => (
                      <div key={i} className="border-l-4 border-blue-600 pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-900">{alert.drug} - {alert.gene}</p>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Phenotype: {alert.metabolizerStatus}</p>
                        <p className="text-sm text-gray-700 mt-2"><strong>Recommendation:</strong> {alert.dosageAdjustment}</p>
                        <p className="text-sm text-gray-600 mt-1">CPIC Level: {alert.cpicLevel}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* DDI Alerts */}
              {assessmentResult.ddiAlerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Drug-Drug Interactions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assessmentResult.ddiAlerts.map((ddi, i) => (
                      <div key={i} className="border-l-4 border-yellow-600 pl-4 py-2">
                        <p className="font-semibold text-gray-900">{ddi.drugA} + {ddi.drugB}</p>
                        <p className="text-sm text-gray-700 mt-1">{ddi.mechanism}</p>
                        <p className="text-sm text-gray-600 mt-1"><strong>Management:</strong> {ddi.management}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Clinical Recommendations */}
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle>Clinical Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Primary Recommendation:</p>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <Badge className={`${
                          assessmentResult.recommendations.primaryRecommendation.type === 'Discontinue' ? 'bg-red-600' :
                          assessmentResult.recommendations.primaryRecommendation.type === 'Alternative' ? 'bg-orange-600' :
                          assessmentResult.recommendations.primaryRecommendation.type === 'Adjust' ? 'bg-yellow-600' :
                          'bg-green-600'
                        } text-white`}>
                          {assessmentResult.recommendations.primaryRecommendation.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{assessmentResult.recommendations.primaryRecommendation.title}</p>
                          <p className="text-sm text-gray-700 mt-2">{assessmentResult.recommendations.primaryRecommendation.description}</p>
                          {assessmentResult.recommendations.primaryRecommendation.dosageAdjustment && (
                            <p className="text-sm text-blue-600 font-medium mt-2">
                              {assessmentResult.recommendations.primaryRecommendation.dosageAdjustment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {assessmentResult.recommendations.primaryRecommendation.monitoringRequirements && (
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Monitoring Requirements:</p>
                      <ul className="space-y-1">
                        {assessmentResult.recommendations.primaryRecommendation.monitoringRequirements.map((req, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <GeneticTestingDisclaimer />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-between mt-8">
              <Button
                onClick={handleBack}
                variant="outline"
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-4">
                <Button
                  onClick={saveCase}
                  variant="outline"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Case
                </Button>
                <Button
                  onClick={downloadReport}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
                <Button
                  onClick={resetAssessment}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  New Assessment
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 'results' && (
          <div className="flex gap-4 justify-between mt-8">
            <Button
              onClick={handleBack}
              variant="outline"
              className="gap-2"
              disabled={currentStep === 'patient'}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleProceed}
              disabled={!canProceedFromStep()}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
