'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CrudList } from '@/components/configuracoes/CrudList'

async function checkDiagnosticoDeps(id: string): Promise<boolean> {
  const { count } = await createClient()
    .from('acompanhamentos')
    .select('*', { count: 'exact', head: true })
    .eq('diagnostico_id', id)
  return (count ?? 0) > 0
}

async function checkEventoDeps(id: string): Promise<boolean> {
  const { count } = await createClient()
    .from('acompanhamento_eventos')
    .select('*', { count: 'exact', head: true })
    .eq('evento_id', id)
  return (count ?? 0) > 0
}

export default function ConfiguracoesPage() {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenhaUsuario, setNovaSenhaUsuario] = useState('')
  const [confirmarSenhaUsuario, setConfirmarSenhaUsuario] = useState('')
  const [loadingUsuario, setLoadingUsuario] = useState(false)
  const [erroUsuario, setErroUsuario] = useState<string | null>(null)
  const [sucessoUsuario, setSucessoUsuario] = useState(false)

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
    const { error } = await createClient().auth.updateUser({ password: novaSenha })
    setLoading(false)

    if (error) {
      setErro('Erro ao atualizar a senha. Tente novamente.')
      return
    }

    setSucesso(true)
    setNovaSenha('')
    setConfirmarSenha('')
  }

  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault()
    setErroUsuario(null)
    setSucessoUsuario(false)

    if (novaSenhaUsuario.length < 6) {
      setErroUsuario('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenhaUsuario !== confirmarSenhaUsuario) {
      setErroUsuario('As senhas não coincidem.')
      return
    }

    setLoadingUsuario(true)
    try {
      const { data, error } = await createClient().functions.invoke('criar-usuario', {
        body: { email: novoEmail, password: novaSenhaUsuario },
      })
      if (error || data?.error) {
        setErroUsuario(data?.error ?? 'Erro ao criar usuário.')
        return
      }
      setSucessoUsuario(true)
      setNovoEmail('')
      setNovaSenhaUsuario('')
      setConfirmarSenhaUsuario('')
    } finally {
      setLoadingUsuario(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-lg font-semibold text-slate-800">Configurações</h1>

      {/* Alterar senha */}
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
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {sucesso && <p className="text-sm text-green-600">Senha alterada com sucesso.</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </div>

      {/* Criar novo usuário */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Criar novo usuário</h2>
        <form onSubmit={handleCriarUsuario} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="novo-email">E-mail</Label>
            <Input
              id="novo-email"
              type="email"
              value={novoEmail}
              onChange={e => setNovoEmail(e.target.value)}
              placeholder="usuario@email.com"
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nova-senha-usuario">Senha</Label>
            <Input
              id="nova-senha-usuario"
              type="password"
              value={novaSenhaUsuario}
              onChange={e => setNovaSenhaUsuario(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmar-senha-usuario">Confirmar senha</Label>
            <Input
              id="confirmar-senha-usuario"
              type="password"
              value={confirmarSenhaUsuario}
              onChange={e => setConfirmarSenhaUsuario(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </div>
          {erroUsuario && <p className="text-sm text-red-600">{erroUsuario}</p>}
          {sucessoUsuario && <p className="text-sm text-green-600">Usuário criado com sucesso.</p>}
          <Button type="submit" disabled={loadingUsuario} className="w-full">
            {loadingUsuario ? 'Criando...' : 'Criar usuário'}
          </Button>
        </form>
      </div>

      {/* Diagnósticos e Eventos lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CrudList
          title="Diagnósticos"
          tableName="diagnosticos"
          checkDependencies={checkDiagnosticoDeps}
          dependencyMessage="Há acompanhamentos vinculados a este diagnóstico. Altere-os antes de excluir."
        />
        <CrudList
          title="Eventos não esperados"
          tableName="eventos_nao_esperados"
          checkDependencies={checkEventoDeps}
          dependencyMessage="Há acompanhamentos vinculados a este evento. Altere-os antes de excluir."
        />
      </div>
    </div>
  )
}
