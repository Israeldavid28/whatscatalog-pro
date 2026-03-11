"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ArrowLeftRight, 
  Settings, 
  ExternalLink 
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Productos", href: "/admin/productos", icon: Package },
  { name: "Categorías", href: "/admin/categorias", icon: Tags },
  { name: "Inventario", href: "/admin/movimientos", icon: ArrowLeftRight },
  { name: "Configuración", href: "/admin/configuracion", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const profile = useAuthStore((state) => state.profile)

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
          <span>WhatsCatalog</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button asChild variant="outline" className="w-full justify-start" disabled={!profile?.tenant_slug}>
          <Link href={profile?.tenant_slug ? `/${profile.tenant_slug}` : "#"} target="_blank">
            <ExternalLink className="mr-3 h-5 w-5" />
            Ver Catálogo
          </Link>
        </Button>
      </div>
    </div>
  )
}

import { Button } from "@/components/ui/button"
