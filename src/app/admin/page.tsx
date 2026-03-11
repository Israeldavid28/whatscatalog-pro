"use client"

import { useEffect, useState } from "react"
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar,
  Package,
  Clock,
  CheckCircle2
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalVisits: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const { profile } = useAuthStore()

  useEffect(() => {
    if (profile?.tenant_id) {
       fetchDashboardData()
    }
  }, [profile?.tenant_id])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const tId = profile?.tenant_id

      const [ordersRes, visitsRes, recentRes] = await Promise.all([
        supabase.from("pedidos").select("total, estado").eq("tenant_id", tId),
        supabase.from("eventos_catalogo").select("id").eq("tenant_id", tId).eq("tipo_evento", "vista_catalogo"),
        supabase.from("pedidos").select("*").eq("tenant_id", tId).order("created_at", { ascending: false }).limit(5)
      ])

      const orders = ordersRes.data || []
      const totalSales = orders
        .filter(o => o.estado !== "cancelado")
        .reduce((acc, current) => acc + current.total, 0)
      
      const pendingCount = orders.filter(o => o.estado === "pendiente").length

      setStats({
        totalOrders: orders.length,
        totalSales: totalSales,
        totalVisits: (visitsRes.data || []).length,
        pendingOrders: pendingCount
      })
      setRecentOrders(recentRes.data || [])

    } catch (error) {
       console.error("Error fetching dashboard data:", error)
    } finally {
       setLoading(false)
    }
  }

  if (loading) return <div>Cargando estadísticas...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido a la gestión de tu catálogo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimado sin pedidos cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
               <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-none font-normal">
                  {stats.pendingOrders} pendientes
               </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vistas al Catálogo</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground mt-1">Visitas únicas por eventos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planes</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Standard</div>
            <p className="text-xs text-muted-foreground mt-1">Renovación: Próximo mes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
            <CardDescription>
               Tienes {stats.pendingOrders} pedidos pendientes por procesar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                     <div className="rounded-full bg-slate-100 p-2">
                        {order.estado === 'pendiente' ? <Clock className="h-4 w-4 text-yellow-600" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                     </div>
                     <div>
                        <p className="text-sm font-medium">{order.nombre_cliente}</p>
                        <p className="text-xs text-muted-foreground">
                           {format(new Date(order.created_at), 'PPPp', { locale: es })}
                        </p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-bold">${order.total}</p>
                     <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0 h-4">{order.estado}</Badge>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && <p className="text-center text-muted-foreground py-8">No hay pedidos recientes.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
             <Button variant="outline" className="justify-start gap-2 h-12" asChild>
                <a href="/admin/productos">
                   <Package className="h-4 w-4" /> Gestionar Productos
                </a>
             </Button>
             <Button variant="outline" className="justify-start gap-2 h-12" asChild>
                <a href="/admin/configuracion">
                   <Calendar className="h-4 w-4" /> Ajustes del Catálogo
                </a>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
