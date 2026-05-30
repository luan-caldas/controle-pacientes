'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/redefinir-senha`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    setLoading(false)
    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">Redefinir senha</CardTitle>
          <CardDescription className="text-center">
            {sent
              ? 'Verifique seu e-mail'
              : 'Informe seu e-mail para receber o link de redefinição'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-600">
                Enviamos um link de redefinição para <strong>{email}</strong>. Clique no link para criar uma nova senha.
              </p>
              <a
                href="/login"
                className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-4"
              >
                Voltar ao login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link'}
              </Button>
              <div className="text-center">
                <a
                  href="/login"
                  className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-4"
                >
                  Voltar ao login
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
