-- 1. Tenants (Negocios)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone TEXT,
    logo_url TEXT,
    address TEXT,
    currency TEXT DEFAULT 'USD',
    settings JSONB DEFAULT '{}'::jsonb,
    custom_domain VARCHAR(255) UNIQUE,
    domain_verified BOOLEAN DEFAULT false,
    domain_verification_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    full_name TEXT,
    role TEXT DEFAULT 'staff',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    orden INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true
);

-- 4. Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    stock INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Pedidos (vía WhatsApp)
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre_cliente TEXT NOT NULL,
    telefono_cliente TEXT NOT NULL,
    direccion_entrega TEXT,
    metodo_pago_snapshot JSONB,
    opcion_entrega_snapshot JSONB,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    costo_envio NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    estado TEXT DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Detalle de Pedido
CREATE TABLE IF NOT EXISTS public.detalle_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    nombre_producto TEXT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(12,2) NOT NULL
);

-- 7. Inventory Movements
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 8. Métodos de Pago Tipos
CREATE TABLE IF NOT EXISTS public.metodos_pago_tipo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL, -- 'transferencia', 'pago_movil', 'efectivo', 'zelle'
    requiere_datos_bancarios BOOLEAN DEFAULT false
);

-- 9. Métodos de Pago Configuración
CREATE TABLE IF NOT EXISTS public.metodos_pago_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tipo_id UUID NOT NULL REFERENCES public.metodos_pago_tipo(id),
    nombre_personalizado TEXT NOT NULL,
    datos_bancarios JSONB DEFAULT '{}'::jsonb,
    instrucciones TEXT,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0
);

-- 10. Opciones de Entrega
CREATE TABLE IF NOT EXISTS public.opciones_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('delivery', 'pickup')),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    costo NUMERIC(12,2) DEFAULT 0.00,
    tiempo_estimado TEXT,
    configuracion_adicional JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0
);

-- 11. Eventos de Catálogo (Analytics)
CREATE TABLE IF NOT EXISTS public.eventos_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL, -- 'vista_producto', 'add_cart', 'inicio_checkout', 'pedido_whatsapp'
    producto_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metodos_pago_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opciones_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_catalogo ENABLE ROW LEVEL SECURITY;

-- Helper Function to get tenant_id from user metadata
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id() 
RETURNS UUID AS $$
    SELECT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid;
$$ LANGUAGE sql STABLE;

-- RLS Policies
CREATE POLICY "Users can view their own tenant profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can manage their tenant's categories" 
ON public.categories FOR ALL 
USING (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Users can manage their tenant's products" 
ON public.products FOR ALL 
USING (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Users can manage their tenant's movements" 
ON public.inventory_movements FOR ALL 
USING (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Users can manage their tenant's config" 
ON public.metodos_pago_config FOR ALL 
USING (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Users can manage their tenant's delivery" 
ON public.opciones_entrega FOR ALL 
USING (tenant_id = public.get_auth_tenant_id());

-- Public Access (No Auth Needed for Catalog)
CREATE POLICY "Anyone can view products of a tenant"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Anyone can view categories of a tenant"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Anyone can view active payment methods"
ON public.metodos_pago_config FOR SELECT
USING (activo = true);

CREATE POLICY "Anyone can view active delivery options"
ON public.opciones_entrega FOR SELECT
USING (activo = true);

-- Pedidos (Public Insert)
CREATE POLICY "Public insert pedidos" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert detalle_pedido" ON public.detalle_pedido FOR INSERT WITH CHECK (true);

-- Backend Admin Read for Orders
CREATE POLICY "Admin view orders" ON public.pedidos FOR SELECT USING (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Admin manage orders" ON public.pedidos FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_stock_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.type = 'in') THEN
        UPDATE public.products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
    ELSIF (NEW.type = 'out') THEN
        UPDATE public.products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
    ELSIF (NEW.type = 'adjustment') THEN
        UPDATE public.products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_stock_on_movement ON public.inventory_movements;
CREATE TRIGGER tr_update_stock_on_movement
AFTER INSERT ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION public.handle_stock_update();

-- 12. Storage Policies for 'productos' bucket
-- (Note: Bucket must be created manually in Supabase Dashboard first with public access)

-- Allow public read access to the 'productos' bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'productos' );

-- Allow authenticated users to upload and manage their own files
-- Requirement: Files should be stored in a folder named after their tenant_id
CREATE POLICY "Tenant Image Management"
ON storage.objects FOR ALL
TO authenticated
USING ( 
    bucket_id = 'productos' AND 
    (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
)
WITH CHECK (
    bucket_id = 'productos' AND 
    (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
);
