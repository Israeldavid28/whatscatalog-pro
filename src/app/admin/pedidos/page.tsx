"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, Filter, Eye, MessageCircle, MoreVertical } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const { profile } = useAuthStore()

  useEffect(() => {
    if (profile?.tenant_id) {
       fetchPedidos()
    }
  }, [profile?.tenant_id])

  async function fetchPedidos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("pedidos")
        .select("*, detalle_pedido(*)")
        .eq("tenant_id", profile?.tenant_id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPedidos(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch = p.nombre_cliente.toLowerCase().includes(search.toLowerCase()) || 
                          p.id.substring(0, 8).includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.estado === statusFilter
    return matchesSearch && matchesStatus
  })

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ estado: newStatus })
        .eq("id", id)

      if (error) throw error
      setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: newStatus } : p))
       if (selectedPedido?.id === id) {
          setSelectedPedido({ ...selectedPedido, estado: newStatus })
       }
    } catch (error) {
       console.error("Error updating status:", error)
    }
  }

  const statusColors: any = {
    pendiente: "bg-yellow-100 text-yellow-800",
    procesando: "bg-blue-100 text-blue-800",
    enviado: "bg-purple-100 text-purple-800",
    completado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800"
  }

  if (loading && !pedidos.length) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <div className="flex flex-wrap gap-2">
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por cliente o ID..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
           </div>
           <select 
             className="rounded-md border border-input bg-background px-3 py-2 text-sm"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
           >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="procesando">Procesando</option>
              <option value="enviado">Enviado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
           </select>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPedidos.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">
                   {format(new Date(p.created_at), 'dd MMM, HH:mm', { locale: es })}
                </TableCell>
                <TableCell>
                   <div className="flex flex-col">
                      <span className="font-medium">{p.nombre_cliente}</span>
                      <span className="text-xs text-muted-foreground">{p.telefono_cliente}</span>
                   </div>
                </TableCell>
                <TableCell className="text-xs">
                   {p.metodo_pago_snapshot?.nombre_personalizado}
                </TableCell>
                <TableCell className="font-bold">
                   ${p.total}
                </TableCell>
                <TableCell>
                   <Badge className={`${statusColors[p.estado] || ""} border-none capitalize`}>
                      {p.estado}
                   </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                         <DropdownMenuItem onClick={() => setSelectedPedido(p)} className="gap-2">
                            <Eye className="h-4 w-4" /> Ver Detalles
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => window.open(`https://wa.me/${p.telefono_cliente.replace(/\D/g, '')}`, '_blank')} className="gap-2">
                            <MessageCircle className="h-4 w-4" /> Contactar WhatsApp
                         </DropdownMenuItem>
                         <Separator className="my-1" />
                         <DropdownMenuItem onClick={() => updateStatus(p.id, "procesando")} className="text-blue-600">Marcar Procesando</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => updateStatus(p.id, "enviado")} className="text-purple-600">Marcar Enviado</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => updateStatus(p.id, "completado")} className="text-green-600">Marcar Completado</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => updateStatus(p.id, "cancelado")} className="text-red-600">Cancelar Pedido</DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredPedidos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                   No se encontraron pedidos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedPedido} onOpenChange={() => setSelectedPedido(null)}>
         <DialogContent className="sm:max-w-xl">
            {selectedPedido && (
              <>
                 <DialogHeader>
                    <DialogTitle className="flex items-center justify-between pr-8">
                       <span>Pedido #{selectedPedido.id.substring(0, 8)}</span>
                       <Badge className={`${statusColors[selectedPedido.estado]} capitalize`}>{selectedPedido.estado}</Badge>
                    </DialogTitle>
                 </DialogHeader>
                 
                 <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <span className="text-xs text-muted-foreground uppercase font-bold">Cliente</span>
                          <p className="font-medium">{selectedPedido.nombre_cliente}</p>
                          <p className="text-sm">{selectedPedido.telefono_cliente}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-xs text-muted-foreground uppercase font-bold">Entrega</span>
                          <p className="font-medium">{selectedPedido.opcion_entrega_snapshot?.nombre}</p>
                          <p className="text-sm text-muted-foreground">{selectedPedido.direccion_entrega || 'Retiro en tienda'}</p>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <span className="text-xs text-muted-foreground uppercase font-bold">Resumen de Productos</span>
                       <div className="rounded-lg border divide-y">
                          {selectedPedido.detalle_pedido?.map((item: any) => (
                             <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                                <div>
                                   <span className="font-medium">{item.cantidad}x</span> {item.nombre_producto}
                                </div>
                                <span className="font-mono">${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                       <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${selectedPedido.subtotal}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Envío</span>
                          <span>${selectedPedido.costo_envio}</span>
                       </div>
                       <div className="flex justify-between font-bold text-lg pt-1 border-t">
                          <span>Total</span>
                          <span className="text-primary">${selectedPedido.total}</span>
                       </div>
                    </div>

                    {selectedPedido.notas && (
                       <div className="space-y-1">
                          <span className="text-xs text-muted-foreground uppercase font-bold">Notas del Cliente</span>
                          <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-100">{selectedPedido.notas}</p>
                       </div>
                    )}
                 </div>
                 
                 <div className="flex justify-between gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => window.open(`https://wa.me/${selectedPedido.telefono_cliente.replace(/\D/g, '')}`, '_blank')}>
                       Contactar Cliente
                    </Button>
                    <Button className="flex-1" onClick={() => setSelectedPedido(null)}>
                       Cerrar
                    </Button>
                 </div>
              </>
            )}
         </DialogContent>
      </Dialog>
    </div>
  )
}
