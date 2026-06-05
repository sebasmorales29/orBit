export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </p>
  )
}
