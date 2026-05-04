'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Search, Filter, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface DrugGeneInteraction {
  drug: string
  gene: string
  phenotype: string
  recommendation: string
  severity: 'critical' | 'warning' | 'normal'
  evidence: string
  dosageAdjustment: string
}

const DRUG_GENE_DATABASE: DrugGeneInteraction[] = [
  {
    drug: 'Clopidogrel',
    gene: 'CYP2C19',
    phenotype: 'Poor Metabolizer',
    recommendation: 'Avoid clopidogrel. Use prasugrel or ticagrelor instead.',
    severity: 'critical',
    evidence: 'Strong - FDA Black Box Warning',
    dosageAdjustment: 'Not recommended',
  },
  {
    drug: 'Clopidogrel',
    gene: 'CYP2C19',
    phenotype: 'Intermediate Metabolizer',
    recommendation: 'Use with caution. Consider dose increase or alternative agent.',
    severity: 'warning',
    evidence: 'Moderate',
    dosageAdjustment: 'Consider 600mg loading dose',
  },
  {
    drug: 'Warfarin',
    gene: 'VKORC1',
    phenotype: 'Low sensitivity variant',
    recommendation: 'Higher maintenance dose may be required.',
    severity: 'warning',
    evidence: 'Strong',
    dosageAdjustment: 'Usually 5-10 mg/day',
  },
  {
    drug: 'Warfarin',
    gene: 'CYP2C9',
    phenotype: '*2 or *3 variant',
    recommendation: 'Lower dose recommended. Close INR monitoring required.',
    severity: 'warning',
    evidence: 'Strong',
    dosageAdjustment: 'Reduce initial dose by 25-50%',
  },
  {
    drug: 'Tacrolimus',
    gene: 'CYP3A5',
    phenotype: 'CYP3A5*1/*1 (expressers)',
    recommendation: 'Higher doses typically needed for therapeutic levels.',
    severity: 'normal',
    evidence: 'Strong',
    dosageAdjustment: 'May require 1.5-2x standard dose',
  },
  {
    drug: 'Tacrolimus',
    gene: 'CYP3A5',
    phenotype: 'CYP3A5*3/*3 (non-expressers)',
    recommendation: 'Lower doses sufficient. Monitor drug levels closely.',
    severity: 'normal',
    evidence: 'Strong',
    dosageAdjustment: 'Standard to lower doses',
  },
  {
    drug: 'Simvastatin',
    gene: 'CYP3A4',
    phenotype: 'Poor Metabolizer',
    recommendation: 'Use lower dose or alternative statin.',
    severity: 'warning',
    evidence: 'Moderate',
    dosageAdjustment: 'Maximum 10mg daily',
  },
  {
    drug: 'Allopurinol',
    gene: 'HLA-B*5801',
    phenotype: 'Positive',
    recommendation: 'Avoid allopurinol. Use febuxostat or alternative agent.',
    severity: 'critical',
    evidence: 'Strong - Risk of severe hypersensitivity',
    dosageAdjustment: 'Contraindicated',
  },
  {
    drug: 'Abacavir',
    gene: 'HLA-B*5701',
    phenotype: 'Positive',
    recommendation: 'Avoid abacavir. Use alternative antiretroviral.',
    severity: 'critical',
    evidence: 'Strong - FDA requirement for testing',
    dosageAdjustment: 'Contraindicated',
  },
  {
    drug: 'Mercaptopurine',
    gene: 'TPMT',
    phenotype: 'Deficient/Intermediate',
    recommendation: 'Significantly reduce dose or use alternative therapy.',
    severity: 'critical',
    evidence: 'Strong',
    dosageAdjustment: 'Reduce by 90% for deficient, 30-50% for intermediate',
  },
]

export default function DrugGeneInteractionPage() {
  const [searchDrug, setSearchDrug] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'normal'>('all')
  const [selectedInteraction, setSelectedInteraction] = useState<DrugGeneInteraction | null>(null)

  const filteredInteractions = DRUG_GENE_DATABASE.filter(interaction => {
    const matchesDrug = interaction.drug.toLowerCase().includes(searchDrug.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || interaction.severity === filterSeverity
    return matchesDrug && matchesSeverity
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Drug-Gene Interaction Database
          </h1>
          <p className="text-lg text-slate-600">
            Comprehensive pharmacogenomic interaction reference with clinical recommendations
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-base font-medium">Search Drug</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                id="search"
                placeholder="e.g., Warfarin, Clopidogrel, Tacrolimus..."
                value={searchDrug}
                onChange={(e) => setSearchDrug(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity-filter" className="text-base font-medium">Filter by Severity</Label>
            <Select value={filterSeverity} onValueChange={(value: any) => setFilterSeverity(value)}>
              <SelectTrigger className="h-11" id="severity-filter">
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="warning">Warning Only</SelectItem>
                <SelectItem value="normal">Normal Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 text-sm text-slate-600">
          Found <span className="font-semibold text-slate-900">{filteredInteractions.length}</span> interaction(s)
        </div>

        {/* Interactions Grid */}
        <div className="space-y-4">
          {filteredInteractions.length > 0 ? (
            filteredInteractions.map((interaction, index) => (
              <Card
                key={index}
                className={cn(
                  'border-0 shadow-md cursor-pointer transition-all hover:shadow-lg',
                  selectedInteraction === interaction && 'ring-2 ring-blue-500'
                )}
                onClick={() => setSelectedInteraction(selectedInteraction === interaction ? null : interaction)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-semibold text-slate-900">{interaction.drug}</h3>
                        <Badge className="text-sm font-medium">{interaction.gene}</Badge>
                        <Badge
                          className={cn(
                            'font-semibold',
                            interaction.severity === 'critical' && 'bg-red-100 text-red-800',
                            interaction.severity === 'warning' && 'bg-orange-100 text-orange-800',
                            interaction.severity === 'normal' && 'bg-blue-100 text-blue-800',
                          )}
                        >
                          {interaction.severity.charAt(0).toUpperCase() + interaction.severity.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">Phenotype: <span className="font-medium text-slate-900">{interaction.phenotype}</span></p>
                    </div>
                    <Zap className={cn(
                      'h-5 w-5 flex-shrink-0',
                      interaction.severity === 'critical' && 'text-red-600',
                      interaction.severity === 'warning' && 'text-orange-600',
                      interaction.severity === 'normal' && 'text-blue-600',
                    )} />
                  </div>
                </CardHeader>

                {/* Expanded Details */}
                {selectedInteraction === interaction && (
                  <CardContent className="space-y-4 border-t border-slate-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Clinical Recommendation</p>
                        <p className="text-slate-900">{interaction.recommendation}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Dosage Adjustment</p>
                        <p className="text-slate-900 font-medium">{interaction.dosageAdjustment}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Evidence Level</p>
                      <Badge variant="outline" className="text-slate-700">{interaction.evidence}</Badge>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Alert className="border-slate-200">
              <AlertCircle className="h-4 w-4 text-slate-600" />
              <AlertDescription className="text-slate-600">
                No interactions found. Try adjusting your search filters.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Information Box */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">About Pharmacogenomics</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-900 space-y-3">
            <p>
              Pharmacogenomics studies how genes affect medication response. Genetic variations can influence how your body absorbs, processes, or responds to medications.
            </p>
            <p>
              This database contains evidence-based drug-gene interactions. Always consult with a healthcare provider before making medication decisions based on genetic information.
            </p>
            <p className="text-sm">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
