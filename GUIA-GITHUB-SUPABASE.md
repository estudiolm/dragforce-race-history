# Guia: colocando o DragForce Race History no GitHub + Supabase

Este guia parte de onde o projeto está agora: um site já pronto, funcionando localmente (modo demonstração, dados só no seu navegador). O objetivo aqui é dar dois passos:

1. **Supabase** — dar ao sistema um banco de dados de verdade, compartilhado pela equipe, com login e fotos guardadas na nuvem.
2. **GitHub** — colocar o código num repositório, com um histórico de versões, e (opcionalmente) publicar o site com uma URL pública.

Nenhum dos dois é obrigatório para usar o sistema — ele já funciona sozinho, no seu navegador. Faça isso quando quiser que a equipe toda use os mesmos dados.

---

### ✅ Já feito por mim nesta sessão (via conector Supabase)

- Projeto criado: **`dragforce-race-history`**, na organização `LmEstudioBase` (a mesma do sistema do estúdio), região São Paulo (`sa-east-1`).
- Schema aplicado: as 4 tabelas (`cars`, `events`, `passes`, `inspections`), RLS e o bucket `car-photos` já existem no projeto.
- `js/config.js` já está preenchido com a URL e a chave `anon` reais desse projeto — o site já está rodando em **modo Supabase** (a tela de login agora exige um usuário de verdade).
- Verifiquei os avisos de segurança (advisors) do projeto: nenhum encontrado.

Só faltam os dois passos abaixo, que só dá pra fazer pelo painel do Supabase (não há uma ferramenta seguindo o padrão de segurança do Supabase para isso via API):

### 1.1. Criar os usuários da equipe

Por padrão o Supabase permite qualquer pessoa se cadastrar sozinha. Para um sistema de equipe, o mais seguro é **você criar as contas manualmente** e desativar o cadastro público:

1. Vá em **Authentication → Providers → Email** e desative **"Enable email signups"**.
2. Vá em **Authentication → Users → Add user → Create new user**. Cadastre o e-mail e uma senha para cada piloto/membro da equipe que vai usar o sistema.

### 1.2. O que já funciona no modo Supabase, e o que ainda não

✅ Login real da equipe, cadastro/edição de carros, upload de fotos (guardadas no Storage do Supabase, não mais no navegador), cadastro de **eventos**, **passadas**, **inspeções** e **manutenções** direto na ficha do carro.

---

## Parte 2 — GitHub (versionamento do código)

O projeto já está com o Git inicializado localmente (primeiro commit feito). Falta só criar o repositório vazio no GitHub e apontar pra ele.

### 2.1. Criar o repositório

1. Entre em [github.com/new](https://github.com/new).
2. Nome sugerido: `dragforce-race-history`.
3. Deixe **Public** ou **Private** (sua escolha — se for Private, só quem você convidar consegue ver o código).
4. **Não** marque "Add a README" nem ".gitignore" (o projeto já vem com os dois) — crie o repositório vazio mesmo.
5. Clique em **Create repository**.

### 2.2. Subir o código

O GitHub vai te mostrar uma URL parecida com `https://github.com/SEU-USUARIO/dragforce-race-history.git`. Dentro da pasta do projeto, rode:

```bash
git remote add origin https://github.com/SEU-USUARIO/dragforce-race-history.git
git push -u origin main
```

(Se aparecer pedido de login, use seu usuário do GitHub e um *personal access token* como senha — o GitHub explica como gerar um na hora, ou você pode usar `gh auth login` se tiver o GitHub CLI instalado.)

Pronto — o código está versionado no GitHub. A partir de agora, sempre que fizer uma mudança:

```bash
git add -A
git commit -m "descrição do que mudou"
git push
```

### 2.3. (Opcional) Publicar o site com uma URL pública

O site é 100% estático (HTML/CSS/JS puro) — dá pra publicar de graça em qualquer um destes:

**Vercel** (mais simples):
1. Entre em [vercel.com](https://vercel.com), faça login com GitHub.
2. **Add New → Project**, escolha o repositório `dragforce-race-history`.
3. Não precisa configurar nada (não há build) — clique em **Deploy**.
4. Em ~30 segundos você tem uma URL tipo `dragforce-race-history.vercel.app`. Todo `git push` para `main` atualiza o site sozinho.

**Netlify** funciona do mesmo jeito (Add new site → Import from GitHub → Deploy, sem configurar build command).

**GitHub Pages** (alternativa sem depender de outro serviço): em **Settings → Pages** do repositório, escolha a branch `main` e a pasta raiz (`/`) como fonte — o GitHub te dá uma URL `SEU-USUARIO.github.io/dragforce-race-history`.

---

## Resumo da ordem recomendada

1. ~~Criar projeto Supabase → rodar schema → colar credenciais~~ — já feito.
2. No painel do Supabase: desativar cadastro público e criar o login de cada membro da equipe (**Parte 1.1** acima).
3. Testar localmente (abrindo `index.html`) que o login e o cadastro de carro/foto já estão indo pro Supabase.
4. Criar o repositório no GitHub → `git push` (**Parte 2** acima).
5. (Opcional) conectar o repositório a um Vercel/Netlify para ter uma URL pública e atualizações automáticas a cada push.

## Credenciais do projeto (referência rápida)

- **Painel do projeto:** https://supabase.com/dashboard/project/vajqdzkoqlazvaxsedzk
- **Project URL:** `https://vajqdzkoqlazvaxsedzk.supabase.co` (já está em `js/config.js`)
- **Organização:** `LmEstudioBase`
- A senha do banco de dados (Postgres) foi gerada automaticamente pelo Supabase na criação — se precisar dela algum dia (conexão direta ao Postgres, fora do site), pegue/redefina em **Project Settings → Database**.
