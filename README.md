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
│   ├── users.js                 → lista de usuário/senha da equipe (login sem e-mail)
│   ├── db.js                    → camada de dados local (IndexedDB) → DF.dbLocal
│   ├── db-supabase.js           → camada de dados Supabase (mesma interface) → DF.dbSupabase
│   ├── auth.js                   → login/logout (só ativo no modo Supabase, ver js/users.js)
│   ├── utils.js                   → formatação, compressão de imagem, toasts
│   ├── ui.js                       → modais, lightbox, formulário de carro
│   ├── seed.js                     → dados de exemplo (só no modo local, 1ª execução)
│   ├── app.js                       → roteador + escolhe DF.db local/Supabase automaticamente
│   └── pages/                       → uma página por arquivo
├── supabase/
│   └── schema.sql              → tabelas, RLS e bucket de fotos — ver GUIA-GITHUB-SUPABASE.md
├── assets/
│   ├── logos/                 → dragforce-motorsport.png, dragforce-emblem.png, boostclub-logo.png
│   ├── icons/                 → ícones do app instalável (PWA), gerados a partir do emblema
│   ├── car-placeholder.svg    → placeholder elegante para carro sem foto
│   ├── fonts/                 → arquivos .woff2 (Orbitron, Rajdhani, Inter, JetBrains Mono)
│   └── vendor/chart.js        → biblioteca do gráfico de evolução de tempos
├── manifest.webmanifest       → metadados do app instalável (nome, ícones, cores)
├── sw.js                      → service worker (cache do app shell, funciona offline)
└── GUIA-GITHUB-SUPABASE.md    → passo a passo para GitHub + Supabase
```

## Logos

`assets/logos/` usa as logos reais da equipe, com fundo **transparente de verdade** (sem caixa preta atrás):

| Arquivo                                  | Onde aparece                                                            |
|--------------------------------------------|----------------------------------------------------------------------|
| `assets/logos/dragforce-motorsport.png`  | Header, tela de login, hero e card da página Sobre (logo oficial "DragForce Motorsport") |
| `assets/logos/dragforce-emblem.png`      | Ícones do app (PWA), marca d'água na tela de login (caveira)           |
| `assets/logos/boostclub-logo.png`        | Rodapé, badge "Powered by", tela de login, página Sobre                |
| `assets/logos/favicon.png` / `favicon-32.png` | Ícone da aba do navegador (emblema sobre uma placa escura arredondada) |

O nome "DragForce" no header, na tela de login e na página Sobre é a **imagem oficial da logo** (classe `.brand-logo`, em `css/layout.css`) — não é mais texto estilizado em CSS. Se um dia quiser atualizar alguma logo, **basta substituir o arquivo mantendo o mesmo nome** — nenhum ajuste de layout é necessário (os espaços já são dimensionados por altura, com largura automática).

Os arquivos originais em alta resolução ficam em `assets/logos-original/` (não usados pelo site, só como material-fonte de backup — e não vão para o Git, ver `.gitignore`).

Se precisar reprocessar as logos a partir dos arquivos-fonte (ex.: trocar por uma versão nova):

* `python3 scripts/detransparentize_logos.py` — remove fundo preto sólido dos masters já em alta resolução (`assets/logos-original/*-final.png`).
* `python3 scripts/process_motorsport_logo.py` — usado para a logo "DragForce Motorsport" que veio em baixa resolução (JPEG com fundo preto): faz upscale 4x com super-resolução (EDSR, `cv2.dnn_superres`), remove ruído de compressão, aplica nitidez e remove o fundo preto. Requer `pillow`, `numpy`, `scipy` e `opencv-contrib-python` (`pip install pillow numpy scipy opencv-contrib-python --break-system-packages`) e o modelo `EDSR_x4.pb` (baixado uma vez de `github.com/Saafke/EDSR_Tensorflow`).

Os ícones do app instalável (`assets/icons/`) são gerados a partir do emblema com `python3 scripts/generate_pwa_icons.py` — se o emblema mudar, rode esse script de novo para atualizar os ícones.

## Fotos dos carros

* Upload é feito diretamente no cadastro/edição do carro (botão **"+ Novo carro"** ou **"Editar carro"**).
* A imagem é recortada para proporção 16:10, redimensionada e comprimida no próprio navegador antes de salvar — carregamento rápido, tamanho de arquivo pequeno, aparência consistente em todos os cards.
* Sem foto cadastrada → usa o placeholder `assets/car-placeholder.svg` (ilustração abstrata de motorsport, não é a foto de nenhum carro real).
* Clique na foto (card, ficha do carro) abre a visualização ampliada (lightbox).

## Eventos e passadas

Na ficha do carro, o botão **"+ Novo evento"** (seção Histórico de eventos) cadastra um evento (nome, local, data). O botão **"+ Nova passada"** (seção Últimas passadas) registra uma passada dentro de um evento já existente — se o carro ainda não tem nenhum evento, o sistema abre primeiro o cadastro de evento e encadeia automaticamente para o de passada. Campos de uma passada:

* **Evento** (qual etapa/dia de pista) e **Pista** (E = esquerda ou D = direita).
* **Status** — Válido ou Queimou (saída antecipada/largada queimada — não conta para o melhor tempo nem entra no gráfico de evolução).
* **Reação**, **60 pés**, **100m**, **201m** (tempos parciais, em segundos) e **Vel. final** (velocidade no fim da pista, km/h).
* **Total** — calculado automaticamente como reação + 201m assim que os dois campos são preenchidos; é esse valor que aparece como "melhor tempo" e alimenta o gráfico de evolução.

Cada linha da tabela **Últimas passadas** tem dois botões na coluna de ações: ✏️ **editar** (abre o mesmo formulário já preenchido com os valores da passada, e salva como atualização — não cria um registro novo) e 🗑️ **excluir** (pede confirmação antes de apagar, ação que não pode ser desfeita).

## Inspeções e manutenções

Na ficha do carro, os botões **"+ Nova inspeção"** e **"+ Nova manutenção"** abrem um formulário rápido para registrar:

* **Inspeção** — data, tipo (ex.: inspeção técnica geral, paraquedas/gaiola), status (OK / Atenção / Crítico) e observações.
* **Manutenção** — data, serviço realizado, km/horas (opcional), custo em R$ (opcional) e observações. Fica em uma seção separada, **Histórico de manutenções**, com sua própria tabela e contador no topo da página.

Todas essas telas (eventos, passadas, inspeções, manutenções) ficam disponíveis nos dois modos (local e Supabase) e entram automaticamente na aba de dados correta.

## Dados de exemplo

Na primeira vez que o sistema é aberto, ele cadastra automaticamente um carro de exemplo (**GOL AP 2.1**, sem foto) com eventos, passadas, inspeções e manutenções fictícias, só para demonstrar o layout funcionando com dados reais. Isso acontece **uma única vez** — depois disso, os dados são só o que você cadastrar.

Para recomeçar do zero (apagar tudo, inclusive o exemplo): abra o DevTools do navegador → aba *Application* → *IndexedDB* → apague o banco `dragforce-race-history` → recarregue a página.

## Dois modos: local e Supabase

O sistema já vem pronto para os dois modos, e escolhe sozinho qual usar:

* **Modo local (padrão)** — `js/config.js` vazio. Dados só no navegador (IndexedDB), sem login real, com os dados de exemplo. É o modo de demonstração/teste.
* **Modo Supabase (produção/equipe)** — assim que `js/config.js` recebe a URL e a chave do seu projeto Supabase, o sistema passa a exigir login de verdade e guardar tudo (carros, fotos, eventos) num banco compartilhado pela equipe, na nuvem.

O passo a passo completo para ativar o modo Supabase (e também para colocar o código no GitHub e publicar o site com uma URL própria) está em **[`GUIA-GITHUB-SUPABASE.md`](./GUIA-GITHUB-SUPABASE.md)**, junto com o schema pronto em `supabase/schema.sql`.

## Tela de login

No modo local, a tela `#/login` é só a camada visual/UX (qualquer usuário/senha leva ao dashboard, sem checar nada) — ela existe para já reservar o espaço visual e a assinatura Boost Club. No modo Supabase, o login passa a checar de verdade: usuário e senha (sem e-mail) contra a lista fixa em `js/users.js`, e protege todas as rotas do sistema.

Não é uma tela de "esqueci minha senha" nem tem cadastro público — é uma lista curta e de confiança, pensada para uma equipe pequena. Ver a seção **Login da equipe** em [`GUIA-GITHUB-SUPABASE.md`](./GUIA-GITHUB-SUPABASE.md) para entender como funciona por trás dos panos (e por que ainda existe uma conta técnica única no Supabase).

## App instalável (PWA)

O site pode ser "instalado" como se fosse um aplicativo — no celular (Android/iPhone) ou no computador — ficando com ícone próprio (o emblema DragForce), abrindo em tela cheia sem barra de navegador, e funcionando offline para quem já usou o sistema antes (os dados de carros/passadas continuam exigindo internet, já que ficam no Supabase — só a "casca" do app, ou seja header/menus/telas, é que funciona sem conexão).

* **Android/Chrome/Edge (computador ou celular):** aparece um botão de instalar no header (ícone de seta pra baixo, ao lado do ícone de usuário) assim que o navegador considera o site "instalável"; também dá pra instalar pelo menu do navegador (⋮ → "Instalar app" / "Adicionar à tela inicial").
* **iPhone/iPad (Safari):** não existe esse botão automático — é: toque em **Compartilhar** (ícone de quadrado com seta) → **Adicionar à Tela de Início**.

Por trás dos panos isso é feito com dois arquivos padrão da web (nenhuma dependência nova): `manifest.webmanifest` (nome, ícones e cores do app) e `sw.js` (service worker — o script que guarda o "app shell" em cache). **Sempre que os arquivos do site forem atualizados**, é importante trocar o número em `CACHE_VERSION` no topo de `sw.js` — é isso que avisa o navegador de cada pessoa da equipe pra baixar a versão nova em vez de continuar servindo a antiga do cache.
