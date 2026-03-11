import { supabase } from "./supabase";

export type EventType = 'vista_producto' | 'add_cart' | 'inicio_checkout' | 'pedido_whatsapp';

export async function trackEvent(tenantId: string, tipo: EventType, productoId?: string, metadata: any = {}) {
  try {
    // We use the browser client here. 
    // This is safe because RLS allows INSERT by anon for public events if we configure it.
    await supabase.from("eventos_catalogo").insert({
      tenant_id: tenantId,
      tipo_evento: tipo,
      producto_id: productoId,
      metadata
    });
  } catch (error) {
    console.error("Analytics Error:", error);
  }
}
