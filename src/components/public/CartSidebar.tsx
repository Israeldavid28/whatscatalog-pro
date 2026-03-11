"use client"

import { useMemo, useState, useEffect } from "react"
import { Loader2, Trash2, Minus, Plus, ShoppingCart, Send, ArrowLeft } from "lucide-react"

import { useCartStore } from "@/stores/cartStore"
import { Tenant, MetodoPagoConfig, OpcionEntrega } from "@/types/database"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { trackEvent } from "@/lib/analytics"

interface CartSidebarProps {
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CartSidebar({ tenant, open, onOpenChange }: CartSidebarProps) {
  const [step, setStep] = useState<"cart" | "checkout">("cart")
  const [loading, setLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<MetodoPagoConfig[]>([])
  const [deliveryOptions, setDeliveryOptions] = useState<OpcionEntrega[]>([])
  
  const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCartStore()

  // Checkout Form
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [address, setAddress] = useState("")
  const [paymentId, setPaymentId] = useState("")
  const [deliveryId, setDeliveryId] = useState("")
  const [notes, setNotes] = useState("")

  const settings = tenant.settings || {}
  const primaryColor = settings.primary_color || "#3B82F6"
  const currency = settings.currency || "USD"

  useEffect(() => {
    if (open && step === "checkout") {
      fetchConfigs()
    }
  }, [open, step])

  async function fetchConfigs() {
    try {
      const [payments, deliveries] = await Promise.all([
        supabase.from("metodos_pago_config").select("*").eq("tenant_id", tenant.id).eq("activo", true),
        supabase.from("opciones_entrega").select("*").eq("tenant_id", tenant.id).eq("activo", true)
      ])
      setPaymentMethods(payments.data || [])
      setDeliveryOptions(deliveries.data || [])
    } catch (error) {
       console.error("Error fetching checkout config:", error)
    }
  }

  const selectedDelivery = useMemo(() => 
    deliveryOptions.find(o => o.id === deliveryId), 
  [deliveryOptions, deliveryId])

  const grandTotal = useMemo(() => 
    totalPrice() + (selectedDelivery?.costo || 0), 
  [totalPrice, selectedDelivery])

  async function handleSendOrder() {
     if (!customerName || !customerPhone || !paymentId || !deliveryId) {
        alert("Por favor completa los campos requeridos")
        return
     }

     try {
       setLoading(true)
       
       const selectedPayment = paymentMethods.find(p => p.id === paymentId)

       // 1. Create Order in Supabase
       const { data: order, error: orderError } = await supabase
        .from("pedidos")
        .insert({
           tenant_id: tenant.id,
           nombre_cliente: customerName,
           telefono_cliente: customerPhone,
           direccion_entrega: address,
           metodo_pago_snapshot: selectedPayment,
           opcion_entrega_snapshot: selectedDelivery,
           subtotal: totalPrice(),
           costo_envio: selectedDelivery?.costo || 0,
           total: grandTotal,
           notas: notes,
           estado: "pendiente"
        })
        .select()
        .single()

       if (orderError) throw orderError

       // 2. Create Order Details
       const details = items.map(i => ({
          pedido_id: order.id,
          producto_id: i.id,
          nombre_producto: i.name,
          cantidad: i.quantity,
          precio_unitario: i.price
       }))

       const { error: detailsError } = await supabase
        .from("detalle_pedido")
        .insert(details)

       if (detailsError) throw detailsError

       // 3. Register Event (Analytics)
       trackEvent(tenant.id, "pedido_whatsapp", undefined, { order_id: order.id, total: grandTotal })

       // 4. Generate WhatsApp Message
       const message = generateWhatsAppMessage(order, items, selectedDelivery, selectedPayment)
       const encodedMessage = encodeURIComponent(message)
       const whatsappUrl = `https://wa.me/${tenant.phone?.replace(/\D/g, "")}?text=${encodedMessage}`

       // 5. Success Flow
       clearCart()
       onOpenChange(false)
       setStep("cart")
       window.open(whatsappUrl, '_blank')
     } catch (error) {
        console.error("Error sending order:", error)
        alert("Ocurrió un error al procesar el pedido.")
     } finally {
        setLoading(false)
     }
  }

  function generateWhatsAppMessage(order: any, items: any[], delivery: any, payment: any) {
     let text = `🛍️ *NUEVO PEDIDO - ${tenant.name.toUpperCase()}*\n\n`
     text += `👤 *Cliente:* ${order.nombre_cliente}\n`
     text += `📞 *Teléfono:* ${order.telefono_cliente}\n`
     text += `📍 *Entrega:* ${delivery.nombre} (${order.direccion_entrega || 'N/A'})\n`
     text += `💳 *Pago:* ${payment.nombre_personalizado}\n\n`
     
     text += `📦 *PRODUCTOS:*\n`
     items.forEach(i => {
        text += `- ${i.quantity}x ${i.name} (${currency} ${i.price} c/u)\n`
     })
     
     text += `\n💵 *SUBTOTAL:* ${currency} ${order.subtotal}\n`
     text += `🚚 *ENVÍO:* ${currency} ${order.costo_envio}\n`
     text += `💰 *TOTAL A PAGAR:* ${currency} ${order.total}\n\n`
     
     if (order.notas) text += `📝 *NOTAS:* ${order.notas}\n\n`
     
     if (payment.instrucciones) {
        text += `ℹ️ *INSTRUCCIONES DE PAGO:*\n${payment.instrucciones}\n`
     }
     
     text += `\n✅ Por favor, confirma la recepción de este pedido.`
     return text
  }

  return (
    <Sheet open={open} onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) setStep("cart")
    }}>
      <SheetContent className="flex flex-col h-full w-full sm:max-w-md p-0">
        <div className="flex flex-col h-full">
           {/* Custom Header with Back Button if Checkout */}
           <div className="p-6 border-b flex items-center gap-2">
              {step === "checkout" && (
                <Button variant="ghost" size="icon" onClick={() => setStep("cart")}>
                   <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                 <SheetTitle className="text-xl">
                    {step === "cart" ? "Mi Pedido" : "Finalizar Pedido"}
                 </SheetTitle>
                 <SheetDescription>
                    {step === "cart" ? `${totalItems} productos seleccionados` : "Completa tus datos para enviar por WhatsApp"}
                 </SheetDescription>
              </div>
           </div>

           <div className="flex-1 overflow-hidden">
             {step === "cart" ? (
               <ScrollArea className="h-full px-6">
                 {items.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                      <ShoppingCart className="h-12 w-12 mb-4" />
                      <p>Tu carrito está vacío</p>
                   </div>
                 ) : (
                   <div className="py-4 space-y-4">
                      {items.map((i) => (
                        <div key={i.id} className="flex gap-4 items-center">
                           <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0 border">
                              {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm line-clamp-1">{i.name}</h4>
                              <p className="text-sm font-bold" style={{ color: primaryColor }}>{currency} {i.price}</p>
                              
                              <div className="flex items-center gap-3 mt-2">
                                 <div className="flex items-center border rounded-lg h-8">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={() => updateQuantity(i.id, i.quantity - 1)}>
                                       <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center text-xs font-semibold">{i.quantity}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-l" onClick={() => updateQuantity(i.id, i.quantity + 1)}>
                                       <Plus className="h-3 w-3" />
                                    </Button>
                                 </div>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i.id)}>
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
               </ScrollArea>
             ) : (
               <ScrollArea className="h-full px-6 py-4 space-y-6">
                  <div className="space-y-4">
                     <span className="text-xs font-bold uppercase text-muted-foreground">Datos Personales</span>
                     <div className="grid gap-4">
                        <div className="grid gap-1.5">
                           <Label htmlFor="c_name">Nombre Completo *</Label>
                           <Input id="c_name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                           <Label htmlFor="c_phone">Número de Teléfono *</Label>
                           <Input id="c_phone" placeholder="Ej: 04120000000" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                        </div>
                     </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                     <span className="text-xs font-bold uppercase text-muted-foreground">Logística y Pago</span>
                     <div className="grid gap-4">
                        <div className="grid gap-1.5">
                           <Label>Método de Entrega *</Label>
                           <Select value={deliveryId} onValueChange={setDeliveryId}>
                              <SelectTrigger>
                                 <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                 {deliveryOptions.map(o => (
                                    <SelectItem key={o.id} value={o.id}>
                                       {o.nombre} ({o.costo > 0 ? `${currency} ${o.costo}` : "Gratis"})
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                        {selectedDelivery?.tipo === "delivery" && (
                           <div className="grid gap-1.5">
                              <Label htmlFor="c_addr">Dirección de Entrega *</Label>
                              <Textarea id="c_addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Indica calle, edificio, punto de referencia..." />
                           </div>
                        )}
                        <div className="grid gap-1.5">
                           <Label>Método de Pago *</Label>
                           <Select value={paymentId} onValueChange={setPaymentId}>
                              <SelectTrigger>
                                 <SelectValue placeholder="Selecciona" />
                              </SelectTrigger>
                              <SelectContent>
                                 {paymentMethods.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.nombre_personalizado}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                     <span className="text-xs font-bold uppercase text-muted-foreground">Notas Adicionales</span>
                     <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: No tocar el timbre, llamar al llegar." />
                  </div>
               </ScrollArea>
             )}
           </div>

           {/* Footer with Totals and Action */}
           <div className="p-6 border-t bg-slate-50 space-y-4">
              <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{currency} {totalPrice()}</span>
                 </div>
                 {step === "checkout" && selectedDelivery && (
                   <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envío ({selectedDelivery.nombre})</span>
                      <span>{currency} {selectedDelivery.costo}</span>
                   </div>
                 )}
                 <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>{currency} {grandTotal}</span>
                 </div>
              </div>

              {step === "cart" ? (
                <Button className="w-full h-12" disabled={items.length === 0} style={{ backgroundColor: primaryColor }} onClick={() => {
                  setStep("checkout")
                  trackEvent(tenant.id, "inicio_checkout")
                }}>
                   Continuar al Pago
                </Button>
              ) : (
                <Button className="w-full h-12 gap-2" disabled={loading} style={{ backgroundColor: primaryColor }} onClick={handleSendOrder}>
                   {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                   Siguiente: Confirmar en WhatsApp
                </Button>
              )}
           </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
