"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Palette, CreditCard, Truck, Globe } from "lucide-react"

import DatosGeneralesForm from "@/components/admin/configuracion/DatosGeneralesForm"
import PersonalizacionForm from "@/components/admin/configuracion/PersonalizacionForm"
import MetodosPagoList from "@/components/admin/configuracion/MetodosPagoList"
import OpcionesEntregaList from "@/components/admin/configuracion/OpcionesEntregaList"
import DominioConfigForm from "@/components/admin/configuracion/DominioConfigForm"

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">
          Ajusta los detalles de tu negocio, apariencia y métodos de pedido.
        </p>
      </div>

      <Tabs defaultValue="generales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="generales" className="gap-2">
            <Building2 className="h-4 w-4" /> <span className="hidden sm:inline">Generales</span>
          </TabsTrigger>
          <TabsTrigger value="visual" className="gap-2">
            <Palette className="h-4 w-4" /> <span className="hidden sm:inline">Visual</span>
          </TabsTrigger>
          <TabsTrigger value="pagos" className="gap-2">
            <CreditCard className="h-4 w-4" /> <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
          <TabsTrigger value="entrega" className="gap-2">
            <Truck className="h-4 w-4" /> <span className="hidden sm:inline">Entrega</span>
          </TabsTrigger>
          <TabsTrigger value="dominio" className="gap-2">
            <Globe className="h-4 w-4" /> <span className="hidden sm:inline">Dominio</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generales">
          <Card>
            <CardHeader>
              <CardTitle>Datos del Negocio</CardTitle>
              <CardDescription>
                Información básica que aparecerá en tu catálogo y mensajes de WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DatosGeneralesForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle>Personalización Visual</CardTitle>
              <CardDescription>
                Cambia el logo y los colores de tu catálogo público.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalizacionForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
              <CardDescription>
                Configura cómo tus clientes pueden pagarte (Transferencias, Pago Móvil, Zelle, etc).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetodosPagoList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrega">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Entrega</CardTitle>
              <CardDescription>
                Configura las opciones de Delivery o Pick-up para tus pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OpcionesEntregaList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dominio">
          <Card>
            <CardHeader>
              <CardTitle>Dominio Personalizado</CardTitle>
              <CardDescription>
                Configura tu propio dominio para el catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DominioConfigForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
