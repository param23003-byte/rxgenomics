import { PgxDashboard } from '@/components/dashboard/pgx-dashboard'

export const metadata = {
  title: 'rxgenomics - Pharmacogenomic Risk Assessment',
  description: 'Clinical Decision Support Engine for pharmacogenomic risk assessment',
}

export default function PgxCheckPage() {
  return <PgxDashboard />
}
