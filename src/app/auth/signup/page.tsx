"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SignUpForm } from "@/components/auth/signup-form"
import { Button } from "@/components/ui/button"
import { Film } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const [showSignIn, setShowSignIn] = useState(false)

  if (showSignIn) {
    router.push('/auth/signin')
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-2">
            Join MovieTracker to start tracking your favorite movies
          </p>
        </div>

        <SignUpForm />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => setShowSignIn(true)}
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}