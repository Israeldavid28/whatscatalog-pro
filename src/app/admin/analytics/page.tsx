"use client"

import { useEffect, useState } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend,
  Cell
} from "recharts"
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  MousePointer2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { format, subDays, startOfDay } from "date-fns"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("7d")
  const [data, setData] = useState<any>({
    timeSeries: [],
    topProducts: [],
    summary: {
      visits: 0,
      addCart: 0,
      checkouts: 0,
      conversion: 0
    }
  })
  
  const { profile } = useAuthStore()

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchAnalytics()
    }
  }, [profile?.tenant_id, period])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      const tId = profile?.tenant_id
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 1
      const startDate = subDays(new Date(), days).toISOString()

      const { data: events, error } = await supabase
        .from("eventos_catalogo")
        .select("*, products(name)")
        .eq("tenant_id", tId)
        .gte("created_at", startDate)

      if (error) throw error

      // Process Time Series
      const daysArray = Array.from({ length: days }, (_, i) => {
        const d = subDays(new Date(), i)
        return format(d, 'yyyy-MM-dd')
      }).reverse()

      const timeSeries = daysArray.map(day => {
        const dayEvents = events.filter(e => e.created_at.startsWith(day))
        return {
          name: format(new Date(day), 'dd MMM', { locale: es }),
          visitas: dayEvents.filter(e => e.tipo_evento === 'vista_producto' || e.tipo_evento === 'vista_catalogo').length,
          pedidos: dayEvents.filter(e => e.tipo_evento === 'pedido_whatsapp').length
        }
      })

      // Process Top Products
      const productMap: any = {}
      events.filter(e => e.tipo_evento === 'vista_producto' && e.products).forEach(e => {
        const pName = e.products.name
        productMap[pName] = (productMap[pName] || 0) + 1
      })

      const topProducts = Object.entries(productMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5)

      // Summary
      const visits = events.filter(e => e.tipo_evento === 'vista_producto' || e.tipo_evento === 'vista_catalogo').length
      const addCart = events.filter(e => e.tipo_evento === 'add_cart').length
      const checkouts = events.filter(e => e.tipo_evento === 'pedido_whatsapp').length

      setData({
        timeSeries,
        topProducts,
        summary: {
          visits,
          addCart,
          checkouts,
          conversion: visits > 0 ? ((checkouts / visits) * 100).toFixed(1) : 0
        }
      })

    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground">Analiza el comportamiento de tus clientes en el catálogo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24 horas</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Último mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Vistas Totales</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.visits}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>+12% vs anterior</span>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Interés (Add Cart)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.addCart}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
               <ArrowUpRight className="h-3 w-3 text-emerald-500" />
               <span>Alta intención de compra</span>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Conversión Final</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.checkouts}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
               <ArrowUpRight className="h-3 w-3 text-emerald-500" />
               <span>Pedidos vía WhatsApp</span>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <MousePointer2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.conversion}%</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
               <span className="font-semibold">Ratio Vista/Venta</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4 shadow-sm border-none bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Tráfico y Ventas</CardTitle>
            <CardDescription>Visualización temporal de visitas vs pedidos completados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.timeSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Legend verticalAlign="top" height={36}/>
                   <Line type="monotone" dataKey="visitas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                   <Line type="monotone" dataKey="pedidos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="col-span-3 shadow-sm border-none bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Productos Populares</CardTitle>
            <CardDescription>Los artículos más vistos por tus clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart layout="vertical" data={data.topProducts} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                   <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {data.topProducts.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
