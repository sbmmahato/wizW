import { NewPlan } from "@/lib/supabase/schema"

export function Plan({ plan }: { plan: NewPlan }) {
    const { description, productName, name, price } = plan
  
    return (
      <div>
        <h2>
          {productName} ({name})
        </h2>
  
        {description ? (
          <div
            dangerouslySetInnerHTML={{
              // Ideally sanitize the description first.
              __html: description,
            }}
          ></div>
        ) : null}
  
        <p>${price}</p>
      </div>
    )
  }