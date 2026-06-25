'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Shield, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { queryPgxRisk, type PgxQueryInput, type PgxAlertData } from '@/lib/pgx-actions'

const DRUG_OPTIONS = [
  'Clopidogrel',
  'Omeprazole',
  'Lansoprazole',
  'Codeine',
  'Tramadol',
  'Tamoxifen',
  'Nortriptyline',
  'Paroxetine',
  'Tacrolimus',
  'Clozapine',
]

const GENOTYPE_OPTIONS = [
  'Unknown',
  'Poor Metabolizer',
  'Ultra-Rapid Metabolizer',
  'CYP3A5 Expresser',
]

const ANCESTRY_OPTIONS = [
  'East Asian',
  'European',
  'African American',
  'East African',
  'Global',
]

const EVIDENCE_LEVEL_COLORS: Record<string, string> = {
  'Level A - FDA Boxed Warning': 'bg-red-100 text-red-800',
  'Level A - FDA Alert': 'bg-red-100 text-red-800',
  'Level A': 'bg-red-100 text-red-800',
  'Level B': 'bg-yellow-100 text-yellow-800',
  'Level C': 'bg-blue-100 text-blue-800',
}

interface PgxResult {
  success: boolean
  matchCount: number
  data: PgxAlertData[]
}

export function PgxDashboard() {
  const [drugName, setDrugName] = useState<string>('')
  const [genotype, setGenotype] = useState<string>('')
  const [ancestry, setAncestry] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PgxResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showAncestryField = genotype === 'Unknown'

  const handleSubmit = async () => {
    setError(null)
    setResult(null)

    if (!drugName || !genotype) {
      setError('Please select both a drug and a genotype.')
      return
    }

    if (showAncestryField && !ancestry) {
      setError('Please select an ancestry/ethnicity.')
      return
    }

    setLoading(true)

    try {
      const input: PgxQueryInput = {
        drugName,
        genotype,
        ...(genotype === 'Unknown' && { ancestry }),
      }

      const response = await queryPgxRisk(input)
      setResult(response)
    } catch (err) {
      setError('An error occurred while processing your request. Please try again.')
      console.error('[PGX Dashboard Error]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">rxgenomics</h1>
          </div>
          <p className="text-xl text-muted-foreground">Clinical Decision Support Engine</p>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Pharmacogenomic Risk Assessment
            </CardTitle>
            <CardDescription>
              Enter patient genotype and medication to identify potential pharmacogenomic interactions
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Drug Name Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Drug Name</label>
              <Select value={drugName} onValueChange={setDrugName}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a drug..." />
                </SelectTrigger>
                <SelectContent>
                  {DRUG_OPTIONS.map((drug) => (
                    <SelectItem key={drug} value={drug}>
                      {drug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Genotype Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Patient Genotype</label>
              <Select value={genotype} onValueChange={setGenotype}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a genotype..." />
                </SelectTrigger>
                <SelectContent>
                  {GENOTYPE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ancestry/Ethnicity Select (Conditional) */}
            {showAncestryField && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-foreground">Patient Ancestry/Ethnicity</label>
                <Select value={ancestry} onValueChange={setAncestry}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select ancestry/ethnicity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ANCESTRY_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Pharmacogenomic Check...
                </>
              ) : (
                'Run Pharmacogenomic Check'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Display */}
        {result && (
          <>
            {result.matchCount > 0 ? (
              // High-Priority Warning Alert
              <div className="space-y-4">
                <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="text-lg font-semibold">
                    Pharmacogenomic Alert Detected
                  </AlertTitle>
                  <AlertDescription className="mt-2 text-sm">
                    High-risk interaction identified for {drugName} in {genotype} patients
                  </AlertDescription>
                </Alert>

                {/* Alert Details Cards */}
                {result.data.map((alert, index) => (
                  <Card key={index} className="border-destructive/30 bg-card">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Adverse Effect */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">Adverse Effect</h4>
                          <p className="text-sm text-muted-foreground">{alert.adverse_effect}</p>
                        </div>

                        <Separator />

                        {/* Clinical Mechanism */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Mechanism
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {alert.clinical_mechanism}
                          </p>
                        </div>

                        <Separator />

                        {/* Recommended Action */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">Recommended Action</h4>
                          <p className="text-sm text-muted-foreground">
                            {alert.alternative_therapy}
                          </p>
                        </div>

                        {/* Evidence Level Badge */}
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Evidence:
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs font-semibold ${
                              EVIDENCE_LEVEL_COLORS[alert.evidence_level] ||
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {alert.evidence_level}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Success/Safe Alert
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <AlertTitle className="text-lg font-semibold text-emerald-900">
                  Standard Dosing Approved
                </AlertTitle>
                <AlertDescription className="mt-2 text-sm text-emerald-800">
                  No high-risk pharmacogenomic flags detected in the database for this profile.
                  Proceed with standard clinical protocols.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </div>
  )
}
