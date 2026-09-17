/* --------------------------------------------------------------------------
   guia.js - as demonstrações do guia de estudo.

   Diferença importante em relação ao deck do seminário: ali o navegador só
   reproduz trilhas que o Python gravou, porque basta mostrar a ordem de
   expansão. Aqui não dá: para ensinar o que é a fronteira, é preciso mostrar a
   fronteira por dentro, com o g, o h e o f de cada nó em espera.

   Então esta página reimplementa a busca em JavaScript, seguindo linha a linha
   o busca.py. Para que isso não vire uma segunda verdade, a página CONFERE
   sozinha: roda as três buscas e compara os nós expandidos com os que o Python
   mediu (guardados no dados.js). Se divergir, o rodapé avisa em vermelho.
   -------------------------------------------------------------------------- */

(function () {
  "use strict";

  var D = window.DADOS;
  var demos = window.SokobanDemos;
  var mapa = demos.lerMapa(D.mapa);
  var mortos = demos.becos(mapa);

  var INICIAL = { agente: mapa.agente, caixas: mapa.caixas };
  var ORDEM = ["CIMA", "BAIXO", "ESQUERDA", "DIREITA"];
  var SETAS = { ArrowUp: "CIMA", ArrowDown: "BAIXO",
                ArrowLeft: "ESQUERDA", ArrowRight: "DIREITA" };

  /* --- o problema, do jeito que o sokoban.py define ---------------------- */

  // A chave canônica de um estado. É o equivalente da tupla ordenada do Python:
  // a mesma configuração física tem que gerar sempre a mesma string.
  function chave(estado) {
    var caixas = estado.caixas.map(function (c) { return c[0] + "," + c[1]; });
    caixas.sort();
    return estado.agente[0] + "," + estado.agente[1] + "|" + caixas.join(";");
  }

  // h(estado): para cada caixa, a distância de Manhattan até o alvo mais
  // próximo. Soma tudo.
  function h(estado) {
    var alvos = Object.keys(mapa.alvos).map(function (k) {
      return k.split(",").map(Number);
    });
    var total = 0;
    estado.caixas.forEach(function (c) {
      var melhor = Infinity;
      alvos.forEach(function (a) {
        var d = Math.abs(c[0] - a[0]) + Math.abs(c[1] - a[1]);
        if (d < melhor) melhor = d;
      });
      total += melhor;
    });
    return total;
  }

  function objetivo(estado) {
    return estado.caixas.every(function (c) {
      return mapa.alvos[c[0] + "," + c[1]];
    });
  }

  function estadoMorto(estado) {
    return estado.caixas.some(function (c) { return mortos[c[0] + "," + c[1]]; });
  }

  // Custo de um passo: 1 por movimento, como na versão padrão do trabalho.
  function custo() { return 1; }

  var F = {
    ucs: function (no) { return no.g; },
    gulosa: function (no) { return h(no.estado); },
    estrela: function (no) { return no.g + h(no.estado); }
  };

  /* --- a busca ------------------------------------------------------------ */

  // Mesma estrutura do busca.py: fronteira ordenada por (f, ordem de entrada),
  // dicionário de alcançados, objetivo testado NA RETIRADA, entrada obsoleta
  // descartada sem contar como expandida.
  function busca(nomeF, opcoes) {
    opcoes = opcoes || {};
    var avaliar = F[nomeF];
    var registrar = opcoes.historico;

    var raiz = { estado: INICIAL, pai: null, acao: null, g: 0 };
    var ordem = 0;
    var fronteira = [{ f: avaliar(raiz), ordem: ordem++, no: raiz }];
    var alcancados = {};
    alcancados[chave(INICIAL)] = raiz;

    var gerados = 1, expandidos = 0, podados = 0;
    var historico = [];

    while (fronteira.length) {
      // Ordenar e tirar o primeiro é o mesmo que o heappop do Python: menor f,
      // e em caso de empate, quem entrou antes.
      fronteira.sort(function (a, b) { return (a.f - b.f) || (a.ordem - b.ordem); });
      var item = fronteira.shift();
      var no = item.no;

      // Entrada obsoleta: este estado já foi alcançado por um caminho melhor.
      if (alcancados[chave(no.estado)] !== no) continue;

      var achou = objetivo(no.estado);

      if (registrar) {
        historico.push({
          escolhido: { estado: no.estado, g: no.g, h: h(no.estado), f: item.f },
          fronteira: fronteira.slice(0, 8).map(function (i) {
            return { estado: i.no.estado, g: i.no.g, h: h(i.no.estado), f: i.f };
          }),
          restam: fronteira.length,
          gerados: gerados,
          expandidos: expandidos,
          achou: achou
        });
      }

      if (achou) {
        return { status: "ok", custo: no.g, acoes: caminho(no),
                 expandidos: expandidos, gerados: gerados, podados: podados,
                 historico: historico };
      }

      expandidos++;

      for (var i = 0; i < ORDEM.length; i++) {
        var estado2 = demos.mover(mapa, no.estado, ORDEM[i]);
        if (!estado2) continue;
        if (estadoMorto(estado2)) { podados++; continue; }

        var g2 = no.g + custo();
        var k = chave(estado2);
        var anterior = alcancados[k];
        if (!anterior || g2 < anterior.g) {
          var filho = { estado: estado2, pai: no, acao: ORDEM[i], g: g2 };
          alcancados[k] = filho;
          fronteira.push({ f: avaliar(filho), ordem: ordem++, no: filho });
          gerados++;
        }
      }
    }
    return { status: "sem_solucao", expandidos: expandidos, gerados: gerados,
             historico: historico };
  }

  function caminho(no) {
    var acoes = [];
    while (no.pai) { acoes.push(no.acao); no = no.pai; }
    return acoes.reverse();
  }

  /* --- utilidades de tela -------------------------------------------------- */

  function $(sel) { return document.querySelector(sel); }

  function pos(p) { return "(" + p[0] + "," + p[1] + ")"; }

  function desenhar(idOuEl, estado, opcoes) {
    var el = typeof idOuEl === "string" ? $(idOuEl) : idOuEl;
    if (el) demos.desenharTabuleiro(el, mapa, estado, opcoes);
  }

  function ligarSetas(el, aoMover) {
    // As setas só valem quando o mouse está sobre o painel ou ele tem foco,
    // senão a página inteira deixaria de rolar com o teclado.
    var dentro = false;
    el.addEventListener("mouseenter", function () { dentro = true; });
    el.addEventListener("mouseleave", function () { dentro = false; });
    document.addEventListener("keydown", function (ev) {
      if (!dentro || !SETAS[ev.key]) return;
      aoMover(SETAS[ev.key]);
      ev.preventDefault();
    });
  }

  /* --- 02. o estado ao vivo ------------------------------------------------ */

  function demoEstado() {
    var painel = $("#tab-estado").closest(".painel");
    var estado = INICIAL;

    function pintar() {
      desenhar("#tab-estado", estado, { cel: 46 });
      var caixas = estado.caixas.map(pos).sort().join(", ");
      $("#tupla-estado").innerHTML =
        "estado = ( <b>" + pos(estado.agente) + "</b>, ( <b>" + caixas + "</b> ) )";
      $("#aviso-estado").textContent = objetivo(estado)
        ? "A caixa chegou ao alvo. Este é o estado objetivo."
        : "O primeiro par é o agente. O resto são as caixas, em ordem.";
    }

    function mover(direcao) {
      var novo = demos.mover(mapa, estado, direcao);
      if (!novo) {
        $("#aviso-estado").textContent =
          "Movimento ilegal: tem parede, ou a caixa não teria para onde ir.";
        return;
      }
      estado = novo;
      pintar();
    }

    painel.querySelectorAll("[data-mover]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.mover === "reiniciar") { estado = INICIAL; pintar(); }
        else mover(b.dataset.mover);
      });
    });
    ligarSetas(painel, mover);
    pintar();
  }

  /* --- 04. a busca passo a passo ------------------------------------------ */

  function demoPassoAPasso() {
    var painel = $("#tab-passo").closest(".painel");
    var algoritmo = "estrela";
    var resultado = busca(algoritmo, { historico: true });
    var passo = 0;

    var NOMES = { ucs: "g", gulosa: "h", estrela: "g+h" };

    function pintar() {
      var h0 = resultado.historico[Math.max(0, passo - 1)];
      if (!h0) return;
      desenhar("#tab-passo", h0.escolhido.estado, { cel: 40 });

      var linhas = h0.fronteira.map(function (n) {
        return "<tr><td>" + pos(n.estado.agente) +
               " " + n.estado.caixas.map(pos).join("") + "</td>" +
               "<td>" + n.g + "</td><td>" + n.h + "</td><td>" + n.f + "</td></tr>";
      }).join("");

      var extra = h0.restam > 8
        ? '<tr><td colspan="4" class="vazio">… e mais ' + (h0.restam - 8) +
          " na fila</td></tr>" : "";

      $("#fronteira-passo").innerHTML =
        "<table><tr><th>escolhido agora</th><th>g</th><th>h</th><th>f</th></tr>" +
        '<tr class="escolhido"><td>' + pos(h0.escolhido.estado.agente) + " " +
        h0.escolhido.estado.caixas.map(pos).join("") + "</td><td>" +
        h0.escolhido.g + "</td><td>" + h0.escolhido.h + "</td><td>" +
        h0.escolhido.f + "</td></tr>" +
        '<tr><th colspan="4" style="padding-top:12px">esperando na fronteira</th></tr>' +
        (linhas || '<tr><td colspan="4" class="vazio">fronteira vazia</td></tr>') +
        extra + "</table>";

      $("#cont-passo").innerHTML =
        "<div><span>expandidos</span> <b>" + h0.expandidos + "</b></div>" +
        "<div><span>gerados</span> <b>" + h0.gerados + "</b></div>" +
        "<div><span>na fronteira</span> <b>" + h0.restam + "</b></div>";

      $("#aviso-passo").innerHTML = h0.achou
        ? '<span class="ok">Objetivo! Foi encontrado ao ser <b>retirado</b> da ' +
          "fronteira — é isso que garante que ele é o mais barato. Custo " +
          resultado.custo + ", em " + resultado.expandidos + " nós expandidos.</span>"
        : "Escolhido o menor <b>" + NOMES[algoritmo] + "</b> da fila. " +
          "Passo " + passo + " de " + resultado.historico.length + ".";
    }

    function avancar(n) {
      passo = Math.min(resultado.historico.length, passo + n);
      pintar();
    }

    painel.querySelectorAll("[data-passo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.passo;
        if (a === "um") avancar(1);
        else if (a === "dez") avancar(10);
        else if (a === "fim") avancar(resultado.historico.length);
        else { passo = 0; avancar(1); }
      });
    });

    painel.querySelectorAll("[data-alg]").forEach(function (b) {
      b.addEventListener("click", function () {
        painel.querySelectorAll("[data-alg]").forEach(function (o) {
          o.classList.remove("ligado");
        });
        b.classList.add("ligado");
        algoritmo = b.dataset.alg;
        resultado = busca(algoritmo, { historico: true });
        passo = 0;
        avancar(1);
      });
    });

    avancar(1);
  }

  /* --- 05. g, h e f -------------------------------------------------------- */

  function demoGHF() {
    var painel = $("#tab-ghf").closest(".painel");
    var estado = INICIAL, g = 0, tocando = null;

    function pintar() {
      desenhar("#tab-ghf", estado, { cel: 46 });
      var hh = h(estado);
      $("#v-g").textContent = g;
      $("#v-h").textContent = hh;
      $("#v-f").textContent = g + hh;
      $("#aviso-ghf").innerHTML = objetivo(estado)
        ? '<span class="ok">Chegou. h = 0, porque não falta mais nada.</span>'
        : "Repare: <b>h só muda quando a caixa anda</b>. Enquanto o agente " +
          "caminha, o palpite fica parado e o g sobe.";
    }

    function mover(direcao) {
      var novo = demos.mover(mapa, estado, direcao);
      if (!novo) return;
      estado = novo; g++;
      pintar();
    }

    function parar() { if (tocando) { clearInterval(tocando); tocando = null; } }

    painel.querySelectorAll("[data-ghf]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.ghf;
        if (a === "reiniciar") { parar(); estado = INICIAL; g = 0; pintar(); }
        else if (a === "solucao") {
          parar(); estado = INICIAL; g = 0; pintar();
          var i = 0;
          tocando = setInterval(function () {
            if (i >= D.solucao.length) { parar(); return; }
            mover(D.solucao[i++]);
          }, 520);
        } else { parar(); mover(a); }
      });
    });
    ligarSetas(painel, function (d) { parar(); mover(d); });
    pintar();
  }

  /* --- 06. a distância de Manhattan desenhada ------------------------------ */

  function demoManhattan() {
    // Marca o caminho reto que a heurística imagina: primeiro as linhas,
    // depois as colunas. Ela atravessa a parede, e é esse o ponto.
    var caixa = mapa.caixas[0];
    var alvo = Object.keys(mapa.alvos)[0].split(",").map(Number);
    var calor = {};
    var i = caixa[0], j = caixa[1];
    while (i !== alvo[0]) { i += (alvo[0] > i ? 1 : -1); calor[i + "," + j] = 0.9; }
    while (j !== alvo[1]) { j += (alvo[1] > j ? 1 : -1); calor[i + "," + j] = 0.9; }
    desenhar("#tab-manhattan", { agente: null, caixas: mapa.caixas },
             { cel: 46, calor: calor });
  }

  /* --- 07. h nunca passa do custo real ------------------------------------- */

  function graficoAdmissivel() {
    var estado = INICIAL, g = 0, colunas = [];
    var total = D.resultados.instancia1.estrela.custo;

    colunas.push({ passo: 0, falta: total, h: h(estado) });
    D.solucao.forEach(function (acao, i) {
      estado = demos.mover(mapa, estado, acao);
      g++;
      colunas.push({ passo: i + 1, falta: total - g, h: h(estado) });
    });

    var largura = 24, espaco = 10, altura = 150;
    var w = colunas.length * (largura + espaco);
    var svg = ['<svg viewBox="0 0 ' + w + " " + (altura + 26) +
               '" style="width:100%;max-width:' + w + 'px;height:auto">'];

    colunas.forEach(function (c, i) {
      var x = i * (largura + espaco);
      var hFalta = (c.falta / total) * altura;
      var hPalpite = (c.h / total) * altura;
      svg.push('<rect x="' + x + '" y="' + (altura - hFalta) + '" width="' +
               largura + '" height="' + hFalta +
               '" fill="var(--ok)" opacity="0.35" rx="3"/>');
      svg.push('<rect x="' + (x + 5) + '" y="' + (altura - hPalpite) +
               '" width="' + (largura - 10) + '" height="' + hPalpite +
               '" fill="var(--alerta)" rx="2"/>');
      svg.push('<text x="' + (x + largura / 2) + '" y="' + (altura + 16) +
               '" text-anchor="middle" font-size="10" fill="var(--texto-2)" ' +
               'font-family="ui-monospace,monospace">' + c.passo + "</text>");
    });
    svg.push("</svg>");
    $("#grafico-admissivel").innerHTML = svg.join("");
  }

  /* --- 08. as três lado a lado --------------------------------------------- */

  function corrida() {
    var pistas = [
      { chave: "ucs", nome: "UCS", tab: "#pista-ucs", rot: "#r-ucs" },
      { chave: "gulosa", nome: "Gulosa", tab: "#pista-gulosa", rot: "#r-gulosa" },
      { chave: "estrela", nome: "A*", tab: "#pista-estrela", rot: "#r-estrela" }
    ].map(function (p) {
      p.passos = (D.trilhas[p.chave].match(/.{4}/g) || []).map(function (s) {
        return { agente: [+s[0], +s[1]], caixas: [[+s[2], +s[3]]] };
      });
      p.i = 0; p.calor = {};
      return p;
    });

    var relogio = null;

    function pintar(p) {
      var estado = p.passos[Math.max(0, p.i - 1)] || p.passos[0];
      desenhar(p.tab, estado, { cel: 26, calor: p.calor });
      var expandidos = Math.min(p.i, p.passos.length - 1);
      $(p.rot).innerHTML = p.nome + " <b>" + expandidos + "</b>" +
        (p.i >= p.passos.length ? ' <span class="ok">achou</span>' : "");
    }

    function ciclo() {
      var acabou = true;
      pistas.forEach(function (p) {
        if (p.i < p.passos.length) {
          var k = p.passos[p.i].caixas[0].join(",");
          p.calor[k] = Math.min(1, (p.calor[k] || 0) + 0.18);
          p.i++;
          acabou = false;
        }
        pintar(p);
      });
      if (acabou) parar();
    }

    function parar() { if (relogio) { clearInterval(relogio); relogio = null; } }

    document.querySelectorAll("[data-corrida]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.corrida;
        if (a === "correr") { parar(); relogio = setInterval(ciclo, 110); }
        else if (a === "pausar") parar();
        else { parar(); pistas.forEach(function (p) { p.i = 0; p.calor = {}; pintar(p); }); }
      });
    });

    pistas.forEach(pintar);
  }

  /* --- 10. os becos -------------------------------------------------------- */

  function demoBecos() {
    desenhar("#tab-becos", { agente: null, caixas: [] },
             { cel: 46, mortos: true });
  }

  /* --- a conferência do rodapé --------------------------------------------- */

  // O ponto que sustenta a página: se a busca escrita aqui não der os mesmos
  // números que o Python deu, alguma das duas está errada e é melhor dizer.
  function conferir() {
    var linhas = [];
    var tudoBate = true;
    ["ucs", "gulosa", "estrela"].forEach(function (k) {
      var aqui = busca(k).expandidos;
      var python = D.resultados.instancia1[k].expandidos;
      if (aqui !== python) tudoBate = false;
      linhas.push(k.replace("estrela", "A*").toUpperCase() + " " + aqui +
                  (aqui === python ? "" : " ≠ " + python));
    });
    $("#conferencia").innerHTML = tudoBate
      ? '<span class="ok">' + linhas.join(" · ") + " nós expandidos, " +
        "iguais aos do Python.</span>"
      : '<span class="erro">divergência: ' + linhas.join(" · ") + "</span>";
  }

  /* --- tema ---------------------------------------------------------------- */

  $("#botao-tema").addEventListener("click", function () {
    var raiz = document.documentElement;
    raiz.dataset.tema = raiz.dataset.tema === "claro" ? "escuro" : "claro";
    try { localStorage.setItem("tema", raiz.dataset.tema); } catch (e) { /* anônimo */ }
  });
  try {
    var salvo = localStorage.getItem("tema");
    if (salvo) document.documentElement.dataset.tema = salvo;
  } catch (e) { /* anônimo */ }

  /* --- início --------------------------------------------------------------- */

  demoEstado();
  demoPassoAPasso();
  demoGHF();
  demoManhattan();
  graficoAdmissivel();
  corrida();
  demoBecos();
  conferir();
})();
