"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"

const registerSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
  businessName: z.string().min(3, { message: "Nombre de negocio muy corto" }),
  whatsapp: z.string().min(8, { message: "Número de WhatsApp inválido" }),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterFormValues) {
    setLoading(true)
    setError(null)

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Create Tenant (simplified for MVP - slack slug from name)
        const slug = data.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .insert({
            nombre_negocio: data.businessName,
            slug: `${slug}-${Math.floor(Math.random() * 1000)}`, // unique-ish
          })
          .select()
          .single()

        if (tenantError) throw tenantError

        // 3. Create Profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            tenant_id: tenantData.id,
            full_name: data.businessName, // Using business name as placeholder for user name
            email: data.email,
          })

        if (profileError) throw profileError

        // 4. Create Initial Config
        const { error: configError } = await supabase
          .from("configuraciones")
          .insert({
            tenant_id: tenantData.id,
            whatsapp_numero: data.whatsapp,
          })

        if (configError) throw configError

        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }
  async function onGoogleLogin() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || "Error al registrarse con Google")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">¡Registro Exitoso!</CardTitle>
          <CardDescription>
            Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor verifica tu cuenta para continuar.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <a href="/login">Ir al Inicio de Sesión</a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Crea tu Cuenta</CardTitle>
        <CardDescription>
          Empieza a vender por WhatsApp en minutos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 gap-4">
          <Button variant="outline" onClick={onGoogleLogin} disabled={loading}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Regístrate con Google
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O completa con email
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre de tu Negocio</Label>
            <Input
              id="businessName"
              placeholder="Ej: Ferretería Central"
              {...register("businessName")}
            />
            {errors.businessName && (
              <p className="text-xs text-destructive">{errors.businessName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Comercial</Label>
            <Input
              id="whatsapp"
              placeholder="Ej: +584121234567"
              {...register("whatsapp")}
            />
            {errors.whatsapp && (
              <p className="text-xs text-destructive">{errors.whatsapp.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive font-medium">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Registrando..." : "Crear Catálogo Gratis"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
