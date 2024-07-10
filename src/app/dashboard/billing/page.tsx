import { Suspense } from 'react'
import { Plans } from '@/app/dashboard/billing/plans/plans'

export const dynamic = 'force-dynamic'

export default function BillingPage() {
  return (
    <div>
      <Suspense fallback={<p>Loading plans...</p>}>
        <Plans />
      </Suspense>
    </div>
  )
}