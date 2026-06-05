interface OpsSchemaNoticeProps {
  missingColumns: string[]
  sqlFix: string
}

export function OpsSchemaNotice({ missingColumns, sqlFix }: OpsSchemaNoticeProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
      <h1 className="text-lg font-semibold text-foreground">Migración de base de datos pendiente</h1>
      <p className="text-[14px] text-muted">
        La consola CEO necesita columnas que aún no existen en Supabase. Faltan:{' '}
        <strong className="text-foreground">{missingColumns.join(', ')}</strong>
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-[13px] text-muted">
        <li>Abrí Supabase → SQL Editor</li>
        <li>Pegá y ejecutá el script de abajo</li>
        <li>Recargá esta página</li>
      </ol>
      <pre className="max-h-80 overflow-auto rounded-xl bg-surface-raised p-4 text-[11px] leading-relaxed text-foreground">
        {sqlFix}
      </pre>
    </div>
  )
}
