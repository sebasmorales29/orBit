import { BrandLogo } from '@/components/brand/BrandLogo'

export default function OpsEntryIndexPage() {
  return (
    <div className="min-h-dvh bg-page px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-surface/90 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size={40} />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-accent">orBit Ops</p>
              <p className="text-[14px] font-semibold text-foreground">Acceso privado</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold text-foreground">Enlace incompleto</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            La URL de entrada debe incluir tu token privado al final. Sin él, Ops no puede validar tu acceso.
          </p>

          <p className="mt-4 text-[13px] font-medium text-foreground">Formato correcto:</p>
          <p className="mt-2 rounded-xl border border-border bg-surface-raised px-3 py-2 font-mono text-[12px] text-foreground">
            /ops/entry/TU_TOKEN
          </p>

          <p className="mt-4 text-[13px] text-muted">
            Pedile el enlace completo al administrador de orBit o copiá el valor de{' '}
            <code className="text-[12px] text-foreground">ORBIT_OPS_ENTRY_TOKEN</code> en Vercel y armá la URL
            manualmente.
          </p>

          <p className="mt-4 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] text-muted">
            Si ya abriste el enlace correcto y ves la pantalla de MFA en{' '}
            <code className="text-foreground">/ops/login</code>, eso es normal: ingresá el código de tu autenticador
            para entrar a Operaciones.
          </p>
        </div>
      </div>
    </div>
  )
}
