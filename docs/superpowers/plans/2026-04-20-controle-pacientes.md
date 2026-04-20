# Sistema de Controle de Pacientes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack patient control system for an ambulatory clinic with auth, patient/follow-up CRUD, a call list, and a reporting dashboard.

**Architecture:** Client-side Next.js 14 (App Router) with Supabase JS (`@supabase/ssr`) for all data fetching and mutations. Route protection via Next.js middleware reading Supabase session cookies. Business logic calculations (age, active diagnosis, follow-up days) computed client-side in `lib/calculos.ts`. No RLS configured — to be done manually by the user after deploy.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Lucide React, Recharts, Supabase JS (`@supabase/ssr`), react-hook-form, zod, date-fns

---

## File Map

```
controle-pacientes/
├── app/
│   ├── globals.css
│   ├── layout.tsx                          (root layout)
│   ├── page.tsx                            (redirect to /pacientes)
│   ├── (auth)/
│   │   └── login/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx                      (sidebar + proteção)
│       ├── pacientes/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── acompanhamentos/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── ligacao/page.tsx
│       └── relatorios/page.tsx
├── components/
│   ├── ui/                                 (shadcn/ui — gerado automaticamente)
│   ├── pacientes/
│   │   ├── PacientesTable.tsx
│   │   ├── PacienteForm.tsx
│   │   └── NovoPacienteSheet.tsx
│   ├── acompanhamentos/
│   │   ├── AcompanhamentosTable.tsx
│   │   ├── AcompanhamentoForm.tsx
│   │   ├── DiagnosticoCombobox.tsx
│   │   └── EventosMultiSelect.tsx
│   └── relatorios/
│       ├── ChartCard.tsx
│       ├── PeriodFilter.tsx
│       ├── GraficoGenero.tsx
│       ├── GraficoDiagnosticos.tsx
│       ├── GraficoTempoAlta.tsx
│       ├── GraficoRecidiva.tsx
│       ├── GraficoViaSisreg.tsx
│       ├── GraficoMelhora60Dias.tsx
│       └── GraficoEventos.tsx
├── lib/
│   ├── supabase/
│   │   └── client.ts
│   ├── utils.ts                            (shadcn cn helper)
│   └── calculos.ts                         (funções de cálculo de domínio)
├── middleware.ts
├── types/
│   └── index.ts
├── __tests__/
│   └── calculos.test.ts
├── .env.local
└── jest.config.js / jest.setup.ts
```

---

## Task 1: Scaffold do Projeto Next.js e Dependências

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `.env.local`
- Create: `jest.config.js`
- Create: `jest.setup.ts`

- [ ] **Step 1: Inicializar o projeto Next.js no diretório atual**

Execute dentro de `c:\Users\luanp\OneDrive\Documentos\controle-pacientes\`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias="@/*" --yes
```

Responda sim para sobrescrever o diretório (ele já existe com `.mcp.json` e `.claude/`).

- [ ] **Step 2: Instalar dependências de runtime**

```bash
npm install @supabase/supabase-js @supabase/ssr recharts react-hook-form zod @hookform/resolvers date-fns lucide-react
```

- [ ] **Step 3: Instalar dependências de desenvolvimento para testes**

```bash
npm install --save-dev jest jest-environment-jsdom @types/jest ts-jest
```

- [ ] **Step 4: Inicializar shadcn/ui**

```bash
npx shadcn@latest init --defaults
```

Quando perguntado pelo estilo, escolha: **Default**. Base color: **Slate**.

- [ ] **Step 5: Instalar componentes shadcn/ui necessários**

```bash
npx shadcn@latest add button input label card table sheet dialog badge select command popover checkbox separator scroll-area
```

- [ ] **Step 6: Criar arquivo de configuração do Jest**

Crie `jest.config.js`:

```js
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })
module.exports = createJestConfig({
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
})
```

Crie `jest.setup.ts`:

```ts
// vazio por enquanto
```

- [ ] **Step 7: Criar `.env.local` com as variáveis do Supabase**

```bash
# No próximo task (Task 2), você obterá os valores reais via MCP.
# Por ora, crie o arquivo com placeholders:
```

Crie `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=PREENCHER_APOS_TASK2
NEXT_PUBLIC_SUPABASE_ANON_KEY=PREENCHER_APOS_TASK2
```

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Banco de Dados no Supabase via MCP

**Files:** Nenhum arquivo local — alterações no Supabase via MCP.

- [ ] **Step 1: Listar projetos Supabase disponíveis via MCP**

Use a ferramenta MCP `mcp__supabase__list_projects` para identificar o ID do projeto existente.

- [ ] **Step 2: Obter URL e chave anon do projeto**

Use `mcp__supabase__get_project_url` e `mcp__supabase__get_publishable_keys` com o `project_id` do step anterior. Copie os valores para `.env.local`.

- [ ] **Step 3: Criar tabela `diagnosticos`**

Use `mcp__supabase__execute_sql` com o SQL:

```sql
CREATE TABLE IF NOT EXISTS diagnosticos (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE
);
```

- [ ] **Step 4: Criar tabela `eventos_nao_esperados`**

```sql
CREATE TABLE IF NOT EXISTS eventos_nao_esperados (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE
);
```

- [ ] **Step 5: Criar tabela `pacientes`**

```sql
CREATE TABLE IF NOT EXISTS pacientes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  data_nascimento date NOT NULL,
  numero_ses      text NOT NULL,
  telefone        text NOT NULL,
  genero          text NOT NULL CHECK (genero IN ('Masculino', 'Feminino')),
  observacoes     text,
  created_at      timestamptz DEFAULT now()
);
```

- [ ] **Step 6: Criar tabela `acompanhamentos`**

```sql
CREATE TABLE IF NOT EXISTS acompanhamentos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id    uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  diagnostico_id uuid NOT NULL REFERENCES diagnosticos(id),
  via_sisreg     boolean NOT NULL DEFAULT false,
  data_admissao  date NOT NULL,
  data_alta      date,
  recidiva       boolean NOT NULL DEFAULT false,
  observacao     text,
  created_at     timestamptz DEFAULT now()
);
```

- [ ] **Step 7: Criar tabela de junção `acompanhamento_eventos`**

```sql
CREATE TABLE IF NOT EXISTS acompanhamento_eventos (
  acompanhamento_id uuid NOT NULL REFERENCES acompanhamentos(id) ON DELETE CASCADE,
  evento_id         uuid NOT NULL REFERENCES eventos_nao_esperados(id) ON DELETE CASCADE,
  PRIMARY KEY (acompanhamento_id, evento_id)
);
```

- [ ] **Step 8: Verificar as tabelas criadas**

Use `mcp__supabase__list_tables` para confirmar que as 5 tabelas existem.

- [ ] **Step 9: Commit**

```bash
git add .env.local
git commit -m "chore: configure Supabase credentials and create DB schema"
```

---

## Task 3: Cliente Supabase e Tipos TypeScript

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `types/index.ts`

- [ ] **Step 1: Criar o cliente Supabase para o browser**

Crie `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Criar os tipos TypeScript do domínio**

Crie `types/index.ts`:

```typescript
export type Genero = 'Masculino' | 'Feminino'

export interface Paciente {
  id: string
  nome: string
  data_nascimento: string
  numero_ses: string
  telefone: string
  genero: Genero
  observacoes: string | null
  created_at: string
}

export interface Diagnostico {
  id: string
  nome: string
}

export interface EventoNaoEsperado {
  id: string
  nome: string
}

export interface Acompanhamento {
  id: string
  paciente_id: string
  diagnostico_id: string
  via_sisreg: boolean
  data_admissao: string
  data_alta: string | null
  recidiva: boolean
  observacao: string | null
  created_at: string
  paciente?: Paciente
  diagnostico?: Diagnostico
  eventos?: EventoNaoEsperado[]
}

export interface PeriodFilter {
  from: string | null
  to: string | null
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/ types/
git commit -m "feat: add Supabase client and TypeScript types"
```

---

## Task 4: Funções de Cálculo (TDD)

**Files:**
- Create: `lib/calculos.ts`
- Create: `__tests__/calculos.test.ts`

- [ ] **Step 1: Escrever os testes que devem falhar**

Crie `__tests__/calculos.test.ts`:

```typescript
import {
  calcularIdade,
  calcularDiasAcompanhamento,
  isAtivo,
  getDiagnosticoAtivo,
  getFaixaMeses,
  formatarDataBR,
} from '@/lib/calculos'
import { Acompanhamento } from '@/types'

describe('calcularIdade', () => {
  it('retorna a idade correta em anos', () => {
    const nascimento = '1990-04-20'
    const hoje = new Date('2026-04-20')
    expect(calcularIdade(nascimento, hoje)).toBe(36)
  })

  it('não conta o aniversário antes de passar', () => {
    const nascimento = '1990-04-21'
    const hoje = new Date('2026-04-20')
    expect(calcularIdade(nascimento, hoje)).toBe(35)
  })
})

describe('calcularDiasAcompanhamento', () => {
  it('retorna dias entre admissão e alta', () => {
    expect(calcularDiasAcompanhamento('2026-01-01', '2026-02-01')).toBe(31)
  })

  it('usa a data de referência quando data_alta é null', () => {
    const ref = new Date('2026-02-01')
    expect(calcularDiasAcompanhamento('2026-01-01', null, ref)).toBe(31)
  })
})

describe('isAtivo', () => {
  it('retorna true quando data_alta é null', () => {
    expect(isAtivo(null)).toBe(true)
  })

  it('retorna false quando data_alta está preenchida', () => {
    expect(isAtivo('2026-01-01')).toBe(false)
  })
})

describe('getDiagnosticoAtivo', () => {
  it('retorna o nome do diagnóstico do acompanhamento ativo mais recente', () => {
    const acompanhamentos: Partial<Acompanhamento>[] = [
      {
        data_alta: '2025-01-01',
        created_at: '2024-01-01T00:00:00Z',
        diagnostico: { id: '1', nome: 'Diagnóstico Antigo' },
      },
      {
        data_alta: null,
        created_at: '2025-06-01T00:00:00Z',
        diagnostico: { id: '2', nome: 'Diagnóstico Ativo' },
      },
    ]
    expect(getDiagnosticoAtivo(acompanhamentos as Acompanhamento[])).toBe('Diagnóstico Ativo')
  })

  it('retorna null quando não há acompanhamento ativo', () => {
    const acompanhamentos: Partial<Acompanhamento>[] = [
      {
        data_alta: '2025-01-01',
        created_at: '2024-01-01T00:00:00Z',
        diagnostico: { id: '1', nome: 'Diagnóstico' },
      },
    ]
    expect(getDiagnosticoAtivo(acompanhamentos as Acompanhamento[])).toBeNull()
  })
})

describe('getFaixaMeses', () => {
  it('1-3 meses', () => expect(getFaixaMeses(2)).toBe('1-3 meses'))
  it('4-6 meses', () => expect(getFaixaMeses(5)).toBe('4-6 meses'))
  it('7-9 meses', () => expect(getFaixaMeses(8)).toBe('7-9 meses'))
  it('10-12 meses', () => expect(getFaixaMeses(11)).toBe('10-12 meses'))
  it('+12 meses', () => expect(getFaixaMeses(13)).toBe('+12 meses'))
})

describe('formatarDataBR', () => {
  it('formata data ISO para dd/mm/aaaa', () => {
    expect(formatarDataBR('2026-04-20')).toBe('20/04/2026')
  })
})
```

- [ ] **Step 2: Executar testes para confirmar falha**

```bash
npx jest __tests__/calculos.test.ts
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `lib/calculos.ts`**

```typescript
import { differenceInDays, differenceInMonths, differenceInYears, parseISO } from 'date-fns'
import { Acompanhamento } from '@/types'

export function calcularIdade(dataNascimento: string, hoje = new Date()): number {
  return differenceInYears(hoje, parseISO(dataNascimento))
}

export function calcularDiasAcompanhamento(
  dataAdmissao: string,
  dataAlta: string | null,
  hoje = new Date()
): number {
  const fim = dataAlta ? parseISO(dataAlta) : hoje
  return differenceInDays(fim, parseISO(dataAdmissao))
}

export function isAtivo(dataAlta: string | null): boolean {
  return dataAlta === null
}

export function getDiagnosticoAtivo(acompanhamentos: Acompanhamento[]): string | null {
  const ativos = acompanhamentos
    .filter(a => a.data_alta === null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return ativos[0]?.diagnostico?.nome ?? null
}

export function calcularMeses(dataAdmissao: string, dataAlta: string): number {
  return differenceInMonths(parseISO(dataAlta), parseISO(dataAdmissao))
}

export function getFaixaMeses(meses: number): string {
  if (meses <= 3) return '1-3 meses'
  if (meses <= 6) return '4-6 meses'
  if (meses <= 9) return '7-9 meses'
  if (meses <= 12) return '10-12 meses'
  return '+12 meses'
}

export function formatarDataBR(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}
```

- [ ] **Step 4: Executar testes para confirmar aprovação**

```bash
npx jest __tests__/calculos.test.ts
```

Esperado: PASS — todos os testes verdes.

- [ ] **Step 5: Commit**

```bash
git add lib/calculos.ts __tests__/calculos.test.ts
git commit -m "feat: add domain calculation functions with tests"
```

---

## Task 5: Middleware de Proteção de Rotas e Root Page

**Files:**
- Create: `middleware.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Criar o middleware do Next.js**

Crie `middleware.ts` na raiz do projeto:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const isLoginRoute = pathname === '/login'
  const isProtected = !isLoginRoute && pathname !== '/'

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/pacientes'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Atualizar a root page para redirecionar**

Substitua o conteúdo de `app/page.tsx`:

```typescript
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/pacientes')
}
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts app/page.tsx
git commit -m "feat: add route protection middleware"
```

---

## Task 6: Página de Login

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Modify: `app/layout.tsx` (metadata)

- [ ] **Step 1: Criar a página de login**

Crie `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/pacientes')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">Controle de Pacientes</CardTitle>
          <CardDescription className="text-center">Acesso restrito a usuários autorizados</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar metadata no root layout**

Em `app/layout.tsx`, atualize apenas o objeto `metadata`:

```typescript
export const metadata: Metadata = {
  title: 'Controle de Pacientes',
  description: 'Sistema de controle ambulatorial',
}
```

- [ ] **Step 3: Commit**

```bash
git add app/
git commit -m "feat: add login page"
```

---

## Task 7: Layout do Dashboard com Sidebar

**Files:**
- Create: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Criar o layout com sidebar**

Crie `app/(dashboard)/layout.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, ClipboardList, Phone, BarChart3, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/acompanhamentos', label: 'Acompanhamentos', icon: ClipboardList },
  { href: '/ligacao', label: 'Ligação', icon: Phone },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden">
        <div className="px-4 py-4 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700 leading-tight">
            Controle de Pacientes
          </span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-2 border-t border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-slate-500 hover:text-slate-800"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(dashboard\)/
git commit -m "feat: add dashboard layout with sidebar"
```

---

## Task 8: Tela de Pacientes — Listagem e Cadastro

**Files:**
- Create: `app/(dashboard)/pacientes/page.tsx`
- Create: `components/pacientes/PacientesTable.tsx`
- Create: `components/pacientes/NovoPacienteSheet.tsx`
- Create: `components/pacientes/PacienteForm.tsx`

- [ ] **Step 1: Criar o formulário de paciente (usado em criar e editar)**

Crie `components/pacientes/PacienteForm.tsx`:

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Paciente } from '@/types'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  numero_ses: z.string().min(1, 'Número SES é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  genero: z.enum(['Masculino', 'Feminino'], { required_error: 'Gênero é obrigatório' }),
  observacoes: z.string().optional(),
})

export type PacienteFormData = z.infer<typeof schema>

interface PacienteFormProps {
  defaultValues?: Partial<PacienteFormData>
  onSubmit: (data: PacienteFormData) => Promise<void>
  submitLabel: string
}

export function PacienteForm({ defaultValues, onSubmit, submitLabel }: PacienteFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PacienteFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" {...register('nome')} />
        {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="data_nascimento">Data de nascimento</Label>
        <Input id="data_nascimento" type="date" {...register('data_nascimento')} />
        {errors.data_nascimento && <p className="text-xs text-red-500">{errors.data_nascimento.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="numero_ses">Número SES</Label>
        <Input id="numero_ses" {...register('numero_ses')} />
        {errors.numero_ses && <p className="text-xs text-red-500">{errors.numero_ses.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telefone">Telefone</Label>
        <Input id="telefone" {...register('telefone')} placeholder="(00) 00000-0000" />
        {errors.telefone && <p className="text-xs text-red-500">{errors.telefone.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Gênero</Label>
        <Select
          value={watch('genero')}
          onValueChange={v => setValue('genero', v as 'Masculino' | 'Feminino', { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Masculino">Masculino</SelectItem>
            <SelectItem value="Feminino">Feminino</SelectItem>
          </SelectContent>
        </Select>
        {errors.genero && <p className="text-xs text-red-500">{errors.genero.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações</Label>
        <Input id="observacoes" {...register('observacoes')} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Criar o Sheet de novo paciente**

Crie `components/pacientes/NovoPacienteSheet.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { PacienteForm, PacienteFormData } from './PacienteForm'

interface NovoPacienteSheetProps {
  onSuccess: () => void
}

export function NovoPacienteSheet({ onSuccess }: NovoPacienteSheetProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(data: PacienteFormData) {
    const supabase = createClient()
    const { error } = await supabase.from('pacientes').insert(data)
    if (!error) {
      setOpen(false)
      onSuccess()
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={15} />
          Novo Paciente
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Paciente</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <PacienteForm onSubmit={handleSubmit} submitLabel="Cadastrar Paciente" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 3: Criar a tabela de pacientes**

Crie `components/pacientes/PacientesTable.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Paciente, Acompanhamento } from '@/types'
import { calcularIdade, getDiagnosticoAtivo } from '@/lib/calculos'

interface PacientesTableProps {
  pacientes: Paciente[]
  acompanhamentos: Acompanhamento[]
}

export function PacientesTable({ pacientes, acompanhamentos }: PacientesTableProps) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Gênero</TableHead>
          <TableHead>Idade</TableHead>
          <TableHead>Diagnóstico Ativo</TableHead>
          <TableHead>Nº SES</TableHead>
          <TableHead>Telefone</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pacientes.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-slate-500 py-8">
              Nenhum paciente cadastrado.
            </TableCell>
          </TableRow>
        )}
        {pacientes.map(paciente => {
          const acomps = acompanhamentos.filter(a => a.paciente_id === paciente.id)
          const diagnosticoAtivo = getDiagnosticoAtivo(acomps)
          const idade = calcularIdade(paciente.data_nascimento)

          return (
            <TableRow
              key={paciente.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => router.push(`/pacientes/${paciente.id}`)}
            >
              <TableCell className="font-medium">{paciente.nome}</TableCell>
              <TableCell>{paciente.genero}</TableCell>
              <TableCell>{idade} anos</TableCell>
              <TableCell>
                {diagnosticoAtivo
                  ? <Badge variant="outline">{diagnosticoAtivo}</Badge>
                  : <span className="text-slate-400 text-sm">—</span>
                }
              </TableCell>
              <TableCell>{paciente.numero_ses}</TableCell>
              <TableCell>{paciente.telefone}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 4: Criar a página de listagem de pacientes**

Crie `app/(dashboard)/pacientes/page.tsx`:

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Paciente, Acompanhamento } from '@/types'
import { PacientesTable } from '@/components/pacientes/PacientesTable'
import { NovoPacienteSheet } from '@/components/pacientes/NovoPacienteSheet'

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: pacs }, { data: acomps }] = await Promise.all([
      supabase.from('pacientes').select('*').order('nome'),
      supabase.from('acompanhamentos').select('*, diagnostico:diagnosticos(id, nome)'),
    ])
    setPacientes(pacs ?? [])
    setAcompanhamentos(acomps ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Pacientes</h1>
        <NovoPacienteSheet onSuccess={load} />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
        ) : (
          <PacientesTable pacientes={pacientes} acompanhamentos={acompanhamentos} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/ components/
git commit -m "feat: add patients listing page with create form"
```

---

## Task 9: Tela de Detalhe do Paciente

**Files:**
- Create: `app/(dashboard)/pacientes/[id]/page.tsx`

- [ ] **Step 1: Criar a página de detalhe do paciente**

Crie `app/(dashboard)/pacientes/[id]/page.tsx`:

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Paciente, Acompanhamento } from '@/types'
import { calcularIdade, getDiagnosticoAtivo, isAtivo, calcularDiasAcompanhamento, formatarDataBR } from '@/lib/calculos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PacienteForm, PacienteFormData } from '@/components/pacientes/PacienteForm'

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: pac }, { data: acomps }] = await Promise.all([
      supabase.from('pacientes').select('*').eq('id', id).single(),
      supabase
        .from('acompanhamentos')
        .select('*, diagnostico:diagnosticos(id, nome), eventos:acompanhamento_eventos(evento:eventos_nao_esperados(id, nome))')
        .eq('paciente_id', id)
        .order('data_admissao', { ascending: false }),
    ])
    setPaciente(pac)
    const normalized = (acomps ?? []).map((a: any) => ({
      ...a,
      eventos: a.eventos?.map((e: any) => e.evento) ?? [],
    }))
    setAcompanhamentos(normalized)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleEdit(data: PacienteFormData) {
    const supabase = createClient()
    await supabase.from('pacientes').update(data).eq('id', id)
    setEditOpen(false)
    load()
  }

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('pacientes').delete().eq('id', id)
    router.push('/pacientes')
  }

  if (loading) return <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
  if (!paciente) return <div className="py-12 text-center text-slate-500 text-sm">Paciente não encontrado.</div>

  const idade = calcularIdade(paciente.data_nascimento)
  const diagnosticoAtivo = getDiagnosticoAtivo(acompanhamentos)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/pacientes')} className="gap-2 text-slate-600">
          <ArrowLeft size={15} /> Pacientes
        </Button>
        <div className="flex gap-2">
          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil size={13} /> Editar
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader><SheetTitle>Editar Paciente</SheetTitle></SheetHeader>
              <div className="mt-6">
                <PacienteForm
                  defaultValues={{
                    nome: paciente.nome,
                    data_nascimento: paciente.data_nascimento,
                    numero_ses: paciente.numero_ses,
                    telefone: paciente.telefone,
                    genero: paciente.genero,
                    observacoes: paciente.observacoes ?? '',
                  }}
                  onSubmit={handleEdit}
                  submitLabel="Salvar Alterações"
                />
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 size={13} /> Excluir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir paciente?</DialogTitle>
                <DialogDescription>
                  Todos os acompanhamentos vinculados serão excluídos. Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-800">{paciente.nome}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Data de nascimento</span><p className="font-medium">{formatarDataBR(paciente.data_nascimento)}</p></div>
          <div><span className="text-slate-500">Idade</span><p className="font-medium">{idade} anos</p></div>
          <div><span className="text-slate-500">Gênero</span><p className="font-medium">{paciente.genero}</p></div>
          <div><span className="text-slate-500">Nº SES</span><p className="font-medium">{paciente.numero_ses}</p></div>
          <div><span className="text-slate-500">Telefone</span><p className="font-medium">{paciente.telefone}</p></div>
          <div><span className="text-slate-500">Diagnóstico ativo</span>
            <p className="font-medium">{diagnosticoAtivo ?? <span className="text-slate-400">—</span>}</p>
          </div>
          {paciente.observacoes && (
            <div className="col-span-2">
              <span className="text-slate-500">Observações</span>
              <p className="font-medium">{paciente.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Acompanhamentos</h2>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => router.push(`/acompanhamentos/novo?paciente_id=${id}`)}>
            <Plus size={13} /> Novo Acompanhamento
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Dias</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {acompanhamentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500 py-6 text-sm">
                  Nenhum acompanhamento registrado.
                </TableCell>
              </TableRow>
            )}
            {acompanhamentos.map(a => (
              <TableRow
                key={a.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => router.push(`/acompanhamentos/${a.id}`)}
              >
                <TableCell>{a.diagnostico?.nome}</TableCell>
                <TableCell>
                  {isAtivo(a.data_alta)
                    ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                    : <Badge variant="secondary">Alta</Badge>
                  }
                </TableCell>
                <TableCell>{formatarDataBR(a.data_admissao)}</TableCell>
                <TableCell>{calcularDiasAcompanhamento(a.data_admissao, a.data_alta)} dias</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(dashboard\)/pacientes/
git commit -m "feat: add patient detail page with edit and delete"
```

---

## Task 10: Comboboxes com Criar Inline

**Files:**
- Create: `components/acompanhamentos/DiagnosticoCombobox.tsx`
- Create: `components/acompanhamentos/EventosMultiSelect.tsx`

- [ ] **Step 1: Criar o DiagnosticoCombobox**

Crie `components/acompanhamentos/DiagnosticoCombobox.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { Diagnostico } from '@/types'

interface DiagnosticoComboboxProps {
  value: string | null
  onChange: (id: string) => void
}

export function DiagnosticoCombobox({ value, onChange }: DiagnosticoComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('diagnosticos').select('*').order('nome')
    if (data) setDiagnosticos(data)
  }

  useEffect(() => { load() }, [])

  const filtered = diagnosticos.filter(d =>
    d.nome.toLowerCase().includes(search.toLowerCase())
  )

  const showCreate = search.trim().length > 0 &&
    !filtered.some(d => d.nome.toLowerCase() === search.trim().toLowerCase())

  async function handleCreate() {
    const supabase = createClient()
    const { data } = await supabase
      .from('diagnosticos')
      .insert({ nome: search.trim() })
      .select()
      .single()
    if (data) {
      setDiagnosticos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      onChange(data.id)
      setOpen(false)
      setSearch('')
    }
  }

  const selected = diagnosticos.find(d => d.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {selected?.nome ?? 'Selecione um diagnóstico...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar diagnóstico..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {filtered.map(d => (
                <CommandItem
                  key={d.id}
                  value={d.nome}
                  onSelect={() => { onChange(d.id); setOpen(false); setSearch('') }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === d.id ? 'opacity-100' : 'opacity-0')} />
                  {d.nome}
                </CommandItem>
              ))}
              {showCreate && (
                <CommandItem value={`__criar__${search}`} onSelect={handleCreate} className="text-blue-600 font-medium">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar: {search.trim()}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Criar o EventosMultiSelect**

Crie `components/acompanhamentos/EventosMultiSelect.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { EventoNaoEsperado } from '@/types'

interface EventosMultiSelectProps {
  value: string[]
  onChange: (ids: string[]) => void
}

export function EventosMultiSelect({ value, onChange }: EventosMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [eventos, setEventos] = useState<EventoNaoEsperado[]>([])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('eventos_nao_esperados').select('*').order('nome')
    if (data) setEventos(data)
  }

  useEffect(() => { load() }, [])

  const filtered = eventos.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  )

  const showCreate = search.trim().length > 0 &&
    !filtered.some(e => e.nome.toLowerCase() === search.trim().toLowerCase())

  async function handleCreate() {
    const supabase = createClient()
    const { data } = await supabase
      .from('eventos_nao_esperados')
      .insert({ nome: search.trim() })
      .select()
      .single()
    if (data) {
      setEventos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      onChange([...value, data.id])
      setSearch('')
    }
  }

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  const selectedEventos = eventos.filter(e => value.includes(e.id))

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            {value.length === 0 ? 'Selecione eventos...' : `${value.length} evento(s) selecionado(s)`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Buscar evento..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {filtered.map(e => (
                  <CommandItem key={e.id} value={e.nome} onSelect={() => toggle(e.id)}>
                    <Check className={cn('mr-2 h-4 w-4', value.includes(e.id) ? 'opacity-100' : 'opacity-0')} />
                    {e.nome}
                  </CommandItem>
                ))}
                {showCreate && (
                  <CommandItem value={`__criar__${search}`} onSelect={handleCreate} className="text-blue-600 font-medium">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar: {search.trim()}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedEventos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedEventos.map(e => (
            <Badge key={e.id} variant="secondary" className="gap-1 pr-1">
              {e.nome}
              <button
                type="button"
                onClick={() => toggle(e.id)}
                className="ml-0.5 rounded hover:text-red-500"
              >
                <X size={11} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/acompanhamentos/DiagnosticoCombobox.tsx components/acompanhamentos/EventosMultiSelect.tsx
git commit -m "feat: add inline-create comboboxes for diagnóstico and eventos"
```

---

## Task 11: Formulário de Acompanhamento

**Files:**
- Create: `components/acompanhamentos/AcompanhamentoForm.tsx`

- [ ] **Step 1: Criar o formulário de acompanhamento**

Crie `components/acompanhamentos/AcompanhamentoForm.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DiagnosticoCombobox } from './DiagnosticoCombobox'
import { EventosMultiSelect } from './EventosMultiSelect'
import { createClient } from '@/lib/supabase/client'
import { Paciente } from '@/types'

const schema = z.object({
  paciente_id: z.string().uuid('Paciente é obrigatório'),
  diagnostico_id: z.string().uuid('Diagnóstico é obrigatório'),
  via_sisreg: z.boolean(),
  data_admissao: z.string().min(1, 'Data de admissão é obrigatória'),
  data_alta: z.string().nullable().optional(),
  recidiva: z.boolean(),
  eventos_ids: z.array(z.string().uuid()),
  observacao: z.string().optional(),
})

export type AcompanhamentoFormData = z.infer<typeof schema>

interface AcompanhamentoFormProps {
  defaultValues?: Partial<AcompanhamentoFormData>
  pacienteIdFixo?: string
  onSubmit: (data: AcompanhamentoFormData) => Promise<void>
  submitLabel: string
}

export function AcompanhamentoForm({ defaultValues, pacienteIdFixo, onSubmit, submitLabel }: AcompanhamentoFormProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<AcompanhamentoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      via_sisreg: false,
      recidiva: false,
      eventos_ids: [],
      ...defaultValues,
      ...(pacienteIdFixo ? { paciente_id: pacienteIdFixo } : {}),
    },
  })

  useEffect(() => {
    if (!pacienteIdFixo) {
      createClient().from('pacientes').select('id, nome').order('nome').then(({ data }) => {
        if (data) setPacientes(data as Paciente[])
      })
    }
  }, [pacienteIdFixo])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!pacienteIdFixo && (
        <div className="space-y-1.5">
          <Label>Paciente</Label>
          <Controller
            control={control}
            name="paciente_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.paciente_id && <p className="text-xs text-red-500">{errors.paciente_id.message}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Diagnóstico</Label>
        <Controller
          control={control}
          name="diagnostico_id"
          render={({ field }) => (
            <DiagnosticoCombobox value={field.value ?? null} onChange={field.onChange} />
          )}
        />
        {errors.diagnostico_id && <p className="text-xs text-red-500">{errors.diagnostico_id.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="data_admissao">Data de admissão</Label>
        <Input id="data_admissao" type="date" {...register('data_admissao')} />
        {errors.data_admissao && <p className="text-xs text-red-500">{errors.data_admissao.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="data_alta">Data de alta <span className="text-slate-400 font-normal">(opcional)</span></Label>
        <Input id="data_alta" type="date" {...register('data_alta')} />
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="via_sisreg"
          render={({ field }) => (
            <Checkbox id="via_sisreg" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="via_sisreg" className="cursor-pointer">Via SISREG</Label>
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="recidiva"
          render={({ field }) => (
            <Checkbox id="recidiva" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="recidiva" className="cursor-pointer">Recidiva</Label>
      </div>

      <div className="space-y-1.5">
        <Label>Eventos não esperados <span className="text-slate-400 font-normal">(opcional)</span></Label>
        <Controller
          control={control}
          name="eventos_ids"
          render={({ field }) => (
            <EventosMultiSelect value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacao">Observação <span className="text-slate-400 font-normal">(opcional)</span></Label>
        <Input id="observacao" {...register('observacao')} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/acompanhamentos/AcompanhamentoForm.tsx
git commit -m "feat: add follow-up form component"
```

---

## Task 12: Tela de Acompanhamentos — Listagem

**Files:**
- Create: `components/acompanhamentos/AcompanhamentosTable.tsx`
- Create: `app/(dashboard)/acompanhamentos/page.tsx`

- [ ] **Step 1: Criar a tabela de acompanhamentos**

Crie `components/acompanhamentos/AcompanhamentosTable.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Acompanhamento } from '@/types'
import { isAtivo, calcularDiasAcompanhamento, formatarDataBR } from '@/lib/calculos'

interface AcompanhamentosTableProps {
  acompanhamentos: Acompanhamento[]
}

export function AcompanhamentosTable({ acompanhamentos }: AcompanhamentosTableProps) {
  const router = useRouter()

  const sorted = [...acompanhamentos].sort((a, b) => {
    const ativoA = isAtivo(a.data_alta) ? 0 : 1
    const ativoB = isAtivo(b.data_alta) ? 0 : 1
    if (ativoA !== ativoB) return ativoA - ativoB
    return (a.paciente?.nome ?? '').localeCompare(b.paciente?.nome ?? '')
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Paciente</TableHead>
          <TableHead>Diagnóstico</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admissão</TableHead>
          <TableHead>Alta</TableHead>
          <TableHead>Dias</TableHead>
          <TableHead>SISREG</TableHead>
          <TableHead>Recidiva</TableHead>
          <TableHead>Eventos Não Esperados</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-slate-500 py-8">
              Nenhum acompanhamento cadastrado.
            </TableCell>
          </TableRow>
        )}
        {sorted.map(a => {
          const ativo = isAtivo(a.data_alta)
          return (
            <TableRow
              key={a.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => router.push(`/acompanhamentos/${a.id}`)}
            >
              <TableCell className="font-medium">{a.paciente?.nome}</TableCell>
              <TableCell>{a.diagnostico?.nome}</TableCell>
              <TableCell>
                {ativo
                  ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
                  : <Badge variant="secondary">Alta</Badge>
                }
              </TableCell>
              <TableCell>{formatarDataBR(a.data_admissao)}</TableCell>
              <TableCell>{a.data_alta ? formatarDataBR(a.data_alta) : '—'}</TableCell>
              <TableCell>{calcularDiasAcompanhamento(a.data_admissao, a.data_alta)} dias</TableCell>
              <TableCell>{a.via_sisreg ? 'Sim' : 'Não'}</TableCell>
              <TableCell>{a.recidiva ? 'Sim' : 'Não'}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {a.eventos?.map(e => e.nome).join(', ') || '—'}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 2: Criar a página de listagem de acompanhamentos**

Crie `app/(dashboard)/acompanhamentos/page.tsx`:

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Acompanhamento } from '@/types'
import { AcompanhamentosTable } from '@/components/acompanhamentos/AcompanhamentosTable'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { AcompanhamentoForm, AcompanhamentoFormData } from '@/components/acompanhamentos/AcompanhamentoForm'

export default function AcompanhamentosPage() {
  const [acompanhamentos, setAcompanhamentos] = useState<Acompanhamento[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('acompanhamentos')
      .select(`
        *,
        paciente:pacientes(id, nome),
        diagnostico:diagnosticos(id, nome),
        eventos:acompanhamento_eventos(evento:eventos_nao_esperados(id, nome))
      `)
    const normalized = (data ?? []).map((a: any) => ({
      ...a,
      eventos: a.eventos?.map((e: any) => e.evento) ?? [],
    }))
    setAcompanhamentos(normalized)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(data: AcompanhamentoFormData) {
    const supabase = createClient()
    const { eventos_ids, data_alta, ...rest } = data
    const { data: novo } = await supabase
      .from('acompanhamentos')
      .insert({ ...rest, data_alta: data_alta || null })
      .select()
      .single()

    if (novo && eventos_ids.length > 0) {
      await supabase.from('acompanhamento_eventos').insert(
        eventos_ids.map(evento_id => ({ acompanhamento_id: novo.id, evento_id }))
      )
    }

    setSheetOpen(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Acompanhamentos</h1>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={15} /> Novo Acompanhamento
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>Novo Acompanhamento</SheetTitle></SheetHeader>
            <div className="mt-6">
              <AcompanhamentoForm onSubmit={handleSubmit} submitLabel="Cadastrar" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
        ) : (
          <AcompanhamentosTable acompanhamentos={acompanhamentos} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/acompanhamentos/ components/acompanhamentos/AcompanhamentosTable.tsx
git commit -m "feat: add follow-up listing page"
```

---

## Task 13: Tela de Detalhe do Acompanhamento

**Files:**
- Create: `app/(dashboard)/acompanhamentos/[id]/page.tsx`
- Create: `app/(dashboard)/acompanhamentos/novo/page.tsx`

- [ ] **Step 1: Criar a página de novo acompanhamento (via URL com paciente_id)**

Crie `app/(dashboard)/acompanhamentos/novo/page.tsx`:

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { AcompanhamentoForm, AcompanhamentoFormData } from '@/components/acompanhamentos/AcompanhamentoForm'

function NovoAcompanhamentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pacienteId = searchParams.get('paciente_id')

  async function handleSubmit(data: AcompanhamentoFormData) {
    const supabase = createClient()
    const { eventos_ids, data_alta, ...rest } = data
    const { data: novo } = await supabase
      .from('acompanhamentos')
      .insert({ ...rest, data_alta: data_alta || null })
      .select()
      .single()

    if (novo && eventos_ids.length > 0) {
      await supabase.from('acompanhamento_eventos').insert(
        eventos_ids.map(evento_id => ({ acompanhamento_id: novo.id, evento_id }))
      )
    }

    if (pacienteId) {
      router.push(`/pacientes/${pacienteId}`)
    } else {
      router.push('/acompanhamentos')
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 text-slate-600">
        <ArrowLeft size={15} /> Voltar
      </Button>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h1 className="text-lg font-semibold text-slate-800 mb-6">Novo Acompanhamento</h1>
        <AcompanhamentoForm
          pacienteIdFixo={pacienteId ?? undefined}
          onSubmit={handleSubmit}
          submitLabel="Cadastrar Acompanhamento"
        />
      </div>
    </div>
  )
}

export default function NovoAcompanhamentoPage() {
  return (
    <Suspense>
      <NovoAcompanhamentoContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Criar a página de detalhe do acompanhamento**

Crie `app/(dashboard)/acompanhamentos/[id]/page.tsx`:

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Acompanhamento } from '@/types'
import { isAtivo, calcularDiasAcompanhamento, formatarDataBR } from '@/lib/calculos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AcompanhamentoForm, AcompanhamentoFormData } from '@/components/acompanhamentos/AcompanhamentoForm'

export default function AcompanhamentoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [acomp, setAcomp] = useState<Acompanhamento | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('acompanhamentos')
      .select(`
        *,
        paciente:pacientes(id, nome, data_nascimento, numero_ses, telefone, genero, observacoes, created_at),
        diagnostico:diagnosticos(id, nome),
        eventos:acompanhamento_eventos(evento:eventos_nao_esperados(id, nome))
      `)
      .eq('id', id)
      .single()

    if (data) {
      setAcomp({ ...data, eventos: data.eventos?.map((e: any) => e.evento) ?? [] })
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleEdit(data: AcompanhamentoFormData) {
    const supabase = createClient()
    const { eventos_ids, data_alta, paciente_id, ...rest } = data

    await supabase
      .from('acompanhamentos')
      .update({ ...rest, data_alta: data_alta || null })
      .eq('id', id)

    await supabase.from('acompanhamento_eventos').delete().eq('acompanhamento_id', id)

    if (eventos_ids.length > 0) {
      await supabase.from('acompanhamento_eventos').insert(
        eventos_ids.map(evento_id => ({ acompanhamento_id: id, evento_id }))
      )
    }

    setEditOpen(false)
    load()
  }

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('acompanhamentos').delete().eq('id', id)
    router.push('/acompanhamentos')
  }

  if (loading) return <div className="py-12 text-center text-slate-500 text-sm">Carregando...</div>
  if (!acomp) return <div className="py-12 text-center text-slate-500 text-sm">Acompanhamento não encontrado.</div>

  const ativo = isAtivo(acomp.data_alta)
  const dias = calcularDiasAcompanhamento(acomp.data_admissao, acomp.data_alta)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/acompanhamentos')} className="gap-2 text-slate-600">
          <ArrowLeft size={15} /> Acompanhamentos
        </Button>
        <div className="flex gap-2">
          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil size={13} /> Editar
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader><SheetTitle>Editar Acompanhamento</SheetTitle></SheetHeader>
              <div className="mt-6">
                <AcompanhamentoForm
                  defaultValues={{
                    paciente_id: acomp.paciente_id,
                    diagnostico_id: acomp.diagnostico_id,
                    via_sisreg: acomp.via_sisreg,
                    data_admissao: acomp.data_admissao,
                    data_alta: acomp.data_alta ?? '',
                    recidiva: acomp.recidiva,
                    eventos_ids: acomp.eventos?.map(e => e.id) ?? [],
                    observacao: acomp.observacao ?? '',
                  }}
                  pacienteIdFixo={acomp.paciente_id}
                  onSubmit={handleEdit}
                  submitLabel="Salvar Alterações"
                />
              </div>
            </SheetContent>
          </Sheet>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 size={13} /> Excluir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir acompanhamento?</DialogTitle>
                <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1">Paciente</p>
            <Button
              variant="link"
              className="p-0 h-auto text-base font-semibold gap-1.5"
              onClick={() => router.push(`/pacientes/${acomp.paciente_id}`)}
            >
              {acomp.paciente?.nome}
              <ExternalLink size={13} />
            </Button>
          </div>
          {ativo
            ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>
            : <Badge variant="secondary">Alta</Badge>
          }
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Diagnóstico</span><p className="font-medium">{acomp.diagnostico?.nome}</p></div>
          <div><span className="text-slate-500">Dias de acompanhamento</span><p className="font-medium">{dias} dias</p></div>
          <div><span className="text-slate-500">Admissão</span><p className="font-medium">{formatarDataBR(acomp.data_admissao)}</p></div>
          <div><span className="text-slate-500">Alta</span><p className="font-medium">{acomp.data_alta ? formatarDataBR(acomp.data_alta) : '—'}</p></div>
          <div><span className="text-slate-500">Via SISREG</span><p className="font-medium">{acomp.via_sisreg ? 'Sim' : 'Não'}</p></div>
          <div><span className="text-slate-500">Recidiva</span><p className="font-medium">{acomp.recidiva ? 'Sim' : 'Não'}</p></div>
          {acomp.eventos && acomp.eventos.length > 0 && (
            <div className="col-span-2">
              <span className="text-slate-500">Eventos não esperados</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {acomp.eventos.map(e => (
                  <Badge key={e.id} variant="outline">{e.nome}</Badge>
                ))}
              </div>
            </div>
          )}
          {acomp.observacao && (
            <div className="col-span-2"><span className="text-slate-500">Observação</span><p className="font-medium">{acomp.observacao}</p></div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/acompanhamentos/
git commit -m "feat: add follow-up detail and new follow-up pages"
```

---

## Task 14: Tela de Ligação com CSS de Impressão

**Files:**
- Create: `app/(dashboard)/ligacao/page.tsx`

- [ ] **Step 1: Criar a página de ligação**

Crie `app/(dashboard)/ligacao/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Paciente, Acompanhamento } from '@/types'
import { getDiagnosticoAtivo, formatarDataBR } from '@/lib/calculos'
import { Button } from '@/components/ui/button'

interface PacienteAtivo extends Paciente {
  diagnosticoAtivo: string | null
}

export default function LigacaoPage() {
  const [pacientes, setPacientes] = useState<PacienteAtivo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('acompanhamentos')
        .select(`
          data_alta,
          created_at,
          paciente:pacientes(id, nome, data_nascimento, numero_ses, telefone, genero, observacoes, created_at),
          diagnostico:diagnosticos(id, nome)
        `)
        .is('data_alta', null)

      if (!data) { setLoading(false); return }

      const porPaciente = new Map<string, { paciente: Paciente; acomps: Acompanhamento[] }>()

      for (const row of data as any[]) {
        const p: Paciente = row.paciente
        if (!porPaciente.has(p.id)) {
          porPaciente.set(p.id, { paciente: p, acomps: [] })
        }
        porPaciente.get(p.id)!.acomps.push({
          ...row,
          paciente_id: p.id,
          paciente: p,
          diagnostico: row.diagnostico,
          eventos: [],
        })
      }

      const resultado: PacienteAtivo[] = Array.from(porPaciente.values())
        .map(({ paciente, acomps }) => ({
          ...paciente,
          diagnosticoAtivo: getDiagnosticoAtivo(acomps),
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome))

      setPacientes(resultado)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-lg font-semibold text-slate-800">Lista de Ligação</h1>
        <Button size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer size={15} />
          Imprimir
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm print:hidden">Carregando...</div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4 print:hidden">
            {pacientes.length} paciente(s) com acompanhamento ativo
          </p>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden print:border-0 print:rounded-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 print:bg-white">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nome Completo</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Data de Nascimento</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Nº SES</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Telefone</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Diagnóstico Atual</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nenhum paciente com acompanhamento ativo.
                    </td>
                  </tr>
                )}
                {pacientes.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50 print:bg-white'}>
                    <td className="px-4 py-2.5 font-medium">{p.nome}</td>
                    <td className="px-4 py-2.5">{formatarDataBR(p.data_nascimento)}</td>
                    <td className="px-4 py-2.5">{p.numero_ses}</td>
                    <td className="px-4 py-2.5">{p.telefone}</td>
                    <td className="px-4 py-2.5">{p.diagnosticoAtivo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 1.5cm; }
          body { font-size: 11px; }
          aside, header, nav, button, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; padding: 6px 10px; }
          thead { background: #f8fafc; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(dashboard\)/ligacao/
git commit -m "feat: add call list page with print CSS"
```

---

## Task 15: Infraestrutura do Dashboard de Relatórios

**Files:**
- Create: `components/relatorios/ChartCard.tsx`
- Create: `components/relatorios/PeriodFilter.tsx`

- [ ] **Step 1: Criar o componente PeriodFilter**

Crie `components/relatorios/PeriodFilter.tsx`:

```typescript
'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PeriodFilter as PeriodFilterType } from '@/types'

interface PeriodFilterProps {
  value: PeriodFilterType
  onChange: (v: PeriodFilterType) => void
  label?: string
}

export function PeriodFilter({ value, onChange, label = 'Período (data de admissão)' }: PeriodFilterProps) {
  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="space-y-1">
        <Label className="text-xs text-slate-500">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={value.from ?? ''}
            onChange={e => onChange({ ...value, from: e.target.value || null })}
            className="h-8 text-sm w-36"
          />
          <span className="text-slate-400 text-sm">até</span>
          <Input
            type="date"
            value={value.to ?? ''}
            onChange={e => onChange({ ...value, to: e.target.value || null })}
            className="h-8 text-sm w-36"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-slate-500"
            onClick={() => onChange({ from: null, to: null })}
          >
            Limpar
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar o ChartCard com modal de expansão**

Crie `components/relatorios/ChartCard.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PeriodFilter } from './PeriodFilter'
import { PeriodFilter as PeriodFilterType } from '@/types'

interface ChartCardProps {
  title: string
  globalFilter: PeriodFilterType
  children: (filter: PeriodFilterType) => React.ReactNode
  hideFilter?: boolean
}

export function ChartCard({ title, globalFilter, children, hideFilter }: ChartCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [localFilter, setLocalFilter] = useState<PeriodFilterType>({ from: null, to: null })

  const activeFilter: PeriodFilterType = expanded
    ? { from: localFilter.from ?? globalFilter.from, to: localFilter.to ?? globalFilter.to }
    : globalFilter

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(true)}>
            <Maximize2 size={14} />
          </Button>
        </div>
        <div className="h-64">{children(globalFilter)}</div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {!hideFilter && (
            <PeriodFilter
              value={localFilter}
              onChange={setLocalFilter}
              label="Filtro individual (sobrescreve o global)"
            />
          )}
          <div className="h-96">{children(activeFilter)}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/relatorios/ChartCard.tsx components/relatorios/PeriodFilter.tsx
git commit -m "feat: add ChartCard and PeriodFilter infrastructure for reports"
```

---

## Task 16: Gráficos do Dashboard

**Files:**
- Create: `components/relatorios/GraficoGenero.tsx`
- Create: `components/relatorios/GraficoDiagnosticos.tsx`
- Create: `components/relatorios/GraficoTempoAlta.tsx`
- Create: `components/relatorios/GraficoRecidiva.tsx`
- Create: `components/relatorios/GraficoViaSisreg.tsx`
- Create: `components/relatorios/GraficoMelhora60Dias.tsx`
- Create: `components/relatorios/GraficoEventos.tsx`

- [ ] **Step 1: Criar helper de cores e configuração Recharts compartilhada**

No topo de cada gráfico de pizza, use estas cores:

```typescript
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316']
```

- [ ] **Step 2: Criar GraficoGenero (pizza — sem filtro de período)**

Crie `components/relatorios/GraficoGenero.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#3b82f6', '#f59e0b']

export function GraficoGenero() {
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    createClient()
      .from('pacientes')
      .select('genero')
      .then(({ data: rows }) => {
        if (!rows) return
        const counts: Record<string, number> = {}
        rows.forEach(r => { counts[r.genero] = (counts[r.genero] ?? 0) + 1 })
        setData(Object.entries(counts).map(([name, value]) => ({ name, value })))
      })
  }, [])

  if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: Criar GraficoDiagnosticos (barras horizontais)**

Crie `components/relatorios/GraficoDiagnosticos.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'

interface Props { filter: PeriodFilter }

export function GraficoDiagnosticos({ filter }: Props) {
  const [data, setData] = useState<{ nome: string; total: number }[]>([])

  useEffect(() => {
    async function load() {
      let query = createClient()
        .from('acompanhamentos')
        .select('diagnostico:diagnosticos(nome)')

      if (filter.from) query = query.gte('data_admissao', filter.from)
      if (filter.to) query = query.lte('data_admissao', filter.to)

      const { data: rows } = await query
      if (!rows) return

      const counts: Record<string, number> = {}
      rows.forEach((r: any) => {
        const nome = r.diagnostico?.nome ?? 'Desconhecido'
        counts[nome] = (counts[nome] ?? 0) + 1
      })

      setData(
        Object.entries(counts)
          .map(([nome, total]) => ({ nome, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
      )
    }
    load()
  }, [filter.from, filter.to])

  if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: Criar GraficoTempoAlta (barras agrupadas por faixa)**

Crie `components/relatorios/GraficoTempoAlta.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'
import { calcularMeses, getFaixaMeses } from '@/lib/calculos'

const FAIXAS = ['1-3 meses', '4-6 meses', '7-9 meses', '10-12 meses', '+12 meses']

interface Props { filter: PeriodFilter }

export function GraficoTempoAlta({ filter }: Props) {
  const [data, setData] = useState(FAIXAS.map(f => ({ faixa: f, total: 0 })))

  useEffect(() => {
    async function load() {
      let query = createClient()
        .from('acompanhamentos')
        .select('data_admissao, data_alta')
        .not('data_alta', 'is', null)

      if (filter.from) query = query.gte('data_admissao', filter.from)
      if (filter.to) query = query.lte('data_admissao', filter.to)

      const { data: rows } = await query
      if (!rows) return

      const counts: Record<string, number> = {}
      FAIXAS.forEach(f => (counts[f] = 0))

      rows.forEach((r: any) => {
        const meses = calcularMeses(r.data_admissao, r.data_alta)
        const faixa = getFaixaMeses(meses)
        counts[faixa] = (counts[faixa] ?? 0) + 1
      })

      setData(FAIXAS.map(f => ({ faixa: f, total: counts[f] })))
    }
    load()
  }, [filter.from, filter.to])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="faixa" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 5: Criar GraficoRecidiva (pizza)**

Crie `components/relatorios/GraficoRecidiva.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'

const COLORS = ['#ef4444', '#10b981']

interface Props { filter: PeriodFilter }

export function GraficoRecidiva({ filter }: Props) {
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    async function load() {
      let query = createClient().from('acompanhamentos').select('recidiva')
      if (filter.from) query = query.gte('data_admissao', filter.from)
      if (filter.to) query = query.lte('data_admissao', filter.to)
      const { data: rows } = await query
      if (!rows) return
      const comRecidiva = rows.filter(r => r.recidiva).length
      const semRecidiva = rows.length - comRecidiva
      setData([
        { name: 'Com recidiva', value: comRecidiva },
        { name: 'Sem recidiva', value: semRecidiva },
      ])
    }
    load()
  }, [filter.from, filter.to])

  if (data.every(d => d.value === 0)) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 6: Criar GraficoViaSisreg (pizza)**

Crie `components/relatorios/GraficoViaSisreg.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'

const COLORS = ['#3b82f6', '#94a3b8']

interface Props { filter: PeriodFilter }

export function GraficoViaSisreg({ filter }: Props) {
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    async function load() {
      let query = createClient().from('acompanhamentos').select('via_sisreg')
      if (filter.from) query = query.gte('data_admissao', filter.from)
      if (filter.to) query = query.lte('data_admissao', filter.to)
      const { data: rows } = await query
      if (!rows) return
      const via = rows.filter(r => r.via_sisreg).length
      setData([
        { name: 'Via SISREG', value: via },
        { name: 'Não via SISREG', value: rows.length - via },
      ])
    }
    load()
  }, [filter.from, filter.to])

  if (data.every(d => d.value === 0)) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 7: Criar GraficoMelhora60Dias (pizza)**

Crie `components/relatorios/GraficoMelhora60Dias.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'
import { calcularDiasAcompanhamento } from '@/lib/calculos'

const COLORS = ['#10b981', '#94a3b8']

interface Props { filter: PeriodFilter }

export function GraficoMelhora60Dias({ filter }: Props) {
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    async function load() {
      let query = createClient()
        .from('acompanhamentos')
        .select('data_admissao, data_alta')
        .not('data_alta', 'is', null)
      if (filter.from) query = query.gte('data_admissao', filter.from)
      if (filter.to) query = query.lte('data_admissao', filter.to)
      const { data: rows } = await query
      if (!rows) return
      const em60 = rows.filter((r: any) => calcularDiasAcompanhamento(r.data_admissao, r.data_alta) <= 60).length
      setData([
        { name: 'Alta ≤ 60 dias', value: em60 },
        { name: 'Mais de 60 dias', value: rows.length - em60 },
      ])
    }
    load()
  }, [filter.from, filter.to])

  if (data.every(d => d.value === 0)) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 8: Criar GraficoEventos (barras horizontais)**

Crie `components/relatorios/GraficoEventos.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { PeriodFilter } from '@/types'

interface Props { filter: PeriodFilter }

export function GraficoEventos({ filter }: Props) {
  const [data, setData] = useState<{ nome: string; total: number }[]>([])

  useEffect(() => {
    async function load() {
      let query = createClient()
        .from('acompanhamento_eventos')
        .select(`
          evento:eventos_nao_esperados(nome),
          acompanhamento:acompanhamentos(data_admissao)
        `)

      const { data: rows } = await query
      if (!rows) return

      const filtered = (rows as any[]).filter(r => {
        const admissao = r.acompanhamento?.data_admissao
        if (!admissao) return false
        if (filter.from && admissao < filter.from) return false
        if (filter.to && admissao > filter.to) return false
        return true
      })

      const counts: Record<string, number> = {}
      filtered.forEach(r => {
        const nome = r.evento?.nome ?? 'Desconhecido'
        counts[nome] = (counts[nome] ?? 0) + 1
      })

      setData(
        Object.entries(counts)
          .map(([nome, total]) => ({ nome, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
      )
    }
    load()
  }, [filter.from, filter.to])

  if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="nome" width={160} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add components/relatorios/
git commit -m "feat: add all 7 chart components for reports dashboard"
```

---

## Task 17: Página de Relatórios — Montagem Final

**Files:**
- Create: `app/(dashboard)/relatorios/page.tsx`

- [ ] **Step 1: Criar a página de relatórios**

Crie `app/(dashboard)/relatorios/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { PeriodFilter as PeriodFilterType } from '@/types'
import { PeriodFilter } from '@/components/relatorios/PeriodFilter'
import { ChartCard } from '@/components/relatorios/ChartCard'
import { GraficoGenero } from '@/components/relatorios/GraficoGenero'
import { GraficoDiagnosticos } from '@/components/relatorios/GraficoDiagnosticos'
import { GraficoTempoAlta } from '@/components/relatorios/GraficoTempoAlta'
import { GraficoRecidiva } from '@/components/relatorios/GraficoRecidiva'
import { GraficoViaSisreg } from '@/components/relatorios/GraficoViaSisreg'
import { GraficoMelhora60Dias } from '@/components/relatorios/GraficoMelhora60Dias'
import { GraficoEventos } from '@/components/relatorios/GraficoEventos'

export default function RelatoriosPage() {
  const [globalFilter, setGlobalFilter] = useState<PeriodFilterType>({ from: null, to: null })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <h1 className="text-lg font-semibold text-slate-800">Relatórios</h1>
        <PeriodFilter value={globalFilter} onChange={setGlobalFilter} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Gênero" globalFilter={globalFilter} hideFilter>
          {() => <GraficoGenero />}
        </ChartCard>

        <ChartCard title="Diagnósticos" globalFilter={globalFilter}>
          {filter => <GraficoDiagnosticos filter={filter} />}
        </ChartCard>

        <ChartCard title="Tempo para Alta (meses)" globalFilter={globalFilter}>
          {filter => <GraficoTempoAlta filter={filter} />}
        </ChartCard>

        <ChartCard title="Recidiva" globalFilter={globalFilter}>
          {filter => <GraficoRecidiva filter={filter} />}
        </ChartCard>

        <ChartCard title="Via SISREG" globalFilter={globalFilter}>
          {filter => <GraficoViaSisreg filter={filter} />}
        </ChartCard>

        <ChartCard title="Melhora em até 60 dias" globalFilter={globalFilter}>
          {filter => <GraficoMelhora60Dias filter={filter} />}
        </ChartCard>

        <ChartCard title="Eventos Não Esperados" globalFilter={globalFilter}>
          {filter => <GraficoEventos filter={filter} />}
        </ChartCard>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Executar o build para verificar erros de TypeScript**

```bash
npm run build
```

Esperado: compilação bem-sucedida sem erros de tipo. Corrija quaisquer erros TypeScript antes de continuar.

- [ ] **Step 3: Commit final**

```bash
git add app/\(dashboard\)/relatorios/
git commit -m "feat: add reports dashboard page"
```

---

## Self-Review — Cobertura do Spec

| Requisito do Spec | Task |
|---|---|
| Login sem botão de cadastro | Task 6 |
| Middleware proteção de rotas | Task 5 |
| Tabelas pacientes, diagnosticos, eventos, acompanhamentos, acompanhamento_eventos | Task 2 |
| Cascade delete pacientes | Task 2 (ON DELETE CASCADE na FK) |
| Sidebar: Pacientes → Acompanhamentos → Ligação → Relatórios | Task 7 |
| Pacientes: listagem com idade e diagnóstico ativo calculados | Task 8 |
| Pacientes: detalhe com edição e exclusão | Task 9 |
| Pacientes: seção de acompanhamentos com botão novo | Task 9 |
| Acompanhamentos: listagem ordenada ativo + alfa | Task 12 |
| Acompanhamentos: colunas data_alta e eventos | Task 12 |
| Diagnóstico: combobox com criar inline | Task 10 |
| Eventos: multi-select com criar inline (M:M) | Task 10, 11 |
| Acompanhamento: detalhe com link para paciente | Task 13 |
| Ligação: todos os ativos, colunas corretas, print CSS | Task 14 |
| Relatórios: filtro global + filtro individual por gráfico | Task 15, 17 |
| 7 gráficos conforme especificado | Task 16 |
| Gráfico de Gênero sem filtro de período | Task 16, 17 (hideFilter) |
| Cálculos dinâmicos: idade, diagnóstico ativo, dias, status | Task 4 |
| Testes para funções de cálculo | Task 4 |
