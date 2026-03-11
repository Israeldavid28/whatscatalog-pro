import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">
          WhatsCatalog Pro
        </h1>
        <p className="text-muted-foreground text-center max-w-sm">
          La forma más fácil de vender por WhatsApp con un catálogo profesional.
        </p>
      </div>
      <LoginForm />
      <div className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <a href="/register" className="font-medium text-primary hover:underline">
          Regístrate ahora
        </a>
      </div>
    </div>
  )
}
