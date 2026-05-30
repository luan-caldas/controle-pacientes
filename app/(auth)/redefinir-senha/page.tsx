'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RedefinirSenhaPage() {
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setInitError('Link inválido ou expirado. Solicite um novo link de redefinição.')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setInitError('Link inválido ou expirado. Solicite um novo link de redefinição.')
      } else {
        setReady(true)
      }
    })
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setLoading(false)

    if (error) {
      setError('Erro ao redefinir a senha. Tente novamente.')
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">Nova senha</CardTitle>
          <CardDescription className="text-center">
            {success
              ? 'Senha alterada com sucesso'
              : 'Escolha uma nova senha para sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-sm text-slate-600 text-center">
              Sua senha foi redefinida. Você será redirecionado para o login em instantes...
            </p>
          ) : initError ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-red-600">{initError}</p>
              <a
                href="/esqueceu-senha"
                className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-4"
              >
                Solicitar novo link
              </a>
            </div>
          ) : !ready ? (
            <p className="text-sm text-slate-500 text-center py-2">Validando link...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nova-senha">Nova senha</Label>
                <Input
                  id="nova-senha"
                  type="password"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar senha</Label>
                <Input
                  id="confirmar"
                  type="password"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
