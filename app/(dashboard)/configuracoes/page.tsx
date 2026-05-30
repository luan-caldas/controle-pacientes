'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ConfiguracoesPage() {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(false)

    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setLoading(false)

    if (error) {
      setErro('Erro ao atualizar a senha. Tente novamente.')
      return
    }

    setSucesso(true)
    setNovaSenha('')
    setConfirmarSenha('')
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-lg font-semibold text-slate-800">Configurações</h1>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Alterar senha</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nova-senha">Nova senha</Label>
            <Input
              id="nova-senha"
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
            <Input
              id="confirmar-senha"
              type="password"
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600">{erro}</p>
          )}

          {sucesso && (
            <p className="text-sm text-green-600">Senha alterada com sucesso.</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
