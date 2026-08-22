# LifeBar — Game Catalog

Catálogo pessoal de jogos para acompanhar quais já joguei. A primeira plataforma cadastrada é o Sega Genesis/Mega Drive, mas "Mega Drive", "Genesis" e demais consoles são tratados como **tags de plataforma** associadas aos jogos, não como parte da marca do projeto — "Sega", "Mega Drive" e "Genesis" são marcas registradas de seus respectivos detentores, sem qualquer vínculo ou afiliação oficial com este projeto (veja [`NOTICE.md`](NOTICE.md)).

"LifeBar" é a marca guarda-chuva do projeto, pensada para crescer com outras plataformas/tags no mesmo catálogo, sem precisar de um site por console.

- Dados extraídos da [lista de jogos licenciados da Wikipedia](https://en.wikipedia.org/wiki/List_of_Sega_Genesis_games#Licensed_games) (880 jogos).
- Site 100% estático (HTML/CSS/JS puro), pensado para rodar no GitHub Pages.
- Sem backend: os dados ficam em arquivos JSON versionados no repositório.

## Estrutura

- `data/games.json` — catálogo completo (título, desenvolvedora, publicadora, datas de lançamento por região, ano).
- `data/played.json` — jogos marcados como jogados (`{ "<id>": { "played": true, "dateAdded": "YYYY-MM-DD" } }`).
- `data/boxarts.json` — mapeamento `id do jogo -> nome do arquivo` de capa no repositório [libretro-thumbnails](https://github.com/libretro-thumbnails/Sega_-_Mega_Drive_-_Genesis) (Tec Toy/Brasil tem precedência, depois USA/Europe/World, por último Japão). As imagens em si **não** ficam no repositório — são carregadas sob demanda via `loading="lazy"`, primeiro pelo mirror [jsdelivr](https://www.jsdelivr.com/) do repositório (CDN rápida, feita pra hotlink; ~70ms depois de aquecida) e, se falhar, pelo `thumbnails.libretro.com` oficial como fallback. 876 de 880 jogos têm capa mapeada; os 4 restantes (BreakThru!, Iron Hammer, Klondike, The Chessmaster) foram exclusivos digitais do Sega Channel sem lançamento físico — não existe caixa oficial, então não há nada nem em `Named_Boxarts`, nem em `Named_Snaps`/`Named_Titles` do libretro. Esses mostram um ícone genérico (`assets/boxart-placeholder.svg`) no lugar da capa. O carregamento é assíncrono e sob demanda (`loading="lazy"` + `fetchpriority="low"`), então só as capas visíveis na tela são baixadas conforme você rola a página — o navegador ainda faz cache normalmente entre visitas.
- `data/details.json` — metadados extras por jogo, mesclados de duas fontes:
  - Gênero, franquia, número de jogadores, classificação etária e serial vêm do [libretro-database](https://github.com/libretro/libretro-database) via `tools/extract_rdb_details.py`. 878 de 880 jogos têm alguma metadata mapeada, 839 com gênero especificamente. `tools/details-overrides.json` guarda o mapeamento manual `id do jogo -> título exato no RDB` pros ~30 casos que a normalização automática (mácrons, pontuação, "Título, The") não resolveu sozinha. Dois relatórios ficam pra curadoria manual futura: `tools/details-unmatched.txt` (1 jogo sem nenhuma entrada no RDB) e `tools/details-missing-genre.txt` (40 jogos que casaram mas cujas entradas no RDB não têm o campo gênero preenchido) — ver item 3 do `ROADMAP.md`.
  - Sinopse (`summary`) vem da [IGDB](https://www.igdb.com/) via `tools/extract_igdb_details.py`. 767 de 880 jogos têm sinopse. Precisa de credenciais próprias (veja `.env.example`) — não é rodado automaticamente, cada pessoa que quiser atualizar a sinopse gera seu próprio client_id/secret na Twitch Dev Console. `tools/igdb-overrides.json` guarda o mapeamento manual pros ~20 casos com prefixo de licença que o IGDB usa e a Wikipedia não (ex. "Aladdin" -> "Disney's Aladdin", "Batman" -> "Batman: The Video Game"); `tools/igdb-unmatched.txt` lista os 113 que sobraram pra curadoria futura.
- `assets/lifebar-logo.svg`, `assets/life-gauge.svg`, `assets/boxart-placeholder.svg` — ícones/imagens pixel art da marca (logo "LIFEBAR", medidor de vida decorativo abaixo do logo e placeholder de capa), em arquivos separados para facilitar edição. Cores fixas no próprio arquivo (não usam as variáveis CSS de `style.css`, já que SVGs carregados via `<img>` não herdam custom properties da página).
- `index.html`, `style.css`, `app.js` — a listagem principal.
- `game.html`, `game.js` — página de detalhe de um jogo (`game.html?id=<id>`), com capa maior, desenvolvedora/publicadora, datas por região, gênero/franquia/jogadores/classificação/serial (quando `data/details.json` tiver), sinopse e o checkbox de "jogado" (edita o mesmo estado da listagem).
- `common.js` — funções compartilhadas entre `app.js` e `game.js` (chave/leitura/escrita do `localStorage` de marcações, fallback de capa entre jsdelivr/thumbnails.libretro.com/placeholder).
- `tools/extract_rdb_details.py` — script Python (stdlib apenas) que baixa o `.rdb` do libretro-database, faz o parsing do formato binário próprio (msgpack customizado) e casa por título normalizado com `data/games.json`, gerando `data/details.json`. Rode de novo com `python3 tools/extract_rdb_details.py` para atualizar quando o RDB upstream mudar.
- `tools/extract_igdb_details.py` — script Python (stdlib apenas) que busca a sinopse de cada jogo na [IGDB API](https://api-docs.igdb.com/) e mescla em `data/details.json`. Precisa de `IGDB_CLIENT_ID`/`IGDB_CLIENT_SECRET` no ambiente — copie `.env.example` para `.env` (já no `.gitignore`, nunca commitar) com suas credenciais e rode `set -a; source .env; set +a; python3 tools/extract_igdb_details.py`.

## Marcando um jogo como jogado

Na página, clique no checkbox "Jogado" na linha do jogo. Isso salva a marcação no `localStorage` do navegador imediatamente.

Como o site é estático, essa marcação **não é salva automaticamente no repositório**. Para persistir de verdade (e ver o progresso em qualquer dispositivo/navegador):

1. Clique em "Exportar played.json".
2. Copie o JSON gerado.
3. Cole em `data/played.json`, substituindo o conteúdo.
4. Commit e push.

Alternativamente, edite `data/played.json` diretamente, adicionando o `id` do jogo (visível na URL ao passar o mouse ou no próprio arquivo `games.json`).

## Rodando localmente

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000.

## Repositório privado (este) vs. site público

Este repositório é **privado** e guarda o histórico completo de desenvolvimento, `ROADMAP.md` e `CLAUDE.md` (planejamento e ideias futuras, incluindo o marketplace). O site publicado vem de um repositório **separado e público**, [`lifebar-game-catalog`](https://github.com/adalbertofjr/lifebar-game-catalog), que contém só o necessário pra rodar/ver o catálogo — sem roadmap, sem histórico de decisões internas.

Pra publicar uma atualização:

1. Faça as mudanças e commits normalmente aqui.
2. Rode `tools/publish_public.sh`: ele clona (se ainda não existir) `lifebar-game-catalog` em `~/Documents/development/lifebar-game-catalog` (ou em `$PUBLIC_REPO`, se definido), copia os arquivos públicos (`index.html`, `game.html`, `credits.html`, `en/`, `style.css`, `app.js`, `game.js`, `common.js`, `assets/`, `data/`, `LICENSE`, `NOTICE.md`, `README.md`) e deixa tudo staged (`git add`) lá pra revisão — sem commitar nem dar push sozinho.
3. Revise o `git status`/`git diff` no repositório público, depois commit e push lá. O GitHub Pages publica automaticamente em `https://adalbertofjr.github.io/lifebar-game-catalog/`.

**Nunca copiar** pro repositório público: `ROADMAP.md`, `CLAUDE.md`, `tools/` (scripts de extração/curadoria, ficam só aqui como ferramenta de desenvolvimento), `.env`/`.env.example` (credenciais) e `__pycache__/`. Esses arquivos existem só pra apoiar o desenvolvimento deste catálogo, não fazem parte do site em si.

O Pages **não** está ativado neste repositório — build "legacy" do Pages serve todos os arquivos do repositório como estão (inclusive `ROADMAP.md`/`CLAUDE.md` por URL direta, mesmo sem link), então mantê-lo desligado aqui é intencional.

## Atualizando o catálogo

Os dados foram extraídos da tabela "Licensed games" da Wikipedia em 2026-08-16. Caso a lista da Wikipedia seja atualizada, `data/games.json` pode ser regenerado repetindo o processo de scraping da tabela.

## Licença

Código sob [AGPL-3.0](LICENSE). Dados, capas e marcas de terceiros **não** estão cobertos por essa licença — veja [`NOTICE.md`](NOTICE.md) para os detalhes e fontes de cada um.
