import { redirect } from 'next/navigation'

import  createSupabaseServerClient  from '@/lib/supabase/server'

export default async function PrivatePage() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/signup')
  }

  return <p>Hello {data.user.email}</p>
}