import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">
          Empoderamos tu Negocio
        </h1>
        <p className="text-muted-foreground max-w-sm">
          Únete a cientos de emprendedores que ya están digitalizando sus ventas.
        </p>
      </div>
      <RegisterForm />
      <div className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <a href="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </a>
      </div>
    </div>
  )
}
