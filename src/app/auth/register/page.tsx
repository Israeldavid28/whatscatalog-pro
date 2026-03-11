"use client"

import { Suspense } from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Store, Lock, Mail, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // Form State
  const [email, setEmail] = useState(searchParams.get('email') || "")
  const [password, setPassword] = useState("")
  const [storeName, setStoreName] = useState("")
  const [storeSlug, setStoreSlug] = useState("")

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
       setStep(2)
       return
    }

    try {
      setLoading(true)
      
      // 1. Sign Up User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("No user data returned")

      // 2. Create Tenant
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
           name: storeName,
           slug: storeSlug.toLowerCase().replace(/\s+/g, '-'),
           settings: {
              primary_color: "#3B82F6",
              currency: "$",
              whatsapp_number: ""
           }
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      // 3. Update Profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
           role: 'owner',
           tenant_id: tenant.id,
           full_name: storeName
        })
        .eq("id", authData.user.id)

      if (profileError) throw profileError

      // 4. Redirect to login or admin
      alert("¡Cuenta creada con éxito! Por favor verifica tu correo.")
      router.push("/login")
      
    } catch (error: any) {
      console.error("Register error:", error)
      alert(error.message || "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Crea tu Catálogo</h1>
            <p className="text-muted-foreground">Paso {step} de 2: {step === 1 ? 'Cuenta' : 'Tu Tienda'}</p>
         </div>

         <form onSubmit={handleRegister} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="email" type="email" placeholder="nombre@ejemplo.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                 </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="s_name">Nombre de tu Tienda</Label>
                    <div className="relative">
                       <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                       <Input id="s_name" placeholder="Ej: Mi Boutique Online" className="pl-10" value={storeName} onChange={(e) => {
                          setStoreName(e.target.value)
                          if (!storeSlug) setStoreSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                       }} required />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="s_slug">URL de tu catálogo</Label>
                    <div className="flex items-center gap-1">
                       <span className="text-sm text-muted-foreground">whatscatalog.pro/</span>
                       <Input id="s_slug" placeholder="mi-tienda" value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} required />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Esta será la dirección que compartirás con tus clientes.</p>
                 </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 gap-2" disabled={loading}>
               {loading ? (
                 <Loader2 className="animate-spin h-5 w-5" />
               ) : (
                 <>
                   {step === 1 ? 'Continuar' : 'Crear mi Catálogo'} <ArrowRight className="h-5 w-5" />
                 </>
               )}
            </Button>
         </form>

         <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta? <a href="/login" className="text-primary font-semibold">Inicia Sesión</a>
         </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
