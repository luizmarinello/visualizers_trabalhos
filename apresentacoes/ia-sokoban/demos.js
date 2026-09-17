/* --------------------------------------------------------------------------
   demos.js - as demonstrações interativas do seminário de IA.

   Nada aqui recalcula busca nenhuma. Os números e a ordem de expansão vêm
   prontos de dados.js, que é gerado por `python main.py --completo --dados`.
   O navegador só anima o que o Python já mediu.
   -------------------------------------------------------------------------- */

(function () {
  "use strict";

  var D = window.DADOS || {};

  /* --- leitura do mapa ---------------------------------------------------- */

  // Converte um mapa em texto (#, ., @, C, x, *) num objeto com paredes,
  // alvos, agente e caixas. Mesmo formato do sokoban.py.
  function lerMapa(linhas) {
    var mapa = {
      linhas: linhas.length,
      colunas: 0,
      paredes: {},
      alvos: {},
      agente: null,
      caixas: []
    };
    linhas.forEach(function (linha, i) {
      mapa.colunas = Math.max(mapa.colunas, linha.length);
      for (var j = 0; j < linha.length; j++) {
        var c = linha[j], k = i + "," + j;
        if (c === "#") mapa.paredes[k] = true;
        else if (c === "x") mapa.alvos[k] = true;
        else if (c === "C") mapa.caixas.push([i, j]);
        else if (c === "*") { mapa.alvos[k] = true; mapa.caixas.push([i, j]); }
        else if (c === "@") mapa.agente = [i, j];
        else if (c === "+") { mapa.alvos[k] = true; mapa.agente = [i, j]; }
      }
    });
    return mapa;
  }

  // Becos sem saída: mesma regra do sokoban.py — célula livre, não-alvo, com
  // parede acima ou abaixo E parede à esquerda ou à direita.
  function becos(mapa) {
    var mortos = {};
    for (var i = 0; i < mapa.linhas; i++) {
      for (var j = 0; j < mapa.colunas; j++) {
        var k = i + "," + j;
        if (mapa.paredes[k] || mapa.alvos[k]) continue;
        var v = mapa.paredes[(i - 1) + "," + j] || mapa.paredes[(i + 1) + "," + j];
        var h = mapa.paredes[i + "," + (j - 1)] || mapa.paredes[i + "," + (j + 1)];
        if (v && h) mortos[k] = true;
      }
    }
    return mortos;
  }

  /* --- desenho ------------------------------------------------------------ */

  // Desenha qualquer tabuleiro dentro de `el`.
  //   estado  { agente: [i,j], caixas: [[i,j], ...] }
  //   opcoes  calor   { "i,j": 0..1 }  pinta a célula proporcionalmente
  //           marcar  { "i,j": true }  contorna a célula
  //           mortos  true             pinta os becos sem saída
  //           cel     tamanho da célula em px
  function desenharTabuleiro(el, mapa, estado, opcoes) {
    opcoes = opcoes || {};
    el.className = "tabuleiro";
    el.style.gridTemplateColumns = "repeat(" + mapa.colunas + ", var(--cel))";
    if (opcoes.cel) el.style.setProperty("--cel", opcoes.cel + "px");

    var mortos = opcoes.mortos ? becos(mapa) : {};
    var caixas = {};
    (estado.caixas || []).forEach(function (c) { caixas[c[0] + "," + c[1]] = true; });
    var ag = estado.agente;

    var html = "";
    for (var i = 0; i < mapa.linhas; i++) {
      for (var j = 0; j < mapa.colunas; j++) {
        var k = i + "," + j, cls = ["cel"], estilo = "";
        if (mapa.paredes[k]) cls.push("parede");
        else {
          if (mapa.alvos[k]) cls.push("alvo");
          if (mortos[k]) cls.push("morto");
          if (caixas[k]) { cls.push("caixa"); if (mapa.alvos[k]) cls.push("sobre-alvo"); }
          if (ag && ag[0] === i && ag[1] === j) cls.push("agente");
          if (opcoes.marcar && opcoes.marcar[k]) cls.push("marcado");
          if (opcoes.calor && opcoes.calor[k]) {
            var a = Math.min(1, opcoes.calor[k]);
            estilo = ' style="background:color-mix(in srgb, var(--destaque) ' +
                     Math.round(a * 70) + '%, var(--fundo-2))"';
          }
        }
        html += '<div class="' + cls.join(" ") + '"' + estilo + "></div>";
      }
    }
    el.innerHTML = html;
  }

  /* --- regras do jogo ------------------------------------------------------ */

  var DIR = { CIMA: [-1, 0], BAIXO: [1, 0], ESQUERDA: [0, -1], DIREITA: [0, 1] };

  // Aplica um movimento. Devolve o estado novo, ou null se o movimento é
  // ilegal. É a mesma regra de acoes()+resultado() do sokoban.py: se há caixa
  // no destino, ela é empurrada para a célula seguinte, e só se essa estiver
  // livre de parede e de outra caixa.
  function mover(mapa, estado, direcao) {
    var d = DIR[direcao];
    if (!d) return null;
    var ai = estado.agente[0] + d[0], aj = estado.agente[1] + d[1];
    if (mapa.paredes[ai + "," + aj]) return null;

    var idx = -1;
    estado.caixas.forEach(function (c, i) { if (c[0] === ai && c[1] === aj) idx = i; });

    var caixas = estado.caixas.map(function (c) { return [c[0], c[1]]; });
    if (idx >= 0) {
      var si = ai + d[0], sj = aj + d[1];
      if (mapa.paredes[si + "," + sj]) return null;
      var ocupada = caixas.some(function (c) { return c[0] === si && c[1] === sj; });
      if (ocupada) return null;
      caixas[idx] = [si, sj];
    }
    return { agente: [ai, aj], caixas: caixas };
  }

  function venceu(mapa, estado) {
    return estado.caixas.every(function (c) { return mapa.alvos[c[0] + "," + c[1]]; });
  }

  /* --- demo 1: tabuleiro jogável ------------------------------------------ */

  // O labirinto da instância 1, jogável com as setas. Tem desfazer, recomeçar
  // e reprodução da solução ótima que o A* encontrou.
  function tabuleiroJogavel(cfg) {
    var slide = document.querySelector(cfg.slide);
    var el = slide.querySelector(cfg.tabuleiro);
    var painel = slide.querySelector(cfg.painel);
    var mapa = lerMapa(cfg.mapa);

    var inicial = { agente: mapa.agente, caixas: mapa.caixas };
    var historico = [inicial];
    var tocando = null;

    function estado() { return historico[historico.length - 1]; }

    function pintar() {
      desenharTabuleiro(el, mapa, estado(), { cel: cfg.cel || 56 });
      var passos = historico.length - 1;
      var fim = venceu(mapa, estado());
      painel.innerHTML =
        '<span class="info">passos: <b>' + passos + "</b></span>" +
        (fim ? ' <span class="ok forte">resolvido!</span>' : "") +
        (fim && cfg.otimo && passos > cfg.otimo
          ? ' <span class="miudo">(o ótimo são ' + cfg.otimo + ")</span>" : "");
    }

    function aplicar(direcao) {
      var novo = mover(mapa, estado(), direcao);
      if (!novo) return;
      historico.push(novo);
      pintar();
    }

    function parar() { if (tocando) { clearInterval(tocando); tocando = null; } }

    function reiniciar() { parar(); historico = [inicial]; pintar(); }

    function desfazer() { parar(); if (historico.length > 1) historico.pop(); pintar(); }

    function tocarSolucao() {
      parar();
      historico = [inicial];
      pintar();
      var i = 0;
      tocando = setInterval(function () {
        if (i >= cfg.solucao.length) { parar(); return; }
        aplicar(cfg.solucao[i++]);
      }, cfg.ritmo || 420);
    }

    slide.querySelectorAll("[data-jogo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.jogo;
        if (a === "reiniciar") reiniciar();
        else if (a === "desfazer") desfazer();
        else if (a === "solucao") tocarSolucao();
      });
    });

    // As setas só valem quando este slide está na tela. O deck.js já devolve
    // as setas para cá por causa do data-arrows="demo" no <section>.
    var ativo = false;
    slide.addEventListener("slide:entrou", function () { ativo = true; pintar(); });
    slide.addEventListener("slide:saiu", function () { ativo = false; parar(); });

    document.addEventListener("keydown", function (ev) {
      if (!ativo) return;
      var mapaTeclas = {
        ArrowUp: "CIMA", ArrowDown: "BAIXO",
        ArrowLeft: "ESQUERDA", ArrowRight: "DIREITA"
      };
      if (mapaTeclas[ev.key]) { parar(); aplicar(mapaTeclas[ev.key]); ev.preventDefault(); }
    });

    pintar();
  }

  /* --- demo 2: a corrida das três buscas ---------------------------------- */

  // Os três algoritmos varrendo o mesmo labirinto lado a lado, na ordem real
  // em que cada um retirou estados da fronteira, todos a um nó por ciclo.
  // A ordem vem das trilhas gravadas pelo main.py: nada é recalculado aqui.
  function corridaDasBuscas(cfg) {
    var slide = document.querySelector(cfg.slide);
    var mapa = lerMapa(cfg.mapa);

    var pistas = cfg.pistas.map(function (p) {
      return {
        rotulo: p.rotulo,
        tabuleiro: slide.querySelector(p.tabuleiro),
        placar: slide.querySelector(p.placar),
        // "LCLC" por expansão: linha e coluna do agente, linha e coluna da caixa
        passos: (p.trilha.match(/.{4}/g) || []).map(function (s) {
          return {
            agente: [+s[0], +s[1]],
            caixas: [[+s[2], +s[3]]]
          };
        }),
        i: 0,
        calor: {}
      };
    });

    var relogio = null;

    function pintarPista(p) {
      var estado = p.passos[Math.max(0, p.i - 1)] || p.passos[0];
      desenharTabuleiro(p.tabuleiro, mapa, estado, {
        cel: cfg.cel || 34,
        calor: p.calor
      });
      // O último estado da trilha é o nó objetivo: ele sai da fronteira, o
      // teste de objetivo dispara e a busca devolve antes de gerar filhos.
      // Por isso expandidos = trilha - 1.
      var expandidos = Math.min(p.i, p.passos.length - 1);
      var fim = p.i >= p.passos.length;
      p.placar.innerHTML =
        "<span>" + p.rotulo + "</span> <b>" + expandidos + "</b>" +
        (fim ? ' <span class="ok">achou</span>' : "");
    }

    function ciclo() {
      var acabou = true;
      pistas.forEach(function (p) {
        if (p.i < p.passos.length) {
          var e = p.passos[p.i];
          var k = e.caixas[0][0] + "," + e.caixas[0][1];
          p.calor[k] = Math.min(1, (p.calor[k] || 0) + 0.18);
          p.i++;
          acabou = false;
        }
        pintarPista(p);
      });
      if (acabou) parar();
    }

    function parar() { if (relogio) { clearInterval(relogio); relogio = null; } }

    function comecar() {
      parar();
      relogio = setInterval(ciclo, cfg.ritmo || 90);
    }

    function reiniciar() {
      parar();
      pistas.forEach(function (p) { p.i = 0; p.calor = {}; pintarPista(p); });
    }

    slide.querySelectorAll("[data-corrida]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.corrida;
        if (a === "correr") comecar();
        else if (a === "pausar") parar();
        else if (a === "reiniciar") reiniciar();
        else if (a === "passo") { parar(); ciclo(); }
      });
    });

    slide.addEventListener("slide:entrou", function () { reiniciar(); });
    slide.addEventListener("slide:saiu", parar);

    reiniciar();
  }

  /* --- preenchimento das tabelas ------------------------------------------ */

  // Preenche qualquer <td data-num="instancia3.ucs.expandidos"> com o número
  // medido. Assim nenhum resultado fica digitado à mão no HTML: se o main.py
  // for rodado de novo e algum número mudar, o slide muda junto.
  function preencherNumeros() {
    document.querySelectorAll("[data-num]").forEach(function (el) {
      var valor = el.dataset.num.split(".").reduce(function (o, k) {
        return (o || {})[k];
      }, D.resultados || {});
      if (valor === null || valor === undefined) { el.textContent = "—"; return; }
      if (typeof valor !== "number") { el.textContent = String(valor); return; }
      // Tempo sempre com 3 casas: sem isso, 0,000 s vira "0" na tabela e
      // parece que a medição faltou.
      var casas = /\.tempo$/.test(el.dataset.num) ? 3 : 0;
      el.textContent = valor.toLocaleString("pt-BR", {
        minimumFractionDigits: casas, maximumFractionDigits: casas
      });
    });
    // Onde a busca não concluiu, o custo não existe: marca a linha.
    document.querySelectorAll("[data-status]").forEach(function (el) {
      var valor = el.dataset.status.split(".").reduce(function (o, k) {
        return (o || {})[k];
      }, D.resultados || {});
      if (valor && valor !== "ok") el.textContent = "não concluiu";
    });
  }

  window.SokobanDemos = {
    lerMapa: lerMapa,
    desenharTabuleiro: desenharTabuleiro,
    tabuleiroJogavel: tabuleiroJogavel,
    corridaDasBuscas: corridaDasBuscas,
    preencherNumeros: preencherNumeros
  };
})();
