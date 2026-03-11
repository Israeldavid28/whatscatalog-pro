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

  if (success) {
    return (
      <Card className="w-full max-w-md">
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Crea tu Cuenta</CardTitle>
        <CardDescription>
          Empieza a vender por WhatsApp en minutos. No requiere tarjeta de crédito.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Registrando..." : "Crear Catálogo Gratis"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
