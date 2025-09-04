import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  
  // Additional security checks
  const url = request.nextUrl
  
  // Protect admin routes
  if (url.pathname.startsWith('/admin')) {
    // This will be handled by the admin page component itself
    // but we can add additional middleware-level checks here
  }
  
  // Protect poll edit routes
  if (url.pathname.match(/\/polls\/[^\/]+\/edit/)) {
    // Ownership verification will be handled in the page component
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}