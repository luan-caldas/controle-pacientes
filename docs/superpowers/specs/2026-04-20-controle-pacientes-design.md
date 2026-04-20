# Sistema de Controle de Pacientes — Design Spec
**Data:** 2026-04-20  
**Status:** Aprovado pelo usuário

---

## 1. Visão Geral

Sistema interno de controle de pacientes para ambiente ambulatorial. Acesso restrito a usuários autenticados (sem cadastro público). Interface clínica minimalista, limpa e funcional.

---

## 2. Stack Tecnológico

- **Front-end:** Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui, Lucide React
- **Gráficos:** Recharts
- **Back-end/Database:** Supabase (projeto existente)
- **Auth:** Supabase Auth (e-mail + senha)
- **Acesso ao Supabase no cliente:** `@supabase/ssr` — Client-Side com Supabase JS
- **Tipos:** TypeScript

---

## 3. Arquitetura

### Abordagem

Client-Side com Supabase JS (`@supabase/ssr`). Todas as páginas autenticadas são Client Components. O middleware do Next.js lê o cookie de sessão Supabase para proteger rotas.

### Estrutura de Pastas

```
controle-pacientes/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← sidebar + proteção de rota
│   │   ├── pacientes/
│   │   │   ├── page.tsx            ← listagem
│   │   │   └── [id]/page.tsx       ← detalhes + acompanhamentos
│   │   ├── acompanhamentos/
│   │   │   ├── page.tsx            ← listagem
│   │   │   └── [id]/page.tsx       ← detalhes
│   │   ├── ligacao/page.tsx        ← impressão
│   │   └── relatorios/page.tsx     ← dashboard
├── components/
│   ├── ui/                         ← shadcn/ui
│   ├── pacientes/
│   ├── acompanhamentos/
│   └── relatorios/
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← cliente browser
│   │   └── middleware.ts
│   └── utils.ts                    ← cálculos dinâmicos
├── middleware.ts
└── types/index.ts
```

### Proteção de Rotas

O `middleware.ts` verifica o cookie de sessão Supabase:
- Rotas sob `(dashboard)/` → redirecionam para `/login` se não autenticado
- Rota `/login` → redireciona para `/pacientes` se já autenticado

---

## 4. Banco de Dados

RLS **não** configurado via código — será configurado manualmente pelo usuário.

### Tabelas

```sql
-- Pacientes
CREATE TABLE pacientes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  data_nascimento date NOT NULL,
  numero_ses      text NOT NULL,
  telefone        text NOT NULL,
  genero          text NOT NULL CHECK (genero IN ('Masculino', 'Feminino')),
  observacoes     text,
  created_at      timestamptz DEFAULT now()
);

-- Diagnósticos
CREATE TABLE diagnosticos (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE
);

-- Eventos Não Esperados
CREATE TABLE eventos_nao_esperados (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE
);

-- Acompanhamentos
CREATE TABLE acompanhamentos (
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

-- Tabela de junção: Acompanhamento ↔ Eventos Não Esperados (many-to-many)
CREATE TABLE acompanhamento_eventos (
  acompanhamento_id uuid NOT NULL REFERENCES acompanhamentos(id) ON DELETE CASCADE,
  evento_id         uuid NOT NULL REFERENCES eventos_nao_esperados(id) ON DELETE CASCADE,
  PRIMARY KEY (acompanhamento_id, evento_id)
);
```

### Campos Calculados (front-end apenas — não persistidos)

| Campo | Tabela origem | Cálculo |
|---|---|---|
| Idade | `pacientes.data_nascimento` | `floor((hoje - nascimento) / 365.25)` |
| Diagnóstico Ativo | `acompanhamentos` | Nome do diagnóstico do acompanhamento mais recente com `data_alta = null` |
| Status Ativo | `acompanhamentos.data_alta` | `true` se `data_alta` é null |
| Dias de Acompanhamento | `data_admissao` + `data_alta` | `data_alta - data_admissao`; se null, `hoje - data_admissao` |

Todos os cálculos centralizados em `lib/utils.ts`.

---

## 5. Telas

### A. Login (`/login`)
- Formulário centralizado: e-mail + senha
- **Sem** link/botão de cadastro ou criação de conta
- Erro exibido inline em caso de credenciais inválidas
- Redireciona para `/pacientes` após autenticação bem-sucedida

### B. Navegação (Sidebar)
Fixa à esquerda em todas as telas autenticadas, com ícone + label:
1. Pacientes
2. Acompanhamentos
3. Ligação
4. Relatórios

### C. Pacientes — Listagem (`/pacientes`)
**Tabela com colunas:** Nome, Gênero, Idade (calculada), Diagnóstico Ativo (calculado), Número SES, Telefone.  
**Ação:** Botão "Novo Paciente" abre sheet lateral com formulário.  
**Navegação:** Clique na linha navega para `/pacientes/[id]`.

### D. Paciente — Detalhes (`/pacientes/[id]`)
- Exibe todos os dados do paciente + Idade e Diagnóstico Ativo (calculados)
- Botões: Editar (abre formulário inline) e Excluir (confirmação)
- **Exclusão:** cascade — deleta todos os acompanhamentos vinculados
- Seção inferior: lista de acompanhamentos do paciente com botão "Novo Acompanhamento"

### E. Acompanhamentos — Listagem (`/acompanhamentos`)
**Ordenação:** Ativos primeiro → por nome do paciente A→Z.  
**Colunas:** Paciente, Diagnóstico, Status (badge Ativo/Alta), Data Admissão, Data Alta, Dias de Acompanhamento, Via SISREG, Recidiva, Eventos Não Esperados (nomes separados por vírgula).  
**Ação:** Botão "Novo Acompanhamento".  
**Navegação:** Clique na linha navega para `/acompanhamentos/[id]`.

### F. Acompanhamento — Detalhes (`/acompanhamentos/[id]`)
- Dados completos + campos calculados
- Link para perfil do paciente vinculado
- Botões: Editar e Excluir
- **Diagnóstico:** combobox com busca + opção inline "Criar: [texto]" — salva em `diagnosticos` e já vincula
- **Eventos Não Esperados:** multi-select combobox + opção inline "Criar: [texto]" — salva em `eventos_nao_esperados` e vincula via `acompanhamento_eventos`

### G. Ligação (`/ligacao`)
- Apenas pacientes com acompanhamento ativo (incluindo os sem telefone)
- **Colunas:** Nome Completo, Data de Nascimento, Número SES, Telefone, Diagnóstico Atual
- Botão "Imprimir" visível na tela
- **`@media print`:** oculta sidebar, header e botões; tabela formatada para folha A4

### H. Relatórios (`/relatorios`)
- Filtro global de período (`data_admissao`) no topo
- Grid 2 colunas com 7 cards de gráficos
- Cada card possui ícone de expandir → abre modal com filtro de período próprio (sobrescreve o global apenas para aquele gráfico)

**Gráficos:**

| # | Título | Tipo | Base | Lógica |
|---|---|---|---|---|
| 1 | Gênero | Pizza | `pacientes` | Proporção M/F — **sem** filtro de período |
| 2 | Diagnósticos | Barras horizontais | `acompanhamentos` | Top diagnósticos por nº de acompanhamentos no período |
| 3 | Tempo para Alta (meses) | Barras | `acompanhamentos` com `data_alta` | Faixas: 1-3, 4-6, 7-9, 10-12, +12 meses |
| 4 | Recidiva | Pizza | `acompanhamentos` | Com recidiva vs sem recidiva |
| 5 | Via SISREG | Pizza | `acompanhamentos` | Via SISREG vs não |
| 6 | Melhora ≤ 60 dias | Pizza | `acompanhamentos` com `data_alta` | Alta em ≤60 dias vs demais |
| 7 | Eventos Não Esperados | Barras horizontais | `acompanhamento_eventos` | Top eventos por nº de ocorrências no período |

---

## 6. Estilo Visual

- Paleta neutra: brancos, cinzas, azul-slate discreto
- Tipografia limpa, sem ornamentos
- Componentes shadcn/ui como base
- Design adequado para ambiente clínico: sem elementos decorativos excessivos

---

## 7. Decisões Técnicas Registradas

| Decisão | Motivo |
|---|---|
| Client-side com Supabase JS | Sistema interno, sem SEO; simplicidade de implementação |
| Sem RLS no código | Configurado manualmente pelo usuário após deploy |
| Cascade delete em pacientes | Comportamento esperado pelo usuário para manter consistência |
| `acompanhamento_eventos` (M:M) | Um acompanhamento pode ter múltiplos eventos não esperados |
| Inline "Criar: [texto]" nos comboboxes | UX mais fluida sem interromper o fluxo com modais |
| Gráfico de Gênero sem filtro de período | Representa a base total de pacientes, não transações temporais |
