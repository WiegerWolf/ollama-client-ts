"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGuestSignIn = async () => {
    setIsLoading(true)
    try {
      // For now, we'll create a simple guest session
      // In a real app, you'd implement proper authentication
      const result = await signIn("credentials", {
        email: "guest@example.com",
        password: "guest",
        redirect: false,
      })

      if (result?.ok) {
        router.push("/")
      }
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Ollama Chat
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            A modern web interface for chatting with Ollama models
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGuestSignIn}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Signing in..." : "Continue as Guest"}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This is a demo version. In production, you would implement proper authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}