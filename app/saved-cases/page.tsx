'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Trash2, FileText, Download, Home } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useRouter } from 'next/navigation'

interface SavedCase {
  patientData: any
  naranjoResponses: any[]
  assessmentResult: any
  timestamp: string
}

export default function SavedCasesPage() {
  const [cases, setCases] = useState<SavedCase[]>([])
  const [filter, setFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all')
  const router = useRouter()

  useEffect(() => {
    const savedCases = JSON.parse(localStorage.getItem('savedCases') || '[]')
    setCases(savedCases)
  }, [])

  const filteredCases = cases.filter(caseItem => {
    if (filter === 'all') return true
    return caseItem.assessmentResult?.riskScore?.riskLevel?.toLowerCase() === filter
  })

  const deleteCase = (index: number) => {
    const updated = cases.filter((_, i) => i !== index)
    setCases(updated)
    localStorage.setItem('savedCases', JSON.stringify(updated))
  }

  const downloadCase = async (caseItem: SavedCase) => {
    const element = document.createElement('div')
    element.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>Clinical Assessment Report</h1>
        <p><strong>Case ID:</strong> ${caseItem.patientData.patientId}</p>
        <p><strong>Patient:</strong> ${caseItem.patientData.name}</p>
        <p><strong>MRN:</strong> ${caseItem.patientData.mrn}</p>
        <p><strong>Age:</strong> ${caseItem.patientData.age}</p>
        <p><strong>Gender:</strong> ${caseItem.patientData.gender}</p>
        <p><strong>Diagnosis:</strong> ${caseItem.patientData.diagnosis}</p>
        <p><strong>Medications:</strong> ${caseItem.patientData.medications}</p>
        <p><strong>Adverse Reaction:</strong> ${caseItem.patientData.adverse_reaction}</p>
        
        <h2>Assessment Results</h2>
        <p><strong>Naranjo Score:</strong> ${caseItem.assessmentResult.naranjoScore}</p>
        <p><strong>Causality:</strong> ${caseItem.assessmentResult.causality}</p>
        <p><strong>Risk Level:</strong> ${caseItem.assessmentResult.riskScore.riskLevel}</p>
        <p><strong>Risk Score:</strong> ${caseItem.assessmentResult.riskScore.score}/100</p>
        <p><strong>CPIC Level:</strong> ${caseItem.assessmentResult.riskScore.cpicLevel}</p>
        <p><strong>Date:</strong> ${new Date(caseItem.timestamp).toLocaleString()}</p>
      </div>
    `

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

      const fileName = `CDSS_Case_${caseItem.patientData.patientId}_${new Date(caseItem.timestamp).toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('[v0] Error downloading case:', error)
      alert('Error downloading case. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Cases</h1>
            <p className="text-gray-600">Manage and review previously completed assessments</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="gap-2 h-fit"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>

        {/* No Cases Message */}
        {cases.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50 mb-6">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              No saved cases yet. Complete an assessment and save it to view it here.
            </AlertDescription>
          </Alert>
        )}

        {/* Filter Buttons */}
        {cases.length > 0 && (
          <div className="mb-6 flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All ({cases.length})
            </Button>
            <Button
              variant={filter === 'high' ? 'default' : 'outline'}
              onClick={() => setFilter('high')}
            >
              High Risk ({cases.filter(c => c.assessmentResult?.riskScore?.riskLevel === 'High').length})
            </Button>
            <Button
              variant={filter === 'moderate' ? 'default' : 'outline'}
              onClick={() => setFilter('moderate')}
            >
              Moderate Risk ({cases.filter(c => c.assessmentResult?.riskScore?.riskLevel === 'Moderate').length})
            </Button>
            <Button
              variant={filter === 'low' ? 'default' : 'outline'}
              onClick={() => setFilter('low')}
            >
              Low Risk ({cases.filter(c => c.assessmentResult?.riskScore?.riskLevel === 'Low').length})
            </Button>
          </div>
        )}

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCases.map((caseItem, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{caseItem.patientData.name}</CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-1">
                      {caseItem.patientData.patientId}
                    </CardDescription>
                  </div>
                  <Badge className={`${
                    caseItem.assessmentResult?.riskScore?.riskLevel === 'High' ? 'bg-red-600' :
                    caseItem.assessmentResult?.riskScore?.riskLevel === 'Moderate' ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}>
                    {caseItem.assessmentResult?.riskScore?.riskLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Naranjo Score</p>
                    <p className="text-lg font-bold text-blue-600">{caseItem.assessmentResult?.naranjoScore}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Risk Score</p>
                    <p className="text-lg font-bold text-purple-600">{caseItem.assessmentResult?.riskScore?.score}/100</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Diagnosis:</span>
                    <p className="font-medium text-gray-900">{caseItem.patientData.diagnosis}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Causality:</span>
                    <p className="font-medium text-gray-900">{caseItem.assessmentResult?.causality}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">CPIC Level:</span>
                    <p className="font-medium text-gray-900">{caseItem.assessmentResult?.riskScore?.cpicLevel}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium text-gray-900">{new Date(caseItem.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => downloadCase(caseItem)}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={() => deleteCase(index)}
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCases.length === 0 && cases.length > 0 && (
          <Card className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No cases found with selected filter</p>
          </Card>
        )}
      </div>
    </div>
  )
}
