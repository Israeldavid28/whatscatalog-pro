"use client"

import { useEffect, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, History, Loader2, Plus, RefreshCcw } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Product, InventoryMovement } from "@/types/database"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function MovimientosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  
  const { profile } = useAuthStore()

  // Form State
  const [selectedProductId, setSelectedProductId] = useState("")
  const [movementType, setMovementType] = useState<"in" | "out" | "adjustment">("in")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchData()
    }
  }, [profile?.tenant_id])

  async function fetchData() {
    try {
      setLoading(true)
      const [productsRes, movementsRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("tenant_id", profile?.tenant_id)
          .order("name"),
        supabase
          .from("inventory_movements")
          .select("*, products(name)")
          .eq("tenant_id", profile?.tenant_id)
          .order("created_at", { ascending: false })
          .limit(20)
      ])

      setProducts(productsRes.data || [])
      setMovements(movementsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMovement() {
    if (!selectedProductId || !quantity) return

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from("inventory_movements")
        .insert({
          tenant_id: profile?.tenant_id,
          product_id: selectedProductId,
          type: movementType,
          quantity: parseInt(quantity),
          reason: reason || null,
          created_by: profile?.id
        })

      if (error) throw error

      setOpen(false)
      // Reset form
      setSelectedProductId("")
      setMovementType("in")
      setQuantity("")
      setReason("")
      
      // Refresh
      fetchData()
    } catch (error) {
      console.error("Error adding movement:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
          <p className="text-muted-foreground">Gestiona el stock de tus productos y ve el historial.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Registrar Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Movimiento</DialogTitle>
              <DialogDescription>
                Registra una entrada, salida o ajuste de stock.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Producto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (Stock actual: {p.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={movementType} onValueChange={(v: any) => setMovementType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Salida</SelectItem>
                      <SelectItem value="adjustment">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    placeholder="0" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Motivo (Opcional)</Label>
                <Input 
                  id="reason" 
                  placeholder="Ej: Restock, Daño, Venta..." 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddMovement} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" /> Historial Reciente
            </CardTitle>
            <CardDescription>Últimos 20 movimientos registrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">
                      {new Date(m.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{m.products?.name}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === 'in' ? 'secondary' : m.type === 'out' ? 'destructive' : 'outline'} className="gap-1">
                        {m.type === 'in' ? <ArrowUpRight className="h-3 w-3" /> : m.type === 'out' ? <ArrowDownLeft className="h-3 w-3" /> : <RefreshCcw className="h-3 w-3" />}
                        {m.type === 'in' ? 'Entrada' : m.type === 'out' ? 'Salida' : 'Ajuste'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {m.type === 'out' ? '-' : ''}{m.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Actual</CardTitle>
            <CardDescription>Resumen de existencias por producto.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right font-bold">{p.stock}</TableCell>
                    <TableCell className="text-right">
                      {p.stock <= 0 ? (
                        <Badge variant="destructive">Sin stock</Badge>
                      ) : p.stock <= 5 ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">Bajo</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
