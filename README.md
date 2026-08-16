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
- `assets/lifebar-logo.svg`, `assets/life-gauge.svg`, `assets/boxart-placeholder.svg` — ícones/imagens pixel art da marca (logo "LIFEBAR", medidor de vida decorativo abaixo do logo e placeholder de capa), em arquivos separados para facilitar edição. Cores fixas no próprio arquivo (não usam as variáveis CSS de `style.css`, já que SVGs carregados via `<img>` não herdam custom properties da página).
- `index.html`, `style.css`, `app.js` — a aplicação.

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

## Publicando no GitHub Pages

1. Crie um repositório no GitHub e faça push deste projeto.
2. Nas configurações do repositório, vá em **Settings > Pages**.
3. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
4. Salve — o site ficará disponível em `https://<usuario>.github.io/<repositorio>/`.

## Atualizando o catálogo

Os dados foram extraídos da tabela "Licensed games" da Wikipedia em 2026-08-16. Caso a lista da Wikipedia seja atualizada, `data/games.json` pode ser regenerado repetindo o processo de scraping da tabela.

## Licença

Código sob [AGPL-3.0](LICENSE). Dados, capas e marcas de terceiros **não** estão cobertos por essa licença — veja [`NOTICE.md`](NOTICE.md) para os detalhes e fontes de cada um.
