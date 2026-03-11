"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    async function initAuth() {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, tenants(slug)")
          .eq("id", session.user.id)
          .single()

        if (profile) {
          setProfile({
            ...profile,
            tenant_slug: (profile as any).tenants?.slug
          })
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, tenants(slug)")
          .eq("id", session.user.id)
          .single()

        if (profile) {
          setProfile({
            ...profile,
            tenant_slug: (profile as any).tenants?.slug
          })
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
