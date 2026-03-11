"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Zap, MessageSquare, ShieldCheck, ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")

  async function handleStart() {
    if (!email) return
    router.push(`/auth/register?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="bg-primary h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold">W</div>
               <span className="font-bold text-xl tracking-tight">WhatsCatalog</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
               <a href="#features" className="hover:text-primary transition">Características</a>
               <a href="#pricing" className="hover:text-primary transition">Precios</a>
               <a href="/login" className="hover:text-primary transition">Iniciar Sesión</a>
               <Button onClick={() => router.push('/auth/register')}>Crear Catálogo</Button>
            </nav>
         </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-4 pt-16 pb-24 md:pt-32 md:pb-40 text-center relative overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10 rounded-full blur-3xl opacity-50" />
           
           <div className="max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
                 🚀 El futuro de las ventas por WhatsApp
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
                 Convierte tu <span className="text-primary">WhatsApp</span> en una máquina de ventas
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                 Crea un catálogo digital profesional en minutos, recibe pedidos organizados directamente en tu WhatsApp y gestiona todo desde un solo lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                 <Input 
                   type="email" 
                   placeholder="tu@email.com" 
                   className="h-12 text-lg" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                 />
                 <Button size="lg" className="w-full sm:w-auto h-12 gap-2 text-lg px-8" onClick={handleStart}>
                    Empezar Gratis <ArrowRight className="h-5 w-5" />
                 </Button>
              </div>
              
              <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale hover:grayscale-0 transition duration-500">
                 {/* Proof of partners or just logos */}
                 <div className="font-bold text-2xl">Boutique</div>
                 <div className="font-bold text-2xl">Foodie</div>
                 <div className="font-bold text-2xl">TechStore</div>
                 <div className="font-bold text-2xl">SpaCenter</div>
              </div>
           </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-slate-50">
           <div className="max-w-7xl mx-auto px-4">
              <div className="text-center space-y-4 mb-16">
                 <h2 className="text-3xl font-bold">Todo lo que necesitas para vender más</h2>
                 <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                    Diseñado para ser simple, rápido y efectivo. Olvídate de los PDFs pesados y los chats desordenados.
                 </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 <FeatureCard 
                   icon={<Zap className="h-6 w-6 text-yellow-500" />}
                   title="Catálogo Veloz"
                   description="Carga instantánea en móviles. Tus clientes podrán navegar por tus productos sin esperas."
                 />
                 <FeatureCard 
                   icon={<MessageSquare className="h-6 w-6 text-green-500" />}
                   title="Pedidos a WhatsApp"
                   description="Recibe el pedido listo con el nombre del cliente, dirección y lista de productos para confirmar."
                 />
                 <FeatureCard 
                   icon={<ShieldCheck className="h-6 w-6 text-blue-500" />}
                   title="Gestión de Inventario"
                   description="Controla tu stock, categorías y precios desde un panel de administración intuitivo."
                 />
              </div>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
         <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
               <div className="bg-white text-slate-900 h-8 w-8 rounded-lg flex items-center justify-center font-bold">W</div>
               <span className="font-bold text-xl tracking-tight">WhatsCatalog</span>
            </div>
            <p className="text-slate-400 text-sm">© 2024 WhatsCatalog. Todos los derechos reservados.</p>
            <div className="flex gap-6 text-slate-400 text-sm">
               <a href="#">Privacidad</a>
               <a href="#">Términos</a>
               <a href="#">Contacto</a>
            </div>
         </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
   return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
         <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            {icon}
         </div>
         <h3 className="text-xl font-bold mb-3">{title}</h3>
         <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
   )
}
