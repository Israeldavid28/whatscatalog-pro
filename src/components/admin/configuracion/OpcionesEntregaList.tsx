"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Settings2, Trash2, Truck, Home } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
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

export default function OpcionesEntregaList() {
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const { profile } = useAuthStore()

  // Form State
  const [type, setType] = useState<"delivery" | "pickup">("delivery")
  const [name, setName] = useState("")
  const [cost, setCost] = useState("0")
  const [estimate, setEstimate] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (profile?.tenant_id) {
       fetchData()
    }
  }, [profile?.tenant_id])

  async function fetchData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("opciones_entrega")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .order("orden")

      setOptions(data || [])
    } catch (error) {
      console.error("Error fetching delivery options:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!name) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from("opciones_entrega")
        .insert({
          tenant_id: profile?.tenant_id,
          tipo: type,
          nombre: name,
          costo: parseFloat(cost),
          tiempo_estimado: estimate,
          descripcion: description,
          activo: true
        })

      if (error) throw error
      setOpen(false)
      setName("")
      setCost("0")
      setEstimate("")
      setDescription("")
      fetchData()
    } catch (error) {
       console.error("Error adding delivery option:", error)
    } finally {
       setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
       const { error } = await supabase
        .from("opciones_entrega")
        .update({ activo: !current })
        .eq("id", id)

       if (error) throw error
       setOptions(options.map(o => o.id === id ? { ...o, activo: !current } : o))
    } catch (error) {
       console.error("Error toggling active:", error)
    }
  }

  async function handleDelete(id: string) {
    try {
      if (!confirm("¿Seguro que deseas eliminar esta opción?")) return
      const { error } = await supabase
        .from("opciones_entrega")
        .delete()
        .eq("id", id)

      if (error) throw error
      setOptions(options.filter(o => o.id !== id))
    } catch (error) {
      console.error("Error deleting delivery option:", error)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
               <Plus className="h-4 w-4" /> Agregar Opción
            </Button>
          </DialogTrigger>
          <DialogContent>
             <DialogHeader>
                <DialogTitle>Nueva Opción de Entrega</DialogTitle>
                <DialogDescription>Configura cómo entregarás tus pedidos.</DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                   <Label>Tipo</Label>
                   <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger>
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="delivery">🚗 Delivery</SelectItem>
                         <SelectItem value="pickup">🏠 Pick-up / Retiro en tienda</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="grid gap-2">
                   <Label>Nombre</Label>
                   <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Zona Este Caracas o Tienda Palos Grandes" />
                </div>
                <div className="grid gap-2">
                   <Label>Costo (0 si es gratis o pickup)</Label>
                   <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <div className="grid gap-2">
                   <Label>Tiempo Estimado</Label>
                   <Input value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="Ej: 24h o 10am - 5pm" />
                </div>
                <div className="grid gap-2">
                   <Label>Descripción Adicional</Label>
                   <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
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
            <TableHead>Costo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((o: any) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.nombre}</TableCell>
              <TableCell>
                 <div className="flex items-center gap-2">
                    {o.tipo === "delivery" ? <Truck className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                    <span className="capitalize">{o.tipo}</span>
                 </div>
              </TableCell>
              <TableCell>{o.costo > 0 ? `$${o.costo}` : "Gratis"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch checked={o.activo} onCheckedChange={() => toggleActive(o.id, o.activo)} />
                  {o.activo ? <Badge>Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                   <Button variant="ghost" size="icon"><Settings2 className="h-4 w-4" /></Button>
                   <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {options.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                 No tienes opciones de entrega configuradas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
