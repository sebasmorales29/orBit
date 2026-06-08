export default function DisabledPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-16">
      <div className="w-full space-y-3 rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">Cuenta desactivada</h1>
        <p className="text-[14px] leading-relaxed text-muted">
          Esta cuenta está desactivada y no puede acceder a Velum por el momento. Si creés que es un
          error, contactá al administrador de la plataforma.
        </p>
      </div>
    </div>
  )
}

