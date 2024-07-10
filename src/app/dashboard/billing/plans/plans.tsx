import { syncPlans } from "@/app/actions"
import db from "@/lib/supabase/db"
import { NewPlan, plans } from "@/lib/supabase/schema"
import { Plan } from "./plan"

export async function Plans() {
    let allPlans: NewPlan[] = await db.select().from(plans)
  
    // If there are no plans in the database, sync them from Lemon Squeezy.
    // You might want to add logic to sync plans periodically or a webhook handler.
    if (!allPlans.length) {
      allPlans = await syncPlans()
    }
  
    if (!allPlans.length) {
      return <p>No plans available.</p>
    }
  
    return (
      <div>
        <h2>Plans</h2>
  
        <div className="mb-5 mt-3 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
          {allPlans.map((plan, index) => {
            return <Plan key={`plan-${index}`} plan={plan} />
          })}
        </div>
      </div>
    )
  }