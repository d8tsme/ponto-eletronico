# 📖 API Reference - Novas Funções e Tipos

## Sumário Rápido

Este arquivo documenta todas as **novas funções**, **tipos** e **componentes** adicionados na v2.0.

---

## 1. Storage Cleanup API

**Arquivo:** `src/lib/storage-cleanup.ts`

### Função: `emergencyCleanup()`

Limpa dados obsoletos do navegador.

```typescript
import { emergencyCleanup } from "@/lib/storage-cleanup";

// Uso
emergencyCleanup();

// O que faz:
// 1. Remove localStorage (supabase.auth.token, ponto-session, etc)
// 2. Remove sessionStorage (completo)
// 3. Remove cookies de autenticação
// 4. Loga cada ação [Cleanup] prefix
```

**Quando usar:**
```typescript
// No LoginForm ao detectar erro:
if (err || !authData.user) {
  emergencyCleanup();
  setError("Erro ao fazer login");
}
```

---

### Função: `hasStorageConflict()`

Detecta inconsistências entre localStorage e sessionStorage.

```typescript
import { hasStorageConflict } from "@/lib/storage-cleanup";

// Uso
if (hasStorageConflict()) {
  console.warn("Tokens conflitantes detectados!");
  emergencyCleanup();
}

// Retorna: boolean
// true = Há dados conflitantes
// false = Storage está consistente
```

---

### Função: `aggressiveCookieCleanup()`

Remove cookies de todos os caminhos e domínios possíveis.

```typescript
import { aggressiveCookieCleanup } from "@/lib/storage-cleanup";

// Uso (última tentativa)
try {
  logoutAndCleanup(supabase);
} catch (e) {
  aggressiveCookieCleanup(); // Nuclear option
}
```

---

### Função: `logoutAndCleanup(supabaseClient?)`

Faz logout do Supabase E limpa dados do navegador atomicamente.

```typescript
import { logoutAndCleanup } from "@/lib/storage-cleanup";
import { createClient } from "@/lib/supabase/client";

// Uso - Com Supabase client
const supabase = createClient();
await logoutAndCleanup(supabase);

// Uso - Sem client (fallback)
await logoutAndCleanup();

// O que faz:
// 1. Tenta chamar supabase.auth.signOut()
// 2. Se falha, ignora erro
// 3. Chama emergencyCleanup() sempre
// 4. Redirecionamento deve ser feito manualmente
```

**Exemplo completo:**
```typescript
async function handleLogout() {
  await logoutAndCleanup(supabase);
  router.push("/login");
}
```

---

## 2. Autenticação - Profile Type

**Arquivo:** `src/lib/auth-helpers.ts`

### Type: `Profile`

```typescript
type Profile = {
  // Identificação
  id: string;
  full_name: string | null;
  cpf: string | null;
  
  // Biometria
  master_photo_url: string | null;      // URL no storage
  face_descriptor: number[] | null;     // Array do face-api.js
  face_embedding: string | null;        // (novo) Para vetores
  face_registered: boolean;              // (novo) Flag conclusão
  
  // Onboarding
  first_access_completed: boolean;
  
  // Permissões
  is_admin: boolean;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
};
```

**Mudanças da v1 para v2:**
- ✨ Adicionado `face_embedding`
- ✨ Adicionado `face_registered` (boolean)
- ✨ Adicionado `created_at` e `updated_at` (opcionais)

---

### Função: `requireProfile()`

Obtém profile do usuário autenticado com tratamento robusto.

```typescript
import { requireProfile } from "@/lib/auth-helpers";

// Uso em Server Component
export default async function Page() {
  const { supabase, user, profile } = await requireProfile();
  
  // Já garantido:
  // - User existe
  // - Profile existe
  // - Redireciona para /primeiro-acesso se não
}

// Retorna:
// {
//   supabase: SupabaseClient
//   user: AuthUser
//   profile: Profile (completo)
// }
```

**Comportamento:**
1. Verifica se user está autenticado
2. Se não → redireciona `/login`
3. Se sim → busca profile
4. Se profile não existe → redireciona `/primeiro-acesso`
5. Log: `[Auth] Perfil não encontrado...` se redirecionar

---

## 3. Páginas e Componentes

### Página: `/ajuda`

**Arquivos:**
- `src/app/ajuda/page.tsx` - Página
- `src/app/ajuda/AjudaClient.tsx` - Componente React

**Características:**
- ✅ Acessível **publicamente** (sem login)
- ✅ Middleware não bloqueia
- ✅ Tutorial 5 passos em seções
- ✅ FAQ com 6 perguntas (expand/collapse)
- ✅ Link volta para login
- ✅ Responsive design (mobile first)

**Como usar:**
```
1. User clica "Precisa de ajuda?" em /login
2. Abre https://seu-app.com/ajuda
3. Lê tutorial passo-a-passo
4. Expande FAQ para sua dúvida
5. Clica "Voltar ao Login"
```

**Customizar FAQ:**
Edite `AjudaClient.tsx`, seção `<details>`:
```tsx
<details className="...">
  <summary>Sua pergunta aqui</summary>
  <div className="...">
    Sua resposta aqui
  </div>
</details>
```

---

### Componente: `PrimeiroAcessoForm`

**Arquivo:** `src/app/primeiro-acesso/PrimeiroAcessoForm.tsx`

**Alterações:**
1. Atualiza `face_registered = true` ao salvar
2. Logs `[FaceReg]` em cada passo
3. Try/catch robusto com mensagens em português
4. Garante persistência antes de redirecionar

**Fluxo:**
```
Captura foto → Extrai descriptor → Comprime para WebP 
→ Upload storage → Update DB (face_registered) → Redirect /ponto
```

**Códigos de erro esperados:**
```
"Câmera não está pronta. Aguarde a imagem aparecer."
"Rosto não detectado. Posicione o rosto centralizado..."
"Erro ao salvar foto no servidor: <erro-específico>"
"Erro ao salvar biometria no banco de dados: <erro-específico>"
```

---

### Componente: `LoginForm`

**Arquivo:** `src/app/login/LoginForm.tsx`

**Alterações:**
1. Importa `emergencyCleanup` e `logoutAndCleanup`
2. Chama `emergencyCleanup()` ao erro de login
3. Chama `logoutAndCleanup(supabase)` ao profile não encontrado
4. Adiciona link `<Link href="/ajuda">Precisa de ajuda?</Link>`
5. Logs `[Login]` em erros

**Novo fluxo de erro:**
```
❌ Login falha
  ↓
emergencyCleanup() [remove storage]
  ↓
setError("Erro ao fazer login")
```

---

### Componente: `PontoClient`

**Arquivo:** `src/app/ponto/PontoClient.tsx`

**Alterações:**
1. Adiciona link "?" → `/ajuda` no header
2. Melhora `handleLogout()` com try/catch
3. Ainda funciona como antes para registro de ponto

**Novo header:**
```jsx
<div className="flex items-center gap-2">
  {profile.is_admin && <Link href="/admin">Admin</Link>}
  <Link href="/ajuda" title="Abrir centro de ajuda">?</Link>
  <button onClick={handleLogout}>Sair</button>
</div>
```

---

### Componente: `AdminClient`

**Arquivo:** `src/app/admin/AdminClient.tsx`

**Alterações:**
1. Adiciona link "Ajuda" no header
2. Mantém funcionalidade de filtro/export

**Novo header:**
```jsx
<div className="flex flex-wrap items-center gap-2">
  <Link href="/ajuda">Ajuda</Link>
  <Link href="/ponto">Voltar ao ponto</Link>
  <button onClick={() => refresh()}>Atualizar</button>
</div>
```

---

## 4. SQL - Novas Colunas e Triggers

**Arquivo:** `supabase/setup_final.sql`

### Tabela: `profiles` (colunas novas)

```sql
-- Nova coluna
ALTER TABLE public.profiles ADD COLUMN face_registered boolean NOT NULL DEFAULT false;

-- Existentes (para referência)
-- id, full_name, cpf
-- master_photo_url, face_descriptor
-- face_embedding (nova, string para vetores futuros)
-- first_access_completed, is_admin
-- created_at, updated_at
```

### Função: `handle_new_user()` (atualizada)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    cpf,
    face_registered,        -- novo: sempre false no início
    first_access_completed, -- novo: sempre false no início
    is_admin
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(trim(coalesce(new.raw_user_meta_data->>'cpf', '')), ''),
    false,  -- Novos usuários não têm face registrada
    false,  -- Novos usuários não completaram primeiro acesso
    false   -- Novos usuários não são admin
  );
  RETURN new;
END;
$$;
```

### RLS Policies (28 linhas)

Todas estão em `setup_final.sql`, incluindo:
- profiles (SELECT, INSERT, UPDATE, DELETE)
- ponto_logs (SELECT, INSERT, UPDATE, DELETE)
- storage.objects (SELECT, INSERT, UPDATE, DELETE)

---

## 5. Console Logs Adicionados

### Padrão de Logs

```
[Prefixo] Mensagem com contexto
```

### Prefixos

| Prefixo | Arquivo | Contexto |
|---------|---------|----------|
| `[Auth]` | auth-helpers.ts | Autenticação, requireProfile |
| `[Login]` | LoginForm.tsx | Fluxo de login |
| `[FaceReg]` | PrimeiroAcessoForm.tsx | Registro facial |
| `[Cleanup]` | storage-cleanup.ts | Limpeza de storage |
| `[Logout]` | PontoClient.tsx | Logout |

### Exemplo de Saída

```javascript
// Login com credenciais inválidas
[Login] Erro de autenticação: Invalid login credentials
[Cleanup] Iniciando limpeza de emergência: localStorage, sessionStorage e cookies
[Cleanup] Removido localStorage[supabase.auth.token]
[Cleanup] sessionStorage limpo
[Cleanup] Removido cookie: sb-ponto-eletronico-auth-token
[Cleanup] Limpeza de emergência concluída com sucesso
```

```javascript
// Primeiro acesso
[FaceReg] Iniciando upload da foto mestra para: abc123-def456/master.webp
[FaceReg] Foto mestra salva com sucesso: abc123-def456/master.webp
[FaceReg] Atualizando profile para usuário abc123-def456
[FaceReg] Profile atualizado com sucesso
[FaceReg] Redirect para /ponto
```

---

## 6. Tipos e Interfaces Novos

### Type: `Profile` (v2)

Visto acima - inclui `face_embedding` e `face_registered`.

### Interface: `CookieToSet`

Uso interno no middleware:

```typescript
type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<InstanceType<typeof NextResponse>["cookies"]["set"]>[2];
};
```

---

## 7. Hooks e Utilities

### Não há hooks novos públicos

Todas as funções são utilities síncronas/assíncronas diretas:

```typescript
// ❌ Não é um hook (não começa com use)
import { emergencyCleanup } from "@/lib/storage-cleanup";

// ✅ É uma função utility
emergencyCleanup();
```

---

## 8. Uso Típico - Fluxo Completo

### Cenário 1: Novo usuário falha login

```typescript
// 1. LoginForm.tsx
const { error: err } = await supabase.auth.signInWithPassword({...});
if (err || !authData.user) {
  emergencyCleanup();        // Limpeza automática
  setError(err?.message);
  return;
}

// 2. Verificar profile
const { data: profile } = await supabase.from("profiles").select("id");
if (!profile) {
  await logoutAndCleanup(supabase);  // Logout + limpeza
  setError("Perfil em processamento...");
  return;
}

// 3. Login bem-sucedido
router.push("/ponto");
```

---

### Cenário 2: Primeiro acesso - Registrar face

```typescript
// PrimeiroAcessoForm.tsx
try {
  // 1. Captura e processa
  const descriptor = await getFaceDescriptorFromImageData(canvas);
  
  // 2. Upload foto
  const { error: upErr } = await supabase.storage
    .from("ponto-fotos")
    .upload(path, webp, { upsert: true });
  if (upErr) throw new Error(`Upload: ${upErr.message}`);
  
  // 3. Update profile ⭐ INCLUI face_registered
  const { error: dbErr } = await supabase
    .from("profiles")
    .update({
      master_photo_url: path,
      face_descriptor: Array.from(descriptor),
      face_registered: true,              // ✨ NOVO
      first_access_completed: true,
    })
    .eq("id", user.id);
  if (dbErr) throw new Error(`DB: ${dbErr.message}`);
  
  // 4. Redirecionar (depois de persistência!)
  router.push("/ponto");
  
} catch (e) {
  setError(e.message); // Erro em português
}
```

---

### Cenário 3: Consultar face_registered

```typescript
// Em qualquer server component
const { profile } = await requireProfile();

if (!profile.face_registered) {
  // Usuário ainda não completou registro facial
  return <RedirectToFaceRegistration />;
}

// Usuário tem face registrada, pode usar reconhecimento
```

---

## 9. Variáveis de Ambiente

Nenhuma variável **nova** foi adicionada.

**Existentes (obrigatórios):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://proj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 10. Migrações SQL

Execute `supabase/setup_final.sql` completo:

```sql
-- Adiciona coluna
ALTER TABLE public.profiles 
ADD COLUMN face_registered boolean NOT NULL DEFAULT false;

-- Ou recria tudo (setup_final.sql faz isso)
```

---

## 📋 Checklist de Integração

- [ ] Importei `emergencyCleanup` em LoginForm
- [ ] Importei `logoutAndCleanup` em LoginForm
- [ ] Criei `/ajuda` (page.tsx + AjudaClient.tsx)
- [ ] Adicionei link "?" em PontoClient.tsx
- [ ] Adicionei link "Ajuda" em AdminClient.tsx
- [ ] Executei setup_final.sql no Supabase
- [ ] PrimeiroAcessoForm atualiza `face_registered`
- [ ] console.log com `[Prefixo]` aparecem em DevTools

---

**Versão:** 2.0 API Reference  
**Data:** 2024  
**Pronto:** ✅
