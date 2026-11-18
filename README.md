# Pokédex de Cartas

A minha Pokédex pessoal para acompanhar a coleção de cartas Pokémon: os 1025 Pokémon, com os que já tenho em carta destacados.

**Ver online:** https://rolimjeferson26-cyber.github.io/pokedex-cartas/

## O que faz
- Mostra todos os Pokémon (Geração 1 a 9) com a arte oficial, número e nome (inglês e japonês).
- Destaca os que já tenho, com o número de cartas de cada um.
- Progresso da coleção (Pokémon e total de cartas).
- Pesquisa por nome (EN/JP) ou número, filtro "Tenho / Faltam" e por geração.
- Toca num Pokémon para ver as cartas que tenho dele e usar **+ / −** quando conseguir (ou trocar) cartas.
- **Não quero**: manda um Pokémon para a lixeira 🗑 — sai da contagem e da grelha, mas pode voltar a qualquer momento.
- **Objetivo**: escolher entre "Todos os Pokémon" (1025) e "Gen 1" (151); a barra de progresso acompanha o objetivo.
- **📋 Lista do que falta**: lista dos Pokémon em falta no objetivo atual, com botão para copiar.
- Exportar / importar a coleção (quantidades + lixeira) em JSON.

## Como funciona
Site estático (HTML, CSS e JavaScript puro), sem servidor nem dependências.

- `data/colecao.json` — as cartas do meu fichário (Pokémon, coleção, número, idioma).
- `data/pokemon.json` — lista dos 1025 Pokémon (gerada a partir do pacote npm [`pokemon`](https://www.npmjs.com/package/pokemon)).
- As alterações feitas no app ficam no `localStorage` do dispositivo. Para as tornar "oficiais", exporto e atualizo o `colecao.json`.

### Segurança
- Content Security Policy restritiva (só scripts locais; imagens só do repositório de sprites da PokeAPI).
- Nenhum dado é enviado para lado nenhum; o texto é sempre inserido com `textContent` (sem `innerHTML`).
- Ficheiros importados são validados (só números inteiros por Pokémon, tamanho limitado).

## Correr localmente
```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Créditos
Sprites: [PokeAPI/sprites](https://github.com/PokeAPI/sprites). Pokémon e respetivos nomes © Nintendo / Creatures / GAME FREAK / The Pokémon Company. Projeto de fã, sem fins comerciais.

## Licença
Código sob licença MIT.
