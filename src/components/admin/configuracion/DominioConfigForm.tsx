"use client"

import { useState, useEffect } from "react"
import { Globe, RefreshCw, CheckCircle, AlertCircle, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"

export default function DominioConfigForm() {
  const { profile } = useAuthStore()
  const [tenant, setTenant] = useState<any>(null)
  const [domain, setDomain] = useState("")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchTenant()
    }
  }, [profile?.tenant_id])

  async function fetchTenant() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", profile!.tenant_id)
        .single()
      
      setTenant(data)
      setDomain(data.custom_domain || "")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveDomain() {
    if (!domain) return
    setSaving(true)
    try {
      // Generate unique token if not exists
      const token = tenant.domain_verification_token || `wcp_${Math.random().toString(36).substring(2, 12)}`
      
      const { error } = await supabase
        .from("tenants")
        .update({ 
          custom_domain: domain,
          domain_verification_token: token,
          domain_verified: false 
        })
        .eq("id", profile!.tenant_id)

      if (error) throw error
      
      await fetchTenant()
      alert("Dominio guardado. Ahora debes verificarlo.")
    } catch (err) {
      console.error(err)
      alert("Error al guardar el dominio. Verifica que no esté en uso.")
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify() {
    setVerifying(true)
    try {
      const res = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: tenant.custom_domain })
      })
      const data = await res.json()
      
      if (data.success) {
        alert("¡Dominio verificado con éxito!")
        fetchTenant()
      } else {
        alert(data.message || "No se pudo verificar el dominio.")
      }
    } catch (err) {
      console.error(err)
      alert("Error en la conexión al verificar.")
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" />Cargando configuración...</div>

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="domain">Dominio Personalizado</Label>
          <div className="flex gap-2">
            <Input 
              id="domain" 
              placeholder="catalogo.tuempresa.com" 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={tenant?.domain_verified}
            />
            {!tenant?.domain_verified && (
              <Button onClick={handleSaveDomain} disabled={saving || !domain}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            )}
            {tenant?.domain_verified && (
              <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={() => {
                if(confirm("¿Seguro que quieres cambiar el dominio? Se perderá la verificación.")) {
                   supabase.from("tenants").update({ custom_domain: null, domain_verified: false }).eq("id", tenant.id).then(() => fetchTenant())
                }
              }}>
                Cambiar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Ingresa el subdominio o dominio donde quieres que tus clientes vean el catálogo.
          </p>
        </div>

        {tenant?.custom_domain && !tenant?.domain_verified && (
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Verificación pendiente</AlertTitle>
            <AlertDescription className="text-amber-700 space-y-4">
              <p>Para activar tu dominio, debes configurar el siguiente registro DNS en tu proveedor (Cloudflare, GoDaddy, etc):</p>
              
              <div className="bg-white p-3 rounded border font-mono text-xs gap-2 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-bold">TXT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nombre (Host):</span>
                  <span className="font-bold">_whatscatalog.{tenant.custom_domain}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold flex items-center gap-2">
                    {tenant.domain_verification_token}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(tenant.domain_verification_token)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleVerify} disabled={verifying} className="w-full">
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Verificar ahora
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {tenant?.domain_verified && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Dominio Activo</AlertTitle>
            <AlertDescription className="text-green-700">
              Tu catálogo ya es accesible desde: <a href={`https://${tenant.custom_domain}`} target="_blank" className="font-bold underline">{tenant.custom_domain}</a>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium text-sm mb-2">Instrucciones de Redirección</h4>
        <p className="text-sm text-muted-foreground">
          Además del registro TXT, asegúrate de añadir un registro <strong>CNAME</strong> que apunte a <code>whatscatalog.pro</code> (o la URL de nuestra plataforma) para que el tráfico llegue correctamente.
        </p>
      </div>
    </div>
  )
}
