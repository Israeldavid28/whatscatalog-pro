"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Zap, MessageSquare, ShieldCheck, ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LandingPageContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")

  async function handleStart() {
    if (!email) return
    router.push(`/auth/register?email=${email}`)
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
           </div>
        </section>

        {/* Features etc (Simplified for brevity in the component, but can be same as before) */}
        <section id="features" className="py-24 bg-slate-50">
           <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-8">
                 <div className="bg-white p-8 rounded-2xl border">
                    <Zap className="h-6 w-6 text-yellow-500 mb-4" />
                    <h3 className="font-bold mb-2">Catálogo Veloz</h3>
                    <p className="text-slate-600">Carga instantánea en móviles.</p>
                 </div>
                 <div className="bg-white p-8 rounded-2xl border">
                    <MessageSquare className="h-6 w-6 text-green-500 mb-4" />
                    <h3 className="font-bold mb-2">Pedidos a WhatsApp</h3>
                    <p className="text-slate-600">Recibe pedidos organizados.</p>
                 </div>
                 <div className="bg-white p-8 rounded-2xl border">
                    <ShieldCheck className="h-6 w-6 text-blue-500 mb-4" />
                    <h3 className="font-bold mb-2">Gestión de Inventario</h3>
                    <p className="text-slate-600">Control total de stock y precios.</p>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-white py-12 text-center">
         <p>© 2024 WhatsCatalog. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
