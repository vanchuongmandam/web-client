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
  interface Account {
    backendToken?: string
    backendUser?: { _id: string; username: string; role: string }
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

interface GoogleAuthResponse {
  data?: {
    token?: string
    user?: { _id: string; username: string; role: string }
    needsLinking?: boolean
  }
  message?: string
}

interface TokenShape {
  backendToken?: string
  backendTokenExpires?: number
  user?: { _id: string; username: string; role: string }
  error?: string
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
    async signIn({ account }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: account.id_token })
          })

          const data: GoogleAuthResponse = await res.json()

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
          if (account && data.data?.token && data.data?.user) {
            account.backendToken = data.data.token
            account.backendUser = data.data.user
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
      // Initial sign in
      if (account?.backendToken && account?.backendUser) {
        const decoded = jwtDecode<{ exp: number }>(account.backendToken)
        return {
          ...token,
          backendToken: account.backendToken,
          backendTokenExpires: decoded.exp * 1000,
          user: account.backendUser
        }
      }

      const t = token as unknown as TokenShape

      // Return previous token if the backend token has not expired yet
      // Refresh token if it's going to expire in the next 1 hour
      if (t.backendTokenExpires && Date.now() < t.backendTokenExpires - 60 * 60 * 1000) {
        return token
      }

      // TODO: Implement refresh token logic if needed.
      // For now, if expired, we'll let it expire and client will handle logout.
      if (t.backendTokenExpires && Date.now() >= t.backendTokenExpires) {
        return { ...token, error: "RefreshAccessTokenError" }
      }

      return token
    },
    async session({ session, token }) {
      const t = token as unknown as TokenShape
      session.backendToken = t.backendToken ?? ''
      session.user = {
        ...session.user,
        ...(t.user ?? {}),
      } as typeof session.user
      session.error = t.error
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', // Error code passed in query string as ?error=
  }
})
