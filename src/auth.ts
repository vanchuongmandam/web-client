import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import { jwtDecode } from "jwt-decode"

declare module "next-auth" {
  interface Session {
    user: {
      _id: string
      username: string
      role: string
    } & DefaultSession["user"]
    backendToken: string
    error?: string
  }
}
import { type JWT } from "@auth/core/jwt"

declare module "@auth/core/jwt" {
  interface JWT {
    backendToken: string
    backendTokenExpires: number
    user: {
      _id: string
      username: string
      role: string
    }
    error?: string
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: account.id_token })
          })

          const data = await res.json()
          
          if (!res.ok) {
            console.error("Backend Google Auth Error:", data)
            // Redirect to link-account if email exists
            if (data.message === "This email is already registered. Please enter your password to link your Google account.") {
              return `/link-account?idToken=${account.id_token}`
            }
            return false
          }

          if (data.data?.needsLinking) {
            return `/link-account?idToken=${account.id_token}`
          }

          // Store backend data in the account object temporarily so jwt callback can access it
          const anyAccount = account as any
          if (anyAccount) {
            anyAccount.backendToken = data.data.token
            anyAccount.backendUser = data.data.user
          }
          return true
        } catch (error) {
          console.error("Google signIn callback error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, account }) {
      const anyAccount = account as any
      const anyToken = token as any
      // Initial sign in
      if (anyAccount && anyAccount.backendToken && anyAccount.backendUser) {
        const decoded = jwtDecode<{ exp: number }>(anyAccount.backendToken as string)
        return {
          ...token,
          backendToken: anyAccount.backendToken as string,
          backendTokenExpires: decoded.exp * 1000,
          user: anyAccount.backendUser as any
        }
      }

      // Return previous token if the backend token has not expired yet
      // Refresh token if it's going to expire in the next 1 hour
      if (anyToken.backendTokenExpires && Date.now() < anyToken.backendTokenExpires - 60 * 60 * 1000) {
        return token
      }

      // TODO: Implement refresh token logic if needed. 
      // For now, if expired, we'll let it expire and client will handle logout.
      if (anyToken.backendTokenExpires && Date.now() >= anyToken.backendTokenExpires) {
        return { ...token, error: "RefreshAccessTokenError" }
      }

      return token
    },
    async session({ session, token }) {
      const anyToken = token as any
      session.backendToken = anyToken.backendToken
      session.user = {
        ...session.user,
        ...anyToken.user
      }
      session.error = anyToken.error
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', // Error code passed in query string as ?error=
  }
})
