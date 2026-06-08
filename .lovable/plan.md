# UniPetit Connect — Plano de Modificações

Este é um conjunto grande de mudanças (3 blocos, ~15+ tarefas, várias migrations SQL, novo perfil de admin). Vou executar exatamente o que está no prompt, em ordem de dependência, mas o escopo é considerável. Estimativa: muitas edições de arquivos + 4 migrations + 1 rota nova.

## Ordem de execução

### Fase 1 — Migrations SQL (precisam aprovação primeiro)
1. `snackbars`: adicionar `opening_time`, `closing_time` (item 5.2)
2. `menu_items`: adicionar `category` (item 11)
3. `owner_applications`: tabela já existe — só ajustar se necessário (item 13)
4. Policy admin para deletar reviews + RPC `admin_approve_owner` já existe (item 13-B/C)

### Fase 2 — Camada de dados (`src/lib/auth.tsx`)
- Adicionar campos `opening_time`, `closing_time` à interface `SnackBar` + select
- Adicionar `category` à interface `MenuItem` + addMenuItem/updateMenuItem
- Ampliar `Role` para incluir `"admin"`
- Atualizar `updateMySnackbar` para incluir horários

### Fase 3 — Utils e Hooks
- `src/lib/utils.ts`: adicionar `isSnackbarOpen()`
- `src/hooks/use-user-location.ts`: novo, com `distanceKm()`

### Fase 4 — Componentes compartilhados
- `SnackBarCard.tsx`: remover descrição, adicionar status/distância, botão favorito
- `FilterSheet.tsx`: nenhuma mudança (já funciona)
- `BottomNav.tsx`: remover pedidos/carrinho se existir
- `OwnerBottomNav.tsx`: confirmar Menu e Reviews

### Fase 5 — Rotas de consumidor
- `_app.home.tsx`: bg branco, unificar filtros com FilterSheet, remover endereço/descrição dos cards, adicionar status/distância
- `_app.search.tsx`: passar `isFav` e `onFav` ao SnackBarCard
- `_app.profile.tsx`: remover seção "Meus pedidos"; modal de solicitação para "Torne-se dono"
- `_app.snackbar.$id.tsx`: remover qualquer UI de pedidos; remover editar/excluir review próprio; iframe Maps em vez de link

### Fase 6 — Index/cadastro
- `index.tsx`: tela "verifique sua caixa de entrada" após signup; reenviar e-mail; redirect admin → /admin

### Fase 7 — Rotas de dono
- `_app.owner.tsx`: remover gráficos/receita/pedidos, remover card superior duplicado
- `_app.owner.orders.tsx`: redirect para /owner
- `_app.owner.profile.tsx`: campos de horário; subtitle "Vendedor"
- `_app.owner.menu.tsx`: tabs por categoria + select de categoria por item

### Fase 8 — Novo Admin
- `_app.admin.tsx`: nova rota com 3 abas (Usuários, Avaliações, Relatórios)
- `_app.tsx`: não redirecionar admin para /home

## Notas técnicas

- TanStack Router auto-gera `routeTree.gen.ts` — não editar manualmente.
- Migrations usam `IF NOT EXISTS`. A tabela `owner_applications` e a função `admin_approve_owner` já existem no DB (confirmado no contexto). Só adicionar policy de delete em reviews para admin se faltar.
- Não tocar em `src/integrations/supabase/client.ts` nem `types.ts` (auto-gen — types serão regenerados após migrations).
- Mantendo `placeOrder`/`cancelOrder` em auth.tsx até confirmar que não há outras referências.

## Confirmação

Posso prosseguir? Por ser muito grande, vou executar tudo de uma vez, mas vai exigir várias aprovações de migration ao longo do caminho.