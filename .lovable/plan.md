# Migração para autenticação real com Lovable Cloud

## Objetivo
Substituir o sistema de autenticação mockado (localStorage) por autenticação real do Lovable Cloud (Supabase Auth), com envio de e-mail de confirmação para redefinição de senha.

## Etapas

### 1. Habilitar Lovable Cloud
Provisiona backend (Postgres + Auth + envio de e-mails).

### 2. Criar schema no banco
Migração SQL com:
- `profiles` (id, name, avatar_url, role) — vinculada a `auth.users` via FK, criada por trigger no signup
- `snackbars` (id, owner_id, name, description, location, rating, categories, cover)
- `menu_items` (id, snackbar_id, name, price, description, image)
- `favorites` (user_id, snackbar_id) — many-to-many
- RLS em todas as tabelas + GRANTs para `authenticated`/`anon` conforme cada caso
- Trigger `handle_new_user` para criar profile automaticamente
- Seed inicial de algumas lanchonetes (opcional — manter algumas demos)

### 3. Reescrever `src/lib/auth.tsx`
- Usar `supabase.auth` (signUp, signInWithPassword, signOut, resetPasswordForEmail)
- `onAuthStateChange` para manter sessão sincronizada
- Hooks `useAuth()` mantendo a mesma API atual (user, login, signup, logout, mySnackbar, favorites…) para não quebrar páginas já existentes
- Queries a snackbars/menu/favorites via Supabase

### 4. Atualizar tela inicial (`src/routes/index.tsx`)
- `ForgotForm` agora pede apenas o e-mail e chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Mostra mensagem "Enviamos um e-mail de confirmação. Clique no link para definir uma nova senha."
- Login/Signup agora usam Supabase real

### 5. Criar rota pública `/reset-password`
- `src/routes/reset-password.tsx`
- Detecta sessão de recovery vinda do link do e-mail
- Formulário com nova senha + confirmação
- Chama `supabase.auth.updateUser({ password })`
- Redireciona para `/home` após sucesso

### 6. Adaptar páginas existentes
- `_app.home.tsx`, `_app.owner.tsx`, `_app.profile.tsx`, `_app.snackbar.$id.tsx`, etc. — substituir leituras do estado mockado por queries Supabase via o novo `useAuth`
- Manter a API do hook estável para minimizar mudanças

## Detalhes técnicos

- Provider de e-mail: Lovable Cloud Emails (built-in, sem configuração extra para começar — usa domínio padrão)
- Template do e-mail de reset: padrão do Supabase Auth (pode ser customizado depois)
- RLS:
  - `profiles`: select público (para mostrar nome do dono); update apenas do próprio
  - `snackbars`: select público; insert/update/delete apenas pelo `owner_id`
  - `menu_items`: select público; insert/update/delete apenas pelo dono da snackbar (via `EXISTS`)
  - `favorites`: select/insert/delete apenas do próprio `user_id`
- Função `has_role` + tabela `user_roles` separada para o papel `owner` (segue boas práticas — não armazenar role em `profiles`)

## Riscos / observações

- Usuários mockados atuais no localStorage (`user@unipetit.com` etc.) deixarão de existir; será preciso recriar conta
- O e-mail de reset chega na caixa do usuário; em dev o domínio padrão funciona, mas marcar como spam é possível
- Trabalho é amplo (toca todas as páginas do app), feito em uma única passada

Posso prosseguir?