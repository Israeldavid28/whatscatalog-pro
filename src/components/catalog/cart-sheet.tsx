"use client"

import { ShoppingCart, Trash2, Plus, Minus, MessageCircle } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/stores/cartStore"

interface CartSheetProps {
  businessName: string
  businessPhone: string
  currency: string
}

export function CartSheet({ businessName, businessPhone, currency }: CartSheetProps) {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const total = useCartStore((s) => s.totalPrice())
  const itemCount = useCartStore((s) => s.totalItems())

  const handleCheckout = () => {
    const message = `Hola ${businessName}, me gustaría realizar un pedido:\n\n` +
      items.map(item => `- ${item.name} x${item.quantity} (${currency} ${(item.price * item.quantity).toFixed(2)})`).join("\n") +
      `\n\n*Total: ${currency} ${total.toFixed(2)}*`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${businessPhone}?text=${encodedMessage}`, "_blank")
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
          <ShoppingCart className="h-6 w-6 text-primary" />
          {itemCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Tu Pedido
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium leading-tight">{item.name}</h4>
                      <p className="text-sm font-bold text-primary">
                        {currency} {item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 ml-auto text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>{currency} {total.toFixed(2)}</span>
              </div>
              <Button className="w-full py-6 rounded-2xl gap-2 text-lg" onClick={handleCheckout}>
                <MessageCircle className="h-5 w-5 fill-white" />
                Pedir por WhatsApp
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                El pedido se enviará directamente al WhatsApp del negocio.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ShoppingBag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
