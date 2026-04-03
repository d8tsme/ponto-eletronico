# 🚀 Checklist de Deployment - Ponto Eletrônico v2.0

## Pré-Deploy (Antes de qualquer acción)

- [ ] Fazer backup do banco de dados Supabase
  ```bash
  # Dashboard Supabase → Backups → Create backup
  ```

- [ ] Testar localmente
  ```bash
  npm run dev
  # Testar: /login → /primeiro-acesso → /ponto → /ajuda
  ```

- [ ] Revisar variáveis de ambiente
  ```bash
  echo $NEXT_PUBLIC_SUPABASE_URL
  echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
  ```

---

## Step 1: SQL Deployment

### ✅ Executar `setup_final.sql` no Supabase

1. Abra [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Navegue para **SQL Editor**
4. Crie uma nova query
5. Cole conteúdo de `supabase/setup_final.sql`
6. Clique **Run**

```
⚠️ IMPORTANTE: Executar em staging PRIMEIRO, depois produção
```

**Verificação:**
```sql
-- Verificar tabelas existem
\dt public.profiles
\dt public.ponto_logs

-- Verificar colunas corretas
\d public.profiles
-- Deve mostrar: face_registered, face_embedding, full_name, cpf

-- Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
-- Ambas devem mostrar "on"
```

---

## Step 2: Code Deployment

### ✅ Build e test

```bash
# Limpar cache
rm -rf .next node_modules

# Instalar dependências
npm install

# Build
npm run build

# Verificar erros
npm run lint
```

### ✅ Variáveis de ambiente (Vercel/Netlify/AWS)

Adicione no seu painel de deployment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxyyyzzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ✅ Deploy

```bash
# Vercel
vercel deploy --prod

# Ou seu provider preferido
npm run deploy
```

---

## Step 3: Verificações Pós-Deploy

### ✅ URL acessível
- [ ] https://seu-app.com funciona
- [ ] Redirecionamento /login → /ponto funciona
- [ ] /ajuda acessível sem login

### ✅ Login funciona
```
1. Abrir https://seu-app.com/login
2. Inserir credenciais inválidas
3. Deve aparecer: "Erro ao fazer login"
4. localStorage deve estar limpo (F12 → Application → Storage)
```

### ✅ Primeiro acesso funciona
```
1. Login com novo usuário
2. Deve redirecionar para /primeiro-acesso
3. Câmera deve abrir
4. Clique em "Salvar foto mestra"
5. Deve redirecionar para /ponto
6. Face_registered deve ser true no banco
```

### ✅ Ponto funciona
```
1. Na página /ponto
2. Clique em "Bater Ponto"
3. Reconhecimento facial deve funcionar
4. Clique em "Salvar Entrada"
5. Deve registrar em ponto_logs
```

### ✅ Admin funciona
```
1. Se usuário é admin: ver botão "Admin" em /ponto
2. Clicar em "Admin"
3. Listar registros de ponto
4. Exportar PDF/CSV deve funcionar
```

### ✅ Ajuda acessível
```
1. https://seu-app.com/ajuda deve carregar
2. Tutorial deve mostrar 5 passos
3. FAQ deve expandir/colapsar
```

---

## Step 4: Logs e Monitoring

### ✅ Verificar console do browser (F12)

Procure por logs com prefixos:
- `[Auth]` - Autenticação
- `[Login]` - Login
- `[FaceReg]` - Registro facial
- `[Cleanup]` - Limpeza
- `[Logout]` - Logout

**Exemplo esperado:**
```
[Login] Erro de autenticação: Invalid login credentials
[Cleanup] Iniciando limpeza de emergência: localStorage, sessionStorage e cookies
[Cleanup] Removido localStorage[supabase.auth.token]
[Cleanup] Limpeza de emergência concluída com sucesso
```

### ✅ Verificar error logs (Dashboard)

- Vercel: Logs → Deployments → Runtime Logs
- AWS: CloudWatch → Logs
- Seu provider específico

---

## Step 5: Performance Check

### ✅ Velocidade de carregamento

```bash
# Lighthouse
npm install -g lighthouse
lighthouse https://seu-app.com --view
```

**Targets:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### ✅ Tamanho do bundle

```bash
npm run build
# Verificar .next/static se não ultrapassou limites
```

---

## Step 6: Segurança

### ✅ RLS verificar

```sql
-- No Supabase SQL Editor
SELECT * FROM auth.users LIMIT 1;
-- Deve retornar dados (você está autenticado como supabase_admin)

-- Teste como usuário comum (em outro navegador incógnito)
-- Deve retornar "permission denied" ou dados vazios se RLS está funcionando
```

### ✅ Storage policies

```sql
-- Verificar policies do storage
SELECT * FROM storage.policies;
```

### ✅ CORS/Headers

Verificar no DevTools:
- Response headers devem incluir `x-supabase-key`
- Sem credentials leak

---

## Step 7: Documentação de Rollback

### ⚠️ Se algo der errado:

```bash
# 1. Reverter code último commit
git revert <hash-do-commit>
npm run build && deploy

# 2. Se banco está corrompido:
# Restaurar backup no Supabase Dashboard
# Backups → Selecione backup anterior → Restore
```

---

## Step 8: Notificação aos Usuários

### Enviar comunicação:

**Assunto:** Atualização do Sistema de Ponto - Novo Tutorial Disponível

**Corpo:**
```
Caro usuário,

Realizamos uma grande atualização no sistema de ponto eletrônico:

✨ Novidades:
- Tutorial passo-a-passo em https://seu-app.com/ajuda
- Perguntas frequentes sobre reconhecimento facial
- Melhor tratamento de erros
- Fluxo de login mais seguro

🎓 Sugestão:
Visite a página "Ajuda" para entender melhor como usar o sistema.

Se tiver problemas, contate: suporte@seu-email.com

Obrigado!
```

---

## ✅ OK para Produção - Checklist Final

- [ ] SQL executado sem erros
- [ ] Code buildou sem erros
- [ ] Login funciona (novo + existente)
- [ ] Primeiro acesso funciona
- [ ] Registro de ponto funciona
- [ ] Admin painel funciona
- [ ] /ajuda acessível publicamente
- [ ] Console logs aparecem corretamente
- [ ] Performance aceitável
- [ ] Segurança OK
- [ ] Backup feito
- [ ] Usuários notificados

---

## 📞 Troubleshooting

| Problema | Solução |
|----------|---------|
| "permission denied" ao fazer ponto | Verificar RLS policies em profiles e ponto_logs |
| Login falha mesmo com credenciais certas | Verificar NEXT_PUBLIC_SUPABASE_URL e ANON_KEY |
| Câmera não abre | Verificar permissões HTTPS (obrigatório para câmera) |
| Foto mestra não salva | Verificar Storage bucket `ponto-fotos` existe e RLS |
| /ajuda mostra 404 | Verificar arquivo criado em `src/app/ajuda/page.tsx` |
| Logs não aparecem | Abrir F12 → Console, limpar filters |

---

## 📊 Métricas para Acompanhar (Pós-Deploy)

Após 1 semana de produção:

- [ ] Taxa de login bem-sucedida > 95%
- [ ] Taxa de erro de reconhecimento facial < 5%
- [ ] Tempo médio de registro de ponto < 10s
- [ ] Usuários acessando /ajuda > 20%
- [ ] Zero bugs críticos relatados

---

**Status:** 🟢 Pronto para Deploy  
**Data da Checklist:** 2024  
**Versão:** 2.0 Production Ready
