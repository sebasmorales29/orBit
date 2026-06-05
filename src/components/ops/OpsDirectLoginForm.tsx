'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/toast'

interface OpsDirectLoginFormProps {
  onSuccess: () => void
}

export function OpsDirectLoginForm({ onSuccess }: OpsDirectLoginFormProps) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      await supabase.auth.getSession()
      setLoading(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4">
      <p className="text-[13px] font-medium text-foreground">Iniciar sesión acá</p>
      <Input
        label="Correo"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" className="w-full" loading={loading}>
        Entrar a Ops
      </Button>
    </form>
  )
}
