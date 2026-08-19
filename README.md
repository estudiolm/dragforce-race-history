# DragForce Race History

Aplicação web (site estático, sem servidor/backend) com a identidade visual da **DragForce**, desenvolvida com a assinatura **Powered by Boost Club**. Guarda toda a garagem — carros, eventos, passadas e inspeções — localmente no navegador (IndexedDB), com fotos de carro tratadas de forma consistente e um visual de motorsport/dados.

## Como abrir

Não precisa instalar nada. Duas opções:

1. **Mais simples:** dê duplo clique em `index.html` (funciona na maioria dos navegadores modernos).
2. **Recomendado** (evita qualquer bloqueio de segurança do navegador para `file://`): sirva a pasta com um servidor estático simples. Exemplos:
   ```bash
   # Python
   python3 -m http.server 8000
   # depois abra http://localhost:8000

   # ou Node
   npx serve .
   ```

Os dados ficados cadastrados (carros, fotos, eventos etc.) ficam salvos no navegador daquele computador. Para levar o sistema para produção de verdade (multiusuário, acesso de qualquer lugar, backup em nuvem), o próximo passo natural é publicar esses mesmos arquivos em uma hospedagem e trocar a camada `js/db.js` por chamadas a uma API — ver seção **Evoluindo para um backend** abaixo.

## Estrutura

```
dragforce/
├── index.html              → shell da aplicação (header, rotas, footer)
├── css/
│   ├── tokens.css          → paleta de cores, tipografia, espaçamentos (design system)
│   ├── fonts.css           → fontes auto-hospedadas (sem depender de internet)
│   ├── base.css            → reset e estilos globais
│   ├── layout.css          → header, navegação, rodapé
│   └── components.css      → cards, botões, tabelas, timeline, modais, uploader...
├── js/
│   ├── config.js               → credenciais do Supabase (vazio = modo local)
│   ├── db.js                    → camada de dados local (IndexedDB) → DF.dbLocal
│   ├── db-supabase.js           → camada de dados Supabase (mesma interface) → DF.dbSupabase
│   ├── auth.js                   → login/logout real (só ativo no modo Supabase)
│   ├── utils.js                   → formatação, compressão de imagem, toasts
│   ├── ui.js                       → modais, lightbox, formulário de carro
│   ├── seed.js                     → dados de exemplo (só no modo local, 1ª execução)
│   ├── app.js                       → roteador + escolhe DF.db local/Supabase automaticamente
│   └── pages/                       → uma página por arquivo
├── supabase/
│   └── schema.sql              → tabelas, RLS e bucket de fotos — ver GUIA-GITHUB-SUPABASE.md
├── assets/
│   ├── logos/                 → dragforce-logo.png, dragforce-emblem.png, boostclub-logo.png
│   ├── car-placeholder.svg    → placeholder elegante para carro sem foto
│   ├── fonts/                 → arquivos .woff2 (Orbitron, Rajdhani, Inter, JetBrains Mono)
│   └── vendor/chart.js        → biblioteca do gráfico de evolução de tempos
└── GUIA-GITHUB-SUPABASE.md    → passo a passo para GitHub + Supabase
```

## Logos

`assets/logos/` já usa as logos reais da equipe:

| Arquivo                             | Onde aparece                                                          |
|--------------------------------------|------------------------------------------------------------------------|
| `assets/logos/dragforce-logo.png`    | Header, tela de login, página Sobre (wordmark "DragForce")             |
| `assets/logos/dragforce-emblem.png`  | Favicon, hero da página Sobre, marca d'água na tela de login (caveira) |
| `assets/logos/boostclub-logo.png`    | Rodapé, badge "Powered by", tela de login, página Sobre                |

Se um dia quiser atualizar alguma logo, **basta substituir o arquivo mantendo o mesmo nome** — nenhum ajuste de layout é necessário (os espaços já são dimensionados por altura, com largura automática). Os arquivos originais em alta resolução ficam em `assets/logos-original/` (não usados pelo site, só como material-fonte de backup).

## Fotos dos carros

* Upload é feito diretamente no cadastro/edição do carro (botão **"+ Novo carro"** ou **"Editar carro"**).
* A imagem é recortada para proporção 16:10, redimensionada e comprimida no próprio navegador antes de salvar — carregamento rápido, tamanho de arquivo pequeno, aparência consistente em todos os cards.
* Sem foto cadastrada → usa o placeholder `assets/car-placeholder.svg` (ilustração abstrata de motorsport, não é a foto de nenhum carro real).
* Clique na foto (card, ficha do carro) abre a visualização ampliada (lightbox).

## Dados de exemplo

Na primeira vez que o sistema é aberto, ele cadastra automaticamente um carro de exemplo (**GOL AP 2.1**, sem foto) com eventos, passadas e inspeções fictícias, só para demonstrar o layout funcionando com dados reais. Isso acontece **uma única vez** — depois disso, os dados são só o que você cadastrar.

Para recomeçar do zero (apagar tudo, inclusive o exemplo): abra o DevTools do navegador → aba *Application* → *IndexedDB* → apague o banco `dragforce-race-history` → recarregue a página.

## Dois modos: local e Supabase

O sistema já vem pronto para os dois modos, e escolhe sozinho qual usar:

* **Modo local (padrão)** — `js/config.js` vazio. Dados só no navegador (IndexedDB), sem login real, com os dados de exemplo. É o modo de demonstração/teste.
* **Modo Supabase (produção/equipe)** — assim que `js/config.js` recebe a URL e a chave do seu projeto Supabase, o sistema passa a exigir login de verdade e guardar tudo (carros, fotos, eventos) num banco compartilhado pela equipe, na nuvem.

O passo a passo completo para ativar o modo Supabase (e também para colocar o código no GitHub e publicar o site com uma URL própria) está em **[`GUIA-GITHUB-SUPABASE.md`](./GUIA-GITHUB-SUPABASE.md)**, junto com o schema pronto em `supabase/schema.sql`.

## Tela de login

No modo local, a tela `#/login` é só a camada visual/UX (qualquer e-mail/senha leva ao dashboard, sem checar nada) — ela existe para já reservar o espaço visual e a assinatura Boost Club. No modo Supabase, o login passa a ser real: exige um usuário cadastrado no projeto (ver guia) e protege todas as rotas do sistema.
