# LifeBar — Game Catalog

Catálogo pessoal de jogos, pra acompanhar quais você já jogou. Comece pelo site: **https://adalbertofjr.github.io/lifebar-game-catalog/**

A primeira plataforma cadastrada é o Sega Genesis/Mega Drive, mas "LifeBar" é a marca guarda-chuva do projeto — nomes de console aparecem só como tags associadas a cada jogo, não como parte do nome do produto. "Sega", "Mega Drive", "Genesis" e demais consoles citados são marcas registradas de seus respectivos detentores; este projeto não tem afiliação oficial com nenhuma delas (veja [`NOTICE.md`](NOTICE.md)).

Site 100% estático (HTML/CSS/JS puro) e sem backend: os dados ficam em arquivos JSON versionados neste repositório.

## Funcionalidades

- Listagem com busca e filtros (gênero, status, favoritos).
- Marcação de status por jogo — não jogado / jogado / finalizado.
- Favoritos (❤️) pros jogos que marcaram sua infância.
- Selo "Tec Toy" pros jogos lançados oficialmente no Brasil.
- Página de detalhe por jogo: capa, desenvolvedora/publicadora, datas por região, gênero, sinopse.
- Sorteio de jogo aleatório entre os que você ainda não jogou.
- Instalável como app (PWA) e funciona 100% offline depois da primeira visita.
- Créditos e fontes de dados: veja a página [Créditos](credits.html) no site.

## Marcando o status de um jogo e favoritos

Clique no ícone da coluna "Jogado" na listagem (ou o equivalente na página de detalhe) para ciclar entre não jogado → jogado → finalizado → não jogado. O coração marca/desmarca favoritos. Tudo é salvo no `localStorage` do seu navegador na hora.

Como o site é estático, isso **não é salvo automaticamente em nenhum servidor**. Pra manter o progresso entre dispositivos/navegadores diferentes:

1. Clique em "Exportar marcações" no site — inclui status e favoritos.
2. Guarde o arquivo gerado.
3. Na próxima visita (outro navegador/dispositivo), use "Importar marcações" e selecione o arquivo salvo.

## Uso offline (PWA)

O site pode ser instalado como app: o navegador (Chrome/Edge) oferece "Instalar app" na barra de endereço depois da primeira visita. Uma vez instalado (ou mesmo só visitado uma vez com internet), continua funcionando sem conexão — os dados ficam em cache no seu navegador.

## Rodando localmente

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000. (O service worker que permite uso offline só funciona em `http(s)://`, não em `file://`.)

## Licença

Código sob [AGPL-3.0](LICENSE). Dados, capas e marcas de terceiros **não** estão cobertos por essa licença — veja [`NOTICE.md`](NOTICE.md) para os detalhes e fontes de cada um.
