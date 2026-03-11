"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { MetodoPagoConfig, MetodoPagoTipo } from "@/types/database"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function MetodosPagoList() {
  const [configs, setConfigs] = useState<any[]>([])
  const [types, setTypes] = useState<MetodoPagoTipo[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const { profile } = useAuthStore()

  // Form State
  const [selectedType, setSelectedType] = useState("")
  const [customName, setCustomName] = useState("")
  const [bankData, setBankData] = useState("")
  const [instructions, setInstructions] = useState("")

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchData()
    }
  }, [profile?.tenant_id])

  async function fetchData() {
    try {
      setLoading(true)
      const [configsRes, typesRes] = await Promise.all([
        supabase
          .from("metodos_pago_config")
          .select("*, metodos_pago_tipo(nombre)")
          .eq("tenant_id", profile?.tenant_id)
          .order("orden"),
        supabase
          .from("metodos_pago_tipo")
          .select("*")
          .order("nombre")
      ])

      setConfigs(configsRes.data || [])
      setTypes(typesRes.data || [])
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!selectedType || !customName) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("metodos_pago_config")
        .insert({
          tenant_id: profile?.tenant_id,
          tipo_id: selectedType,
          nombre_personalizado: customName,
          datos_bancarios: { value: bankData },
          instrucciones: instructions,
          activo: true
        })

      if (error) throw error
      setOpen(false)
      setSelectedType("")
      setCustomName("")
      setBankData("")
      setInstructions("")
      fetchData()
    } catch (error) {
      console.error("Error adding payment method:", error)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const { error } = await supabase
        .from("metodos_pago_config")
        .update({ activo: !current })
        .eq("id", id)
      
      if (error) throw error
      setConfigs(configs.map(c => c.id === id ? { ...c, activo: !current } : c))
    } catch (error) {
       console.error("Error toggling active:", error)
    }
  }

  async function handleDelete(id: string) {
    try {
      if (!confirm("¿Seguro que deseas eliminar este método de pago?")) return
      const { error } = await supabase
        .from("metodos_pago_config")
        .delete()
        .eq("id", id)

      if (error) throw error
      setConfigs(configs.filter(c => c.id !== id))
    } catch (error) {
      console.error("Error deleting payment method:", error)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Agregar Método
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Método de Pago</DialogTitle>
              <DialogDescription>
                Configura una opción de pago para tus clientes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tipo de Método</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nombre Personalizado</Label>
                <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ej: Pago Móvil BDV" />
              </div>
              <div className="grid gap-2">
                <Label>Datos de Pago</Label>
                <Textarea value={bankData} onChange={(e) => setBankData(e.target.value)} placeholder="Ej: CI: 12.345.678, Tel: 04120000000, Banco de Venezuela" />
              </div>
              <div className="grid gap-2">
                <Label>Instrucciones Adicionales</Label>
                <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ej: Enviar comprobante al WhatsApp." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.nombre_personalizado}</TableCell>
              <TableCell className="capitalize">{c.metodos_pago_tipo?.nombre}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch checked={c.activo} onCheckedChange={() => toggleActive(c.id, c.activo)} />
                  {c.activo ? <Badge>Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon"><Settings2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {configs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No tienes métodos de pago configurados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
