"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MainLayout } from "@/components/layout/main-layout"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/signin")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary">
        <div className="text-lg text-primary">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to signin
  }

  return (
    <MainLayout
      header={<Header />}
      sidebar={<Sidebar />}
      chat={<ChatInterface />}
    />
  )
}
