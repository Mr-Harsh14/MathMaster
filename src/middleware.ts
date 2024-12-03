import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Only allow authenticated users to access /dashboard routes
      const path = req.nextUrl.pathname
      if (path.startsWith("/dashboard")) {
        return !!token
      }
      return true
    },
  },
})

export const config = {
  matcher: ["/dashboard/:path*"]
} 