"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { Category } from "@/types/database"

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [submitting, setSubmitting] = useState(false)

  const profile = useAuthStore((state) => state.profile)

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchCategorias()
    }
  }, [profile])

  async function fetchCategorias() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .order("sort_order", { ascending: true })

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.tenant_id) return

    setSubmitting(true)
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            description: formData.description,
          })
          .eq("id", editingCategory.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("categories").insert({
          tenant_id: profile.tenant_id,
          name: formData.name,
          description: formData.description,
          sort_order: categorias.length,
        })

        if (error) throw error
      }

      setOpen(false)
      setEditingCategory(null)
      setFormData({ name: "", description: "" })
      fetchCategorias()
    } catch (error) {
      console.error("Error saving category:", error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)
      if (error) throw error
      fetchCategorias()
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, description: category.description || "" })
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categorías</h2>
          <p className="text-muted-foreground">
            Organiza tus productos por categorías para facilitar la búsqueda.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCategory(null)
              setFormData({ name: "", description: "" })
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                </DialogTitle>
                <DialogDescription>
                  Ingresa los detalles de la categoría.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Herramientas"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descripción de la categoría"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No hay categorías creadas.
                </TableCell>
              </TableRow>
            ) : (
              categorias.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(category.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
