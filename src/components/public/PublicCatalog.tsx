import { useMemo, useState } from "react"
import { Search, ShoppingCart, Info, Loader2 } from "lucide-react"

import { Product, Category, Tenant } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/stores/cartStore"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import CartSidebar from "@/components/public/CartSidebar"
import { trackEvent } from "@/lib/analytics"

interface CatalogProps {
  tenant: Tenant
  products: Product[]
  categories: Category[]
}

export default function PublicCatalog({ tenant, products, categories }: CatalogProps) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const totalItems = useCartStore((s) => s.totalItems())
  const totalPrice = useCartStore((s) => s.totalPrice())

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.description?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory
      return matchesSearch && matchesCategory && p.active
    })
  }, [products, search, selectedCategory])

  const settings = tenant.settings || {}
  const primaryColor = settings.primary_color || "#3B82F6"

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm transition-all" style={{ borderTop: `4px solid ${primaryColor}` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div className="flex items-center gap-3">
             {settings.logo_url && (
                <img src={settings.logo_url} alt={tenant.name} className="h-10 w-10 rounded-lg object-cover" />
             )}
             <h1 className="text-xl font-bold tracking-tight">{tenant.name}</h1>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="relative" 
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white" style={{ background: primaryColor }}>
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar productos..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Button 
              variant={selectedCategory === null ? "default" : "outline"} 
              size="sm" 
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "" : "border-slate-200"}
              style={selectedCategory === null ? { backgroundColor: primaryColor } : {}}
            >
              Todos
            </Button>
            {categories.map((c) => (
              <Button 
                key={c.id} 
                variant={selectedCategory === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(c.id)}
                className={selectedCategory === c.id ? "" : "border-slate-200 text-slate-600"}
                style={selectedCategory === c.id ? { backgroundColor: primaryColor } : {}}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((p) => {
             const mainImage = p.images && p.images.length > 0 ? p.images[0] : null

             return (
               <div key={p.id} className="group relative overflow-hidden rounded-xl border bg-white transition hover:shadow-md h-[280px] sm:h-[320px] flex flex-col">
                  <div className="aspect-square w-full overflow-hidden bg-muted cursor-pointer" onClick={() => {
                    setSelectedProduct(p)
                    trackEvent(tenant.id, "vista_producto", p.id)
                  }}>
                    {mainImage ? (
                      <img src={mainImage} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Info className="h-8 w-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div className="space-y-1">
                      <h3 className="line-clamp-1 text-sm font-semibold sm:text-base cursor-pointer" onClick={() => setSelectedProduct(p)}>{p.name}</h3>
                      <p className="line-clamp-1 text-[10px] sm:text-xs text-muted-foreground">{p.description}</p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold sm:text-lg" style={{ color: primaryColor }}>
                        {settings.currency || '$'} {p.price}
                      </span>
                      <Button size="icon" className="h-8 w-8 rounded-full sm:h-9 sm:w-9" style={{ backgroundColor: primaryColor }} onClick={() => {
                        addItem({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          quantity: 1,
                          image: mainImage || undefined
                        })
                        trackEvent(tenant.id, "add_cart", p.id)
                      }}>
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
               </div>
             )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No encontramos lo que buscas.</p>
          </div>
        )}
      </main>

      {/* Floating Checkout Button Mobile */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-4 sm:hidden">
            <Button className="w-full gap-2 text-lg h-12" style={{ backgroundColor: primaryColor }} onClick={() => setIsCartOpen(true)}>
               Ver Pedido ({totalItems}) <span>•</span> {settings.currency || '$'} {totalPrice}
            </Button>
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
                <DialogDescription>{selectedProduct.description}</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                 <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted">
                    {selectedProduct.images && selectedProduct.images[0] && (
                       <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="h-full w-full object-cover" />
                    )}
                 </div>
                 <div className="flex items-center justify-between px-2">
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>{settings.currency || '$'} {selectedProduct.price}</span>
                    <Badge variant={selectedProduct.stock > 0 ? "outline" : "destructive"}>
                       {selectedProduct.stock > 0 ? `${selectedProduct.stock} disponible` : "Agotado"}
                    </Badge>
                 </div>
              </div>
              <Button className="w-full h-12 gap-2" disabled={selectedProduct.stock <= 0} style={{ backgroundColor: primaryColor }} onClick={() => {
                  addItem({
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    quantity: 1,
                    image: selectedProduct.images?.[0]
                  })
                  trackEvent(tenant.id, "add_cart", selectedProduct.id)
                  setSelectedProduct(null)
              }}>
                 Agregar al Carrito
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <CartSidebar 
        tenant={tenant}
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
      />
    </div>
  )
}
