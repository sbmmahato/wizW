import { Suspense } from 'react'
import { Plans } from '@/components/dashboard/billing/plans/plans'

export const dynamic = 'force-dynamic'

export default function BillingPage() {
  return (
    <div>
      {/* <Suspense fallback={<p>Loading plans...</p>}> */}
        <Plans />
      {/* </Suspense> */}
    </div>
  )
}

// import { Suspense } from "react";
// import { Plans } from "@/components/dashboard/billing/plans/plans";
// import { Subscriptions } from "@/components/dashboard/billing/subscription/subscriptions";
// import { DashboardContent } from "@/app/dashboard/content";
// import { PageTitleAction } from "@/app/dashboard/page-title-action";
// import { PlansSkeleton } from "@/components/dashboard/skeletons/plans";
// import { CardSkeleton } from "@/components/dashboard/skeletons/card";

// export const dynamic = "force-dynamic";

// export default function BillingPage() {
//   return (
//     <DashboardContent
//       title="Billing"
//       subtitle="View and manage your billing information."
//       action={<PageTitleAction />}
//     >
//       <div>
//         <Suspense fallback={<p>Loading plans...</p>}>
//           {/* <Subscriptions /> */}
//         </Suspense>

//         {/* <Suspense fallback={<p>Loading plans...</p>}>
//           <Plans />
//         </Suspense> */}
//       </div>
//     </DashboardContent>
//   );
// }