"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Trash2, Edit, Search, Package, MoreHorizontal, Image as ImageIcon, Upload, X } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProductosAdminPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  // Image Upload State
  const [uploading, setUploading] = useState(false)
  const [tempImages, setTempImages] = useState<string[]>([])

  const { profile } = useAuthStore()

  useEffect(() => {
    if (profile?.tenant_id) {
       fetchData()
    }
  }, [profile?.tenant_id])

  async function fetchData() {
    try {
      setLoading(true)
      const [pRes, cRes] = await Promise.all([
        supabase.from("products").select("*").eq("tenant_id", profile?.tenant_id).order("name"),
        supabase.from("categories").select("*").eq("tenant_id", profile?.tenant_id).order("orden")
      ])
      
      setProducts(pRes.data || [])
      setCategories(cRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (editingProduct) {
      setTempImages(editingProduct.images || [])
    } else {
      setTempImages([])
    }
  }, [editingProduct, isDialogOpen])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !profile?.tenant_id) return

    setUploading(true)
    try {
      const newImages = [...tempImages]
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${profile.tenant_id}/${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from('productos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath)

        newImages.push(publicUrl)
      }
      
      setTempImages(newImages)
    } catch (error) {
       console.error('Error al subir imagen:', error)
       alert('Error al subir imagen')
    } finally {
       setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    const payload = {
      tenant_id: profile?.tenant_id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      stock: parseInt(formData.get("stock") as string),
      category_id: formData.get("category_id") === "null" ? null : formData.get("category_id"),
      active: formData.get("active") === "on",
      images: tempImages
    }

    try {
      if (editingProduct?.id) {
         await supabase.from("products").update(payload).eq("id", editingProduct.id)
      } else {
         await supabase.from("products").insert(payload)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (err) {
       console.error(err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que quieres eliminar este producto?")) return
    await supabase.from("products").delete().eq("id", id)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold">Productos</h1>
         <Button onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
         </Button>
      </div>

      <div className="flex items-center gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o descripción..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead className="w-16">Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {filteredProducts.map((p) => {
                  const category = categories.find(c => c.id === p.category_id)
                  return (
                     <TableRow key={p.id}>
                        <TableCell>
                           {p.images?.[0] ? (
                              <img src={p.images[0]} className="h-10 w-10 object-cover rounded-md" />
                           ) : (
                              <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
                                 <ImageIcon className="h-4 w-4" />
                              </div>
                           )}
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{category?.name || "Sin categoría"}</TableCell>
                        <TableCell>${p.price}</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell>
                           <Switch 
                             checked={p.active} 
                             onCheckedChange={async (val) => {
                                await supabase.from("products").update({ active: val }).eq("id", p.id)
                                fetchData()
                             }}
                           />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                           <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(p); setIsDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        </TableCell>
                     </TableRow>
                  )
               })}
               {loading && <TableRow><TableCell colSpan={7} className="text-center h-40"><Loader2 className="animate-spin inline mr-2" />Cargando...</TableCell></TableRow>}
               {!loading && filteredProducts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-40 text-muted-foreground">No hay productos.</TableCell></TableRow>}
            </TableBody>
         </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>{editingProduct ? 'Editar Producto' : 'Crear Producto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
               {/* Image Upload Section */}
               <div className="space-y-2">
                  <Label>Imágenes del Producto</Label>
                  <div className="grid grid-cols-4 gap-4">
                     {tempImages.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                           <img src={src} className="h-full w-full object-cover" />
                           <button 
                             type="button"
                             onClick={() => setTempImages(prev => prev.filter((_, idx) => idx !== i))}
                             className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <X className="h-3 w-3" />
                           </button>
                        </div>
                     ))}
                     <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2">Subir</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                     </label>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input name="name" defaultValue={editingProduct?.name} required />
               </div>
               <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input name="description" defaultValue={editingProduct?.description} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label>Precio</Label>
                     <Input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required />
                  </div>
                  <div className="space-y-2">
                     <Label>Stock</Label>
                     <Input name="stock" type="number" defaultValue={editingProduct?.stock || 0} required />
                  </div>
               </div>
               <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select name="category_id" defaultValue={editingProduct?.category_id || "null"}>
                     <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="null">Sin categoría</SelectItem>
                        {categories.map(c => (
                           <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <div className="flex items-center gap-2">
                  <Switch name="active" defaultChecked={editingProduct ? editingProduct.active : true} id="active-switch" />
                  <Label htmlFor="active-switch">Producto Activo</Label>
               </div>
               <div className="pt-4 flex justify-end gap-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={uploading}>
                     {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
    </div>
  )
}
