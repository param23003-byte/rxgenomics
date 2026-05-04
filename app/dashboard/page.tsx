'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Download, BarChart3, TrendingUp, Users } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ClinicalDisclaimer } from '@/components/clinical-disclaimer'

interface CaseAnalytics {
  totalCases: number
  completedCases: number
  averageNaranjoScore: number
  riskDistribution: {
    low: number
    moderate: number
    high: number
  }
  causalityDistribution: {
    definite: number
    probable: number
    possible: number
    doubtful: number
  }
  topDrugs: { name: string; count: number }[]
  topGenes: { name: string; count: number }[]
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<CaseAnalytics | null>(null)
  const [researchMode, setResearchMode] = useState(false)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    // Load and process saved cases from localStorage
    const savedCases = JSON.parse(localStorage.getItem('savedCases') || '[]')
    
    if (savedCases.length === 0) {
      // Generate mock data for demonstration
      setAnalytics({
        totalCases: 42,
        completedCases: 38,
        averageNaranjoScore: 6.2,
        riskDistribution: { low: 15, moderate: 18, high: 9 },
        causalityDistribution: { definite: 8, probable: 15, possible: 12, doubtful: 7 },
        topDrugs: [
          { name: 'Clopidogrel', count: 8 },
          { name: 'Warfarin', count: 7 },
          { name: 'Tacrolimus', count: 5 },
          { name: 'Omeprazole', count: 4 },
          { name: 'NSAIDs', count: 3 }
        ],
        topGenes: [
          { name: 'CYP2C19', count: 12 },
          { name: 'VKORC1', count: 8 },
          { name: 'CYP3A5', count: 7 },
          { name: 'CYP2C9', count: 5 },
          { name: 'HLA-B*5701', count: 3 }
        ]
      })
    } else {
      // Process actual saved cases
      const processed: CaseAnalytics = {
        totalCases: savedCases.length,
        completedCases: savedCases.filter((c: any) => c.assessmentResult).length,
        averageNaranjoScore: 0,
        riskDistribution: { low: 0, moderate: 0, high: 0 },
        causalityDistribution: { definite: 0, probable: 0, possible: 0, doubtful: 0 },
        topDrugs: [],
        topGenes: []
      }

      // Calculate metrics
      let totalScore = 0
      const drugMap: { [key: string]: number } = {}
      const geneMap: { [key: string]: number } = {}

      savedCases.forEach((caseItem: any) => {
        if (caseItem.assessmentResult) {
          totalScore += caseItem.assessmentResult.naranjoScore
          
          const causality = caseItem.assessmentResult.causality.toLowerCase()
          processed.causalityDistribution[causality as keyof typeof processed.causalityDistribution]++

          const riskLevel = caseItem.assessmentResult.riskScore?.riskLevel?.toLowerCase() || 'low'
          if (riskLevel in processed.riskDistribution) {
            processed.riskDistribution[riskLevel as keyof typeof processed.riskDistribution]++
          }

          caseItem.assessmentResult.pgxAlerts?.forEach((alert: any) => {
            drugMap[alert.drug] = (drugMap[alert.drug] || 0) + 1
            geneMap[alert.gene] = (geneMap[alert.gene] || 0) + 1
          })
        }
      })

      processed.averageNaranjoScore = processed.completedCases > 0 ? totalScore / processed.completedCases : 0
      processed.topDrugs = Object.entries(drugMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      processed.topGenes = Object.entries(geneMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setAnalytics(processed)
    }
  }, [])

  const downloadAnalytics = () => {
    if (!analytics) return

    let csv = 'RxGenomics Analytics Report\n'
    csv += `Generated: ${new Date().toISOString()}\n\n`
    csv += 'Summary Metrics\n'
    csv += `Total Cases,${analytics.totalCases}\n`
    csv += `Completed Cases,${analytics.completedCases}\n`
    csv += `Average Naranjo Score,${analytics.averageNaranjoScore.toFixed(2)}\n\n`
    
    csv += 'Risk Distribution\n'
    csv += `Low,${analytics.riskDistribution.low}\n`
    csv += `Moderate,${analytics.riskDistribution.moderate}\n`
    csv += `High,${analytics.riskDistribution.high}\n\n`

    csv += 'Causality Distribution\n'
    csv += `Definite,${analytics.causalityDistribution.definite}\n`
    csv += `Probable,${analytics.causalityDistribution.probable}\n`
    csv += `Possible,${analytics.causalityDistribution.possible}\n`
    csv += `Doubtful,${analytics.causalityDistribution.doubtful}\n\n`

    csv += 'Top Drugs\n'
    analytics.topDrugs.forEach(drug => {
      csv += `${drug.name},${drug.count}\n`
    })

    csv += '\nTop Genes\n'
    analytics.topGenes.forEach(gene => {
      csv += `${gene.name},${gene.count}\n`
    })

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `rxgenomics-analytics-${new Date().toISOString().split('T')[0]}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-4">
        <div className="container max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Research & Clinical Decision Support Analytics</p>
        </div>

        <ClinicalDisclaimer type="general" compact />

        {/* Research Mode Toggle */}
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Research Mode</p>
                <p className="text-sm text-gray-600">Advanced analytics and data export for research purposes</p>
              </div>
              <Button
                variant={researchMode ? 'default' : 'outline'}
                onClick={() => setResearchMode(!researchMode)}
                className={researchMode ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                {researchMode ? 'Enabled' : 'Enable'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Cases</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalCases}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.completedCases}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Naranjo</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.averageNaranjoScore.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completion Rate</p>
                <Progress 
                  value={(analytics.completedCases / analytics.totalCases) * 100} 
                  className="h-2 mb-1"
                />
                <p className="text-lg font-bold text-gray-900">
                  {((analytics.completedCases / analytics.totalCases) * 100).toFixed(0)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Level Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Low Risk', count: analytics.riskDistribution.low, color: 'bg-green-500' },
                { label: 'Moderate Risk', count: analytics.riskDistribution.moderate, color: 'bg-yellow-500' },
                { label: 'High Risk', count: analytics.riskDistribution.high, color: 'bg-red-500' }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    <span className="text-sm text-gray-600">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${(item.count / analytics.totalCases) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Causality Assessment Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Definite', count: analytics.causalityDistribution.definite },
                { label: 'Probable', count: analytics.causalityDistribution.probable },
                { label: 'Possible', count: analytics.causalityDistribution.possible },
                { label: 'Doubtful', count: analytics.causalityDistribution.doubtful }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    <span className="text-sm text-gray-600">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(item.count / analytics.totalCases) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Top Drugs and Genes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Common Drugs Assessed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topDrugs.length > 0 ? (
                analytics.topDrugs.map((drug, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="font-medium text-gray-900">{drug.name}</span>
                    <Badge className="bg-blue-600">{drug.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Common Pharmacogenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topGenes.length > 0 ? (
                analytics.topGenes.map((gene, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <span className="font-medium text-gray-900">{gene.name}</span>
                    <Badge className="bg-purple-600">{gene.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Research Mode Features */}
        {researchMode && (
          <Card className="border-purple-300 bg-purple-50 mb-6">
            <CardHeader>
              <CardTitle className="text-purple-900">Research Mode Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-purple-300 bg-white">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-900">
                  Research mode provides advanced data analytics and export capabilities. All data analysis should follow institutional ethical guidelines and privacy regulations.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Available Reports:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Comprehensive case analytics CSV export</li>
                    <li>• Adverse drug reaction frequency analysis</li>
                    <li>• Pharmacogenomic variant distribution</li>
                    <li>• Clinical decision patterns and recommendations</li>
                    <li>• Risk stratification trends over time</li>
                  </ul>
                </div>

                <Button
                  onClick={downloadAnalytics}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="h-4 w-4" />
                  Export Analytics as CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Quality Notice */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">Data Quality Notice</p>
                <p className="text-sm text-yellow-800">
                  Analytics are based on cases completed through the CDSS assessment tool. These metrics represent local case analysis only and should not be used for population-level inferences without proper statistical methodology and institutional IRB approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
