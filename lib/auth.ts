import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

export async function createServerClient() {
  const cookieStore = cookies()

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// export async function getCurrentUser() {
//   const supabase = await createServerClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()
//   return user
// }

export async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get('sb-access-token')?.value ||
                request.cookies.get('supabase-auth-token')?.value
  
  if (!token) {
    return null
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token)
  
  if (error) {
    return null
  }
  
  return user
}
