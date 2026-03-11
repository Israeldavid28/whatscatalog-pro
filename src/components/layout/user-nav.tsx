"use client"

import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"

export function UserNav() {
  const router = useRouter()
  const { profile, logout } = useAuthStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push("/login")
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium">{profile?.full_name || "Usuario"}</span>
        <span className="text-xs text-muted-foreground">{(profile as any)?.email}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar Sesión">
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  )
}
