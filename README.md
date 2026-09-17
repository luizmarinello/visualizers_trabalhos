# visualizers

Slides de trabalhos e seminários. HTML, CSS e JavaScript puros — sem build, sem
npm, sem dependências. Abrir o arquivo no navegador já funciona.

## Estrutura

```
index.html                      página inicial, lista as apresentações
.nojekyll                       impede o Jekyll de ignorar a pasta _modelo
assets/
  style.css                     tema de TODAS as apresentações
  deck.js                       motor de slides
apresentacoes/
  _modelo/index.html            modelo em branco, para copiar
  ia-sokoban/
    index.html                  os 15 slides do seminário de IA
    demos.js                    as demos interativas
    dados.js                    gerado pelo Python — não editar a mão
guias/
  busca-em-ia/
    index.html                  guia de estudo: o que é cada conceito
    guia.js                     as demonstrações interativas
    guia.css                    layout de documento (o resto vem do tema)
```

Os **guias** são páginas que rolam, não apresentações. Servem para estudar antes
do seminário: explicam os conceitos com o tabuleiro na tela para mexer. O guia
de busca reimplementa a busca em JavaScript para poder mostrar a fronteira por
dentro, e confere sozinho se os números batem com os do Python.

## Criar uma apresentação nova

Copie `apresentacoes/_modelo/` para `apresentacoes/<nome>/` e escreva os slides.
O motor e o tema já vêm prontos.

Cada `<section class="slide">` é um slide, de 1280×720 fixo, escalado por
`transform` para caber na tela — o que se vê no monitor é o que aparece no
projetor.

## Teclas

| Tecla | O que faz |
|---|---|
| <kbd>→</kbd> <kbd>↓</kbd> <kbd>espaço</kbd> <kbd>PageDown</kbd> | próximo slide |
| <kbd>←</kbd> <kbd>↑</kbd> <kbd>PageUp</kbd> | slide anterior |
| <kbd>Home</kbd> / <kbd>End</kbd> | primeiro / último |
| <kbd>n</kbd> | notas do apresentador |
| <kbd>t</kbd> | tema claro / escuro |
| <kbd>f</kbd> | tela cheia |

O número do slide vai para o hash da URL (`.../#7`), então dá para mandar link
direto e recarregar sem perder o lugar.

## Notas do apresentador

Um `<aside>` no fim de um slide vira nota do apresentador, aberta com <kbd>n</kbd>.

> **Atenção: a nota não é privada.** Qualquer pessoa com o link consegue abri-la.
> Não escreva ali nada que não possa ser lido pela plateia.

## Classes de layout

| Classe | Para quê |
|---|---|
| `.slide.capa` | slide de abertura ou fechamento, conteúdo centrado |
| `.colunas` | duas colunas iguais |
| `.colunas.tres` | três colunas iguais |
| `.colunas.estreita-esq` | coluna esquerda fixa em 420px |
| `.colunas.estreita-dir` | coluna direita fixa em 420px |
| `.caixa` | bloco com fundo e borda |
| `.miudo` | texto pequeno e secundário |
| `.destaque` `.ok` `.alerta` `.erro` `.forte` | cor e peso do texto |
| `.tabuleiro` `.cel` | tabuleiros do Sokoban |

O conteúdo de um slide precisa caber em 720px de altura. Não há rolagem: o que
passar disso fica cortado. Se estourar, corte texto ou mova para a nota do
apresentador.

## Demos

Cada slide dispara os eventos `slide:entrou` e `slide:saiu`, que as demos usam
para ligar e desligar animações.

Um slide com `data-arrows="demo"` devolve as setas do teclado para a demo que
está dentro dele; nesse slide a navegação passa a ser feita pelo espaço.

## Publicar no GitHub Pages

```bash
git init
git add .
git commit -m "site de apresentacoes + seminario de IA"
git branch -M main
git remote add origin <URL do repositório>
git push -u origin main
```

Depois, no GitHub: **Settings → Pages → Deploy from a branch → `main` →
`/ (root)`**.

O arquivo `.nojekyll` é oculto e **precisa entrar no commit**. Sem ele o GitHub
processa o site com Jekyll, que ignora pastas iniciadas por underscore — e a
pasta `_modelo/` sumiria.
