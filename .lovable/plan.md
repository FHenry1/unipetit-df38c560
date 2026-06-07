# Plano de execução — Prompt UniPetit

O prompt tem **13 features + área de Admin nova + 4 migrations**. Vou executar em 5 fases, cada uma verificável antes de continuar. Isso evita quebrar funcionalidades existentes.

## Fase 1 — Banco de dados (migrations)
Todas as alterações SQL antes de mexer no código:
- Adicionar `opening_time`, `closing_time` em `snackbars` (item 5.2)
- Adicionar `category` em `menu_items` (item 11)
- Criar tabela `owner_applications` com RLS (item 13)
- Criar role `admin` no enum + RPC `admin_approve_owner` + policy "Admin pode deletar review" (Bloco 3)

## Fase 2 — `auth.tsx` e helpers compartilhados
- Estender `Role` para `"user" | "owner" | "admin"`
- Adicionar `opening_time`/`closing_time` na interface `SnackBar` + select
- Adicionar `category` na interface `MenuItem` + addMenuItem/updateMenuItem
- Atualizar `updateMySnackbar` com novos campos
- Criar `src/hooks/use-user-location.ts` + helpers `isSnackbarOpen`, `distanceKm` em `utils.ts`

## Fase 3 — Consumidor (Bloco 1, items 1–6)
- Item 1: Modal "verifique seu e-mail" pós-signup em `index.tsx`
- Item 2: Remover botões Editar/Excluir review em `_app.snackbar.$id.tsx`
- Item 3: iframe do Google Maps embutido na aba info
- Item 4: Unificar filtro usando `FilterSheet` na Home
- Item 5.1/5.2/5.3: Limpar cards, adicionar badge aberto/fechado + distância + coração na busca
- Item 6: Background branco na Home (manter header vinho)

## Fase 4 — Dono (Bloco 2, items 8–13)
- Item 8: Remover pedidos/vendas/gráficos do dashboard owner
- Item 9: Campos horário em `owner.profile`
- Item 10: Remover tabs duplicadas do topo, garantir nav inferior
- Item 11: Categorias no menu owner
- Item 12: Subtítulo "Vendedor"
- Item 13: Formulário "Torne-se dono" cria registro em `owner_applications`

## Fase 5 — Admin (Bloco 3)
- Criar `_app.admin.tsx` com 3 abas (Usuários / Avaliações / Relatórios)
- Proteger rota: redirecionar não-admins para `/home`
- Redirecionar admin em `index.tsx` para `/admin`

## Detalhes técnicos
- Cada fase é uma rodada de tool calls; aguardo aprovação das migrations antes de continuar
- Migrations seguem padrão `IF NOT EXISTS`, não destrutivas
- Item 7 já está implementado — apenas verificar
- Item de redirecionar `/owner/orders` para `/owner` incluído na Fase 4

## Pergunta antes de começar
Quer que eu execute **tudo nessa ordem automaticamente** (vou pausar só para as aprovações de migration que o Supabase exige), ou prefere ir fase a fase com sua confirmação entre cada uma?
