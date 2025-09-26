"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { SignInForm } from "@/components/auth/signin-form"
import { Button } from "@/components/ui/button"
import { Film } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSignUp, setShowSignUp] = useState(false)

  const message = searchParams.get('message')

  if (showSignUp) {
    router.push('/auth/signup')
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <Film className="h-8 w-8" />
            <span className="text-2xl font-bold">MovieTracker</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {message}
          </div>
        )}

        <SignInForm />

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => setShowSignUp(true)}
            >
              Sign up
            </Button>
          </p>
          <div className="text-xs text-muted-foreground">
            <Link href="/forgot-password" className="hover:underline">
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}