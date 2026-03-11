"use client"

import { useState, useEffect } from "react"
import { Loader2, Palette, Save, Upload } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function PersonalizacionForm() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState("#3B82F6")
  const [secondaryColor, setSecondaryColor] = useState("#10B981")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const { profile } = useAuthStore()

  useEffect(() => {
    if (profile?.tenant_id) {
       loadTenantConfig()
    }
  }, [profile?.tenant_id])

  async function loadTenantConfig() {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", profile?.tenant_id)
        .single()

      if (error) throw error
      
      const settings = data.settings || {}
      setLogoUrl(settings.logo_url || null)
      setPrimaryColor(settings.primary_color || "#3B82F6")
      setSecondaryColor(settings.secondary_color || "#10B981")
    } catch (error) {
      console.error("Error loading config:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile?.tenant_id}/logo.${fileExt}`
      const filePath = `logos/${fileName}`

      // Upload to public bucket
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath)

      setLogoUrl(publicUrl)
    } catch (error) {
      console.error("Error uploading logo:", error)
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const { data: currentTenant } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", profile?.tenant_id)
        .single()

      const updatedSettings = {
        ...(currentTenant?.settings || {}),
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor
      }

      const { error } = await supabase
        .from("tenants")
        .update({ settings: updatedSettings })
        .eq("id", profile?.tenant_id)

      if (error) throw error
    } catch (error) {
      console.error("Error saving customization:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-full w-full rounded-lg object-contain" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground opacity-50" />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo" className="text-lg font-bold">Logo del Negocio</Label>
          <p className="text-sm text-muted-foreground">Sube tu logo para el catálogo. Formato recomendado: cuadrado (PNG, JPG).</p>
          <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} disabled={saving} />
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <span className="font-bold">Colores de Marca</span>
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="primary">Color Primario</Label>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-mono">{primaryColor}</span>
                 <Input id="primary" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-8 w-12 p-1" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="secondary">Color Secundario</Label>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-mono">{secondaryColor}</span>
                 <Input id="secondary" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-8 w-12 p-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <span className="text-sm font-bold uppercase text-muted-foreground">Previsualización</span>
          <div className="space-y-3">
             <div className="h-10 w-full rounded-md shadow-sm" style={{ backgroundColor: primaryColor }}></div>
             <div className="h-8 w-3/4 rounded-md shadow-sm" style={{ backgroundColor: secondaryColor }}></div>
             <div className="flex gap-2">
               <div className="h-6 w-1/4 rounded-md bg-white border"></div>
               <div className="h-6 w-1/4 rounded-md bg-white border"></div>
             </div>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar Configuración Visual
      </Button>
    </div>
  )
}
