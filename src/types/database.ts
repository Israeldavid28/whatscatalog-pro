export type Profile = {
  id: string
  tenant_id: string | null
  full_name: string | null
  role: 'owner' | 'admin' | 'staff'
  updated_at: string
}

export type Tenant = {
  id: string
  name: string
  slug: string
  phone: string | null
  logo_url: string | null
  address: string | null
  currency: string
  settings: {
     primary_color?: string
     currency?: string
     whatsapp_number?: string
     logo_url?: string
     banner_url?: string
     [key: string]: any
  }
  created_at: string
}

export type Category = {
  id: string
  tenant_id: string
  name: string
  description: string | null
  orden: number
  is_active: boolean
}

export type Product = {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  stock: number
  images: string[]
  active: boolean
  featured: boolean
  created_at: string
}

export type InventoryMovement = {
  id: string
  tenant_id: string
  product_id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string | null
  created_at: string
  created_by: string | null
}

export type Pedido = {
  id: string
  tenant_id: string
  nombre_cliente: string
  telefono_cliente: string
  direccion_entrega: string | null
  metodo_pago_snapshot: any
  opcion_entrega_snapshot: any
  subtotal: number
  costo_envio: number
  total: number
  estado: 'pendiente' | 'procesando' | 'enviado' | 'completado' | 'cancelado'
  notas: string | null
  created_at: string
}

export type DetallePedido = {
  id: string
  pedido_id: string
  producto_id: string | null
  nombre_producto: string
  cantidad: number
  precio_unitario: number
}

export type MetodoPagoTipo = {
  id: string
  nombre: string
  requiere_datos_bancarios: boolean
}

export type MetodoPagoConfig = {
  id: string
  tenant_id: string
  tipo_id: string
  nombre_personalizado: string
  datos_bancarios: any
  instrucciones: string | null
  activo: boolean
  orden: number
}

export type OpcionEntrega = {
  id: string
  tenant_id: string
  tipo: 'delivery' | 'pickup'
  nombre: string
  descripcion: string | null
  costo: number
  tiempo_estimado: string | null
  configuracion_adicional: any
  activo: boolean
  orden: number
}

export type EventoCatalogo = {
  id: string
  tenant_id: string
  tipo_evento: string
  producto_id: string | null
  metadata: any
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant
        Insert: Omit<Tenant, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Tenant, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'updated_at'>
        Update: Partial<Omit<Profile, 'updated_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id'> & { id?: string }
        Update: Partial<Omit<Category, 'id'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      inventory_movements: {
        Row: InventoryMovement
        Insert: Omit<InventoryMovement, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<InventoryMovement, 'id' | 'created_at'>>
      }
      pedidos: {
        Row: Pedido
        Insert: Omit<Pedido, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Pedido, 'id' | 'created_at'>>
      }
      detalle_pedido: {
        Row: DetallePedido
        Insert: Omit<DetallePedido, 'id'> & { id?: string }
        Update: Partial<Omit<DetallePedido, 'id'>>
      }
      metodos_pago_tipo: {
        Row: MetodoPagoTipo
        Insert: Omit<MetodoPagoTipo, 'id'> & { id?: string }
        Update: Partial<Omit<MetodoPagoTipo, 'id'>>
      }
      metodos_pago_config: {
        Row: MetodoPagoConfig
        Insert: Omit<MetodoPagoConfig, 'id'> & { id?: string }
        Update: Partial<Omit<MetodoPagoConfig, 'id'>>
      }
      opciones_entrega: {
        Row: OpcionEntrega
        Insert: Omit<OpcionEntrega, 'id'> & { id?: string }
        Update: Partial<Omit<OpcionEntrega, 'id'>>
      }
      eventos_catalogo: {
        Row: EventoCatalogo
        Insert: Omit<EventoCatalogo, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<EventoCatalogo, 'id' | 'created_at'>>
      }
    }
  }
}
