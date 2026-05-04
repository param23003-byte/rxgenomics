'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Download, Eye, Trash2, FileText, Calendar, User } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface ClinicalReport {
  id: string
  patientName: string
  mrn: string
  date: string
  assessmentType: 'Naranjo' | 'PGx' | 'Complete'
  status: 'completed' | 'pending' | 'archived'
  naranjoScore?: number
  causality?: string
  pgxAlerts?: number
  recommendation: string
}

const MOCK_REPORTS: ClinicalReport[] = [
  {
    id: '1',
    patientName: 'John Smith',
    mrn: 'MRN-2024001',
    date: '2024-05-03',
    assessmentType: 'Complete',
    status: 'completed',
    naranjoScore: 8,
    causality: 'Probable',
    pgxAlerts: 2,
    recommendation: 'Clopidogrel conversion recommended due to CYP2C19 variant',
  },
  {
    id: '2',
    patientName: 'Sarah Johnson',
    mrn: 'MRN-2024002',
    date: '2024-05-02',
    assessmentType: 'Naranjo',
    status: 'completed',
    naranjoScore: 4,
    causality: 'Possible',
    pgxAlerts: 0,
    recommendation: 'Further investigation recommended',
  },
  {
    id: '3',
    patientName: 'Michael Chen',
    mrn: 'MRN-2024003',
    date: '2024-05-01',
    assessmentType: 'PGx',
    status: 'completed',
    pgxAlerts: 3,
    recommendation: 'Multiple drug-gene interactions detected. Pharmacist review suggested.',
  },
  {
    id: '4',
    patientName: 'Emma Wilson',
    mrn: 'MRN-2024004',
    date: '2024-04-30',
    assessmentType: 'Complete',
    status: 'completed',
    naranjoScore: 2,
    causality: 'Possible',
    pgxAlerts: 1,
    recommendation: 'Low probability of drug-reaction relationship',
  },
  {
    id: '5',
    patientName: 'Robert Brown',
    mrn: 'MRN-2024005',
    date: '2024-04-29',
    assessmentType: 'Naranjo',
    status: 'pending',
    recommendation: 'Assessment in progress',
  },
]

export default function ClinicalReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'archived'>('all')
  const [filterType, setFilterType] = useState<'all' | 'Naranjo' | 'PGx' | 'Complete'>('all')
  const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null)
  const [reports, setReports] = useState<ClinicalReport[]>(MOCK_REPORTS)

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.mrn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus
    const matchesType = filterType === 'all' || report.assessmentType === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const handleDeleteReport = (id: string) => {
    setReports(reports.filter(report => report.id !== id))
    if (selectedReport?.id === id) {
      setSelectedReport(null)
    }
  }

  const handleDownloadReport = (report: ClinicalReport) => {
    const element = document.getElementById(`report-${report.id}`)
    if (!element) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>${report.patientName} - Clinical Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #2563eb; margin-bottom: 20px; padding-bottom: 10px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            td { padding: 8px; border: 1px solid #e5e7eb; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .completed { background-color: #d1fae5; color: #065f46; }
            .pending { background-color: #fed7aa; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Clinical Assessment Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <p><span class="label">Patient Name:</span> ${report.patientName}</p>
            <p><span class="label">MRN:</span> ${report.mrn}</p>
            <p><span class="label">Assessment Date:</span> ${report.date}</p>
            <p><span class="label">Assessment Type:</span> ${report.assessmentType}</p>
            <p><span class="label">Status:</span> <span class="badge ${report.status}">${report.status.toUpperCase()}</span></p>
          </div>

          <div class="section">
            <h3>Assessment Results</h3>
            ${report.naranjoScore !== undefined ? `<p><span class="label">Naranjo Score:</span> ${report.naranjoScore}/13</p>` : ''}
            ${report.causality ? `<p><span class="label">Causality Assessment:</span> ${report.causality}</p>` : ''}
            ${report.pgxAlerts !== undefined ? `<p><span class="label">PGx Alerts:</span> ${report.pgxAlerts}</p>` : ''}
          </div>

          <div class="section">
            <h3>Clinical Recommendation</h3>
            <p>${report.recommendation}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const statusColors = {
    completed: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
    archived: 'bg-slate-100 text-slate-800',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Clinical Reports
          </h1>
          <p className="text-lg text-slate-600">
            View, manage, and download clinical assessment reports
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-base font-medium">Search Reports</Label>
            <Input
              id="search"
              placeholder="Search by patient name or MRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-base font-medium">Status</Label>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="h-11" id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type-filter" className="text-base font-medium">Assessment Type</Label>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="h-11" id="type-filter">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Naranjo">Naranjo</SelectItem>
                <SelectItem value="PGx">PGx</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{filteredReports.length}</span> of <span className="font-semibold text-slate-900">{reports.length}</span> report(s)
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <Card 
                key={report.id}
                className={cn(
                  'border-0 shadow-md transition-all hover:shadow-lg cursor-pointer',
                  selectedReport?.id === report.id && 'ring-2 ring-blue-500'
                )}
                onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          {report.patientName}
                        </h3>
                        <Badge variant="outline">{report.mrn}</Badge>
                        <Badge className={cn('font-semibold', statusColors[report.status])}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {report.date}
                        <span className="mx-2">•</span>
                        <Badge variant="outline" className="text-slate-700">
                          {report.assessmentType}
                        </Badge>
                      </div>
                    </div>
                    {report.status === 'completed' && (
                      <FileText className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {/* Expanded Details */}
                {selectedReport?.id === report.id && (
                  <CardContent className="border-t border-slate-200 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.naranjoScore !== undefined && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 mb-1">Naranjo Score</p>
                          <p className="text-3xl font-bold text-blue-600">{report.naranjoScore}/13</p>
                          {report.causality && (
                            <p className="text-sm text-slate-600 mt-2">Causality: <span className="font-semibold">{report.causality}</span></p>
                          )}
                        </div>
                      )}
                      {report.pgxAlerts !== undefined && (
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 mb-1">PGx Alerts</p>
                          <p className="text-3xl font-bold text-amber-600">{report.pgxAlerts}</p>
                          <p className="text-sm text-slate-600 mt-2">Drug-gene interactions found</p>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-slate-600 mb-2">Clinical Recommendation</p>
                      <p className="text-slate-900">{report.recommendation}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleDownloadReport(report)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Alert className="border-slate-200">
              <AlertCircle className="h-4 w-4 text-slate-600" />
              <AlertDescription className="text-slate-600">
                No reports found. Try adjusting your search filters.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Information Box */}
        <Card className="mt-8 bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Report Management</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-2">
            <p>• Click on a report to view detailed assessment results</p>
            <p>• Download reports as PDF for electronic medical records</p>
            <p>• Archive or delete reports as needed for your workflow</p>
            <p>• All reports are confidential and stored securely</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
