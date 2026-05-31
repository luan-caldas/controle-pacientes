'use client'

import { useState, useEffect } from 'react'
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

type UsuarioAutorizado = { user_id: string; email: string | null; created_at: string }

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

  const [usuarios, setUsuarios] = useState<UsuarioAutorizado[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<string | null>(null)
  const [erroRemover, setErroRemover] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
      setCurrentUserEmail(data.user?.email ?? null)
    })
    loadUsuariosAutorizados()
  }, [])

  async function loadUsuariosAutorizados() {
    setLoadingUsuarios(true)
    const { data } = await createClient()
      .from('authorized_users')
      .select('user_id, email, created_at')
      .order('created_at', { ascending: true })
    setLoadingUsuarios(false)
    setUsuarios(data ?? [])
  }

  async function handleRemoverUsuario(userId: string) {
    setErroRemover(null)
    setRemovendo(userId)
    const { error } = await createClient()
      .from('authorized_users')
      .delete()
      .eq('user_id', userId)
    setRemovendo(null)
    if (error) {
      setErroRemover('Erro ao remover acesso. Tente novamente.')
      return
    }
    setUsuarios(prev => prev.filter(u => u.user_id !== userId))
  }

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
      loadUsuariosAutorizados()
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

      {/* Usuários autorizados */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Usuários autorizados</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadUsuariosAutorizados}
            disabled={loadingUsuarios}
            className="text-slate-500"
          >
            Atualizar
          </Button>
        </div>
        {loadingUsuarios && usuarios.length === 0 ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum usuário autorizado encontrado.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {usuarios.map(u => (
              <div key={u.user_id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 truncate">
                    {u.email ?? (u.user_id === currentUserId ? currentUserEmail : u.user_id)}
                  </p>
                  {u.user_id === currentUserId && (
                    <p className="text-xs text-slate-400">você</p>
                  )}
                </div>
                {u.user_id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 ml-4"
                    disabled={removendo === u.user_id}
                    onClick={() => handleRemoverUsuario(u.user_id)}
                  >
                    {removendo === u.user_id ? 'Removendo...' : 'Remover acesso'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        {erroRemover && <p className="text-sm text-red-600">{erroRemover}</p>}
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
