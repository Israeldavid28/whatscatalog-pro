"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Save } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  whatsapp_number: z.string().min(10, "Número de WhatsApp inválido"),
  currency: z.string().min(1, "Selecciona una moneda"),
  timezone: z.string()
})

export default function DatosGeneralesForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { profile } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      whatsapp_number: "",
      currency: "USD",
      timezone: "America/Caracas"
    }
  })

  useEffect(() => {
    if (profile?.tenant_id) {
      loadTenantData()
    }
  }, [profile?.tenant_id])

  async function loadTenantData() {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile?.tenant_id)
        .single()

      if (error) throw error
      
      const settings = data.settings || {}

      form.reset({
        name: data.name,
        description: settings.description || "",
        whatsapp_number: settings.whatsapp_number || "",
        currency: settings.currency || "USD",
        timezone: settings.timezone || "America/Caracas"
      })
    } catch (error) {
      console.error("Error loading tenant:", error)
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setSaving(true)
      const { error } = await supabase
        .from("tenants")
        .update({
          name: values.name,
          settings: {
            description: values.description,
            whatsapp_number: values.whatsapp_number,
            currency: values.currency,
            timezone: values.timezone
          }
        })
        .eq("id", profile?.tenant_id)

      if (error) throw error
      // Show success toast here if needed
    } catch (error) {
      console.error("Error saving tenant:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre del Negocio</Label>
        <Input id="name" {...form.register("name")} placeholder="Tu Tienda Online" />
        {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción Corta (SEO)</Label>
        <Textarea id="description" {...form.register("description")} placeholder="Venta de calzado y accesorios..." />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="whatsapp_number">Número de WhatsApp (Formato Internacional)</Label>
          <Input id="whatsapp_number" {...form.register("whatsapp_number")} placeholder="+584120000000" />
          {form.formState.errors.whatsapp_number && <p className="text-xs text-destructive">{form.formState.errors.whatsapp_number.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="currency">Moneda</Label>
          <Select 
            value={form.watch("currency")} 
            onValueChange={(v) => form.setValue("currency", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">Dólar (USD)</SelectItem>
              <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
              <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
              <SelectItem value="VES">Bolívar (VES)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar Cambios
      </Button>
    </form>
  )
}
