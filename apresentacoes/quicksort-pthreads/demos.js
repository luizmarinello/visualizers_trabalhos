/* --------------------------------------------------------------------------
   demos.js - demonstrações interativas do trabalho de Quick Sort com pthreads.

   Usado pela apresentação e pelo guia. Cada demo é um elemento com
   data-demo="<nome>"; este arquivo monta a interface dentro dele sozinho.

     particao   o particionamento de Hoare, passo a passo (o mesmo do comum.h)
     arvore     como o vetor é repartido entre as threads (o mesmo quicksort_par)
     createjoin linha do tempo de pthread_create / trabalho / pthread_join
     corrida    condição de corrida num contador compartilhado
     codigo     o código real, com as linhas destacadas passo a passo
     grafico    os resultados medidos (vêm de dados.js)
     cpus       por que mais threads que núcleos piora (MODELO didático)
     amdahl     a Lei de Amdahl com controles deslizantes

   Dentro de um slide, as animações param quando o slide sai (slide:saiu).
   -------------------------------------------------------------------------- */

(function () {
  "use strict";

  /* --- utilidades ------------------------------------------------------------ */

  function el(tag, attrs, filhos) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "texto") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k === "classe") e.className = attrs[k];
      else if (k === "estilo") e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) { if (f) e.appendChild(f); });
    return e;
  }
  function botao(txt, fn) { var b = el("button", { texto: txt, type: "button" }); b.addEventListener("click", fn); return b; }
  function fmt(x, casas) { return x.toFixed(casas === undefined ? 2 : casas).replace(".", ","); }
  function corThread(t) { return "var(--t" + (t % 8) + ")"; }

  // Gerador pseudoaleatório com semente: a mesma demo mostra sempre o mesmo vetor.
  function semente(s) {
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Liga a parada da animação à saída do slide (quando a demo está num slide).
  function aoSairDoSlide(raiz, fn) {
    var s = raiz.closest(".slide");
    if (s) s.addEventListener("slide:saiu", fn);
  }

  var dica = null;
  function mostrarDica(ev, html) {
    if (!dica) { dica = el("div", { classe: "dica-flutuante" }); document.body.appendChild(dica); }
    dica.innerHTML = html;
    dica.style.display = "block";
    var x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + 240 > window.innerWidth) x = ev.clientX - 250;
    dica.style.left = x + "px"; dica.style.top = y + "px";
  }
  function esconderDica() { if (dica) dica.style.display = "none"; }

  /* --- particionamento de Hoare (idêntico ao comum.h) ------------------------ */

  // Devolve a lista de "fotos" do vetor a cada passo do particionamento.
  function passosHoare(orig) {
    var v = orig.slice(), lo = 0, hi = v.length - 1, fotos = [];
    var mid = lo + Math.floor((hi - lo) / 2);
    function foto(o) { o.v = v.slice(); fotos.push(o); }
    function troca(a, b) { var t = v[a]; v[a] = v[b]; v[b] = t; }

    foto({ cand: [lo, mid, hi], msg: "Vetor original. Para escolher o pivô, olhamos 3 posições: a primeira, a do meio e a última (mediana de três)." });
    if (v[mid] < v[lo]) troca(mid, lo);
    if (v[hi] < v[lo]) troca(hi, lo);
    if (v[hi] < v[mid]) troca(hi, mid);
    var pivo = v[mid];
    foto({ cand: [lo, mid, hi], pivoIdx: mid, msg: "Ordenamos essas 3 entre si. A do meio vira o pivô: <b>" + pivo + "</b>. Agora i começa na esquerda e j na direita." });

    var i = lo - 1, j = hi + 1, pivoIdx = mid;
    for (;;) {
      do { i++; } while (v[i] < pivo);
      foto({ i: i, j: j <= hi ? j : null, pivoIdx: pivoIdx, msg: "<b class='destaque'>i</b> anda para a direita e para no primeiro número ≥ " + pivo + ": o <b>" + v[i] + "</b>." });
      do { j--; } while (v[j] > pivo);
      foto({ i: i, j: j, pivoIdx: pivoIdx, msg: "<b style='color:var(--dir)'>j</b> anda para a esquerda e para no primeiro número ≤ " + pivo + ": o <b>" + v[j] + "</b>." });
      if (i >= j) {
        foto({ i: i, j: j, fim: j, msg: "i e j se cruzaram: a partição acabou. <b style='color:var(--esq)'>Esquerda</b> só tem números ≤ " + pivo + ", <b style='color:var(--dir)'>direita</b> só ≥ " + pivo + ". Os dois lados nunca mais trocam nada entre si." });
        return fotos;
      }
      troca(i, j);
      if (pivoIdx === i) pivoIdx = j; else if (pivoIdx === j) pivoIdx = i;
      foto({ i: i, j: j, troca: [i, j], pivoIdx: pivoIdx, msg: "Os dois estão do lado errado: <b>troca</b> v[" + i + "] com v[" + j + "]." });
    }
  }

  function particao(raiz) {
    var cel = raiz.dataset.cel || "56px";
    var vetorEl = el("div", { classe: "vetor", estilo: "--cel:" + cel });
    var leg = el("div", { classe: "vetor-legenda" });
    var info = el("span", { classe: "info" });
    var base = [7, 2, 9, 4, 5, 1, 8, 3, 6, 0];
    var fotos, k = 0, timer = null, rnd = semente(11);

    function desenhar() {
      var f = fotos[k];
      vetorEl.innerHTML = "";
      f.v.forEach(function (x, idx) {
        var c = el("div", { classe: "c" }, [el("span", { classe: "idx", texto: String(idx) }), document.createTextNode(String(x))]);
        if (f.cand && f.cand.indexOf(idx) !== -1 && f.pivoIdx === undefined) c.classList.add("pivo");
        if (f.pivoIdx === idx) c.classList.add("pivo");
        if (f.fim !== undefined) c.classList.add(idx <= f.fim ? "esq" : "dir");
        if (f.troca && f.troca.indexOf(idx) !== -1) c.classList.add("troca");
        var rot = [];
        if (f.i === idx) rot.push("i");
        if (f.j === idx) rot.push("j");
        if (rot.length) c.appendChild(el("span", { classe: "ponteiro " + (rot.length === 2 ? "ij" : rot[0]), texto: rot.join(" ") }));
        vetorEl.appendChild(c);
      });
      leg.innerHTML = f.msg;
      info.textContent = "passo " + (k + 1) + " / " + fotos.length;
      bAnt.disabled = k === 0; bProx.disabled = k === fotos.length - 1;
    }
    function parar() { if (timer) { clearInterval(timer); timer = null; bPlay.textContent = "▶ animar"; } }
    function ir(n) { k = Math.max(0, Math.min(fotos.length - 1, n)); desenhar(); }
    function novo(v) { parar(); fotos = passosHoare(v); k = 0; desenhar(); }

    var bAnt = botao("◀ voltar", function () { parar(); ir(k - 1); });
    var bProx = botao("avançar ▶", function () { parar(); ir(k + 1); });
    var bPlay = botao("▶ animar", function () {
      if (timer) return parar();
      if (k === fotos.length - 1) k = 0;
      bPlay.textContent = "❚❚ pausar";
      desenhar();
      timer = setInterval(function () { if (k >= fotos.length - 1) return parar(); ir(k + 1); }, 1700);
    });
    var bNovo = botao("vetor aleatório", function () {
      var v = []; for (var t = 0; t < 10; t++) v.push(Math.floor(rnd() * 40));
      novo(v);
    });
    var bOrig = botao("vetor do slide", function () { novo(base); });

    raiz.appendChild(vetorEl);
    raiz.appendChild(leg);
    raiz.appendChild(el("div", { classe: "controles", estilo: "justify-content:center" }, [bAnt, bProx, bPlay, bOrig, bNovo, info]));
    novo(base);
    aoSairDoSlide(raiz, parar);
  }

  /* --- árvore de threads (simula o quicksort_par de verdade) ----------------- */

  function simularPar(n, p, limite, seed) {
    var r = semente(seed), v = [];
    for (var t = 0; t < n; t++) v.push(Math.floor(r() * 1000000));
    var nos = [], proxThread = 1, maxProf = 0;

    function part(lo, hi) {
      var mid = lo + Math.floor((hi - lo) / 2), x;
      if (v[mid] < v[lo]) { x = v[mid]; v[mid] = v[lo]; v[lo] = x; }
      if (v[hi] < v[lo]) { x = v[hi]; v[hi] = v[lo]; v[lo] = x; }
      if (v[hi] < v[mid]) { x = v[hi]; v[hi] = v[mid]; v[mid] = x; }
      var pivo = v[mid], i = lo - 1, j = hi + 1;
      for (;;) {
        do { i++; } while (v[i] < pivo);
        do { j--; } while (v[j] > pivo);
        if (i >= j) return j;
        x = v[i]; v[i] = v[j]; v[j] = x;
      }
    }
    function qs(lo, hi, orc, thr, prof) {
      maxProf = Math.max(maxProf, prof);
      var tam = hi - lo + 1;
      if (orc <= 1 || tam < limite) { nos.push({ lo: lo, hi: hi, thr: thr, prof: prof, folha: true }); return; }
      nos.push({ lo: lo, hi: hi, thr: thr, prof: prof, folha: false });
      var pp = part(lo, hi), tamEsq = pp - lo + 1;
      var oe = Math.floor(orc * tamEsq / tam + 0.5);
      if (oe < 1) oe = 1; if (oe > orc - 1) oe = orc - 1;
      var nova = proxThread++;
      qs(lo, pp, oe, nova, prof + 1);          // a thread NOVA pega o lado esquerdo
      qs(pp + 1, hi, orc - oe, thr, prof + 1); // a atual fica com o direito
    }
    qs(0, n - 1, p, 0, 0);
    return { nos: nos, prof: maxProf, threads: proxThread, n: n };
  }

  function arvore(raiz) {
    var N = 2000, LIM = 128;
    var p = parseInt(raiz.dataset.p || "4", 10), passo = 0, timer = null, sim;
    var alt = raiz.dataset.alt || "30px";
    var sel = el("div", { classe: "seletor" });
    [1, 2, 4, 8].forEach(function (x) {
      var b = botao(x + (x === 1 ? " thread" : " threads"), function () { p = x; montar(); });
      b.dataset.p = x; sel.appendChild(b);
    });
    var arv = el("div", { classe: "arvore", estilo: "--alt:" + alt + ";margin-left:70px" });
    var leg = el("div", { classe: "legenda-threads" });
    var carga = el("div", { classe: "carga" });
    var msg = el("p", { classe: "miudo", estilo: "margin:10px 0 0;min-height:2.6em" });
    var bPasso = botao("próximo nível ▶", function () { parar(); if (passo > sim.prof) { passo = 0; } avancar(); });
    var bPlay = botao("▶ animar", function () { if (timer) return parar(); if (passo > sim.prof) { passo = 0; desenhar(); } bPlay.textContent = "❚❚ pausar"; timer = setInterval(function () { if (!avancar()) parar(); }, 1100); });
    var bRei = botao("↺ reiniciar", function () { parar(); passo = 0; desenhar(); });

    function parar() { if (timer) { clearInterval(timer); timer = null; } bPlay.textContent = "▶ animar"; }
    function avancar() { if (passo > sim.prof) return false; passo++; desenhar(); return passo <= sim.prof; }

    function montar() {
      parar();
      sel.querySelectorAll("button").forEach(function (b) { b.classList.toggle("ligado", +b.dataset.p === p); });
      sim = simularPar(N, p, LIM, 3);
      passo = sim.prof + 2;   // começa mostrando o resultado completo; "animar" refaz do zero
      leg.innerHTML = "";
      for (var t = 0; t < sim.threads; t++) {
        leg.appendChild(el("span", {}, [el("i", { estilo: "background:" + corThread(t) }), document.createTextNode("T" + (t + 1) + (t === 0 ? " (principal)" : ""))]));
      }
      desenhar();
    }

    function desenhar() {
      arv.innerHTML = "";
      for (var d = 0; d <= sim.prof; d++) {
        var linha = el("div", { classe: "linha" }, [el("span", { classe: "rot", texto: "nível " + d })]);
        if (d < passo) {
          sim.nos.filter(function (n) { return n.prof === d; }).forEach(function (n) {
            var esq = n.lo / sim.n * 100, larg = (n.hi - n.lo + 1) / sim.n * 100;
            var s = el("div", { classe: "seg " + (n.folha ? "folha" : "part"), estilo: "left:" + esq + "%;width:" + larg + "%;background-color:" + corThread(n.thr) });
            s.textContent = larg > 7 ? (n.folha ? "T" + (n.thr + 1) + " ordena" : "T" + (n.thr + 1) + " particiona") : (larg > 2.5 ? "T" + (n.thr + 1) : "");
            s.title = "T" + (n.thr + 1) + (n.folha ? " ordena sozinha " : " particiona ") + (n.hi - n.lo + 1) + " números";
            linha.appendChild(s);
          });
        }
        arv.appendChild(linha);
      }
      // Linha final: quem ordena cada pedaço.
      var fim = el("div", { classe: "linha", estilo: "margin-top:8px" }, [el("span", { classe: "rot", texto: "resultado" })]);
      if (passo > sim.prof) {
        sim.nos.filter(function (n) { return n.folha; }).forEach(function (n) {
          var esq = n.lo / sim.n * 100, larg = (n.hi - n.lo + 1) / sim.n * 100;
          fim.appendChild(el("div", { classe: "seg folha", estilo: "left:" + esq + "%;width:" + larg + "%;background-color:" + corThread(n.thr), texto: larg > 4 ? "T" + (n.thr + 1) : "" }));
        });
      }
      arv.appendChild(fim);

      // Carga de cada thread: quantos números ela ordenou sozinha.
      carga.innerHTML = "";
      if (passo > sim.prof) {
        var por = {};
        sim.nos.forEach(function (n) { if (n.folha) por[n.thr] = (por[n.thr] || 0) + (n.hi - n.lo + 1); });
        Object.keys(por).sort(function (a, b) { return a - b; }).forEach(function (t) {
          var pc = por[t] / sim.n * 100;
          carga.appendChild(el("div", { classe: "item" }, [
            el("span", { texto: "T" + (+t + 1) }),
            el("div", { classe: "trilho" }, [el("div", { classe: "enche", estilo: "width:" + pc + "%;background:" + corThread(+t) })]),
            el("span", { texto: fmt(pc, 0) + "%" })
          ]));
        });
      }

      if (passo === 0) msg.innerHTML = "Vetor de " + N + " números, " + p + (p === 1 ? " thread" : " threads") + ". Clique em <b>animar</b> ou avance nível por nível.";
      else if (passo === 1 && sim.prof > 0) msg.innerHTML = "Nível 0: <b>só a T1</b> trabalha, particionando o vetor inteiro. Essa parte é sequencial e limita o ganho (Lei de Amdahl).";
      else if (passo <= sim.prof) msg.innerHTML = "Cada partição cria <b>uma</b> thread nova para o lado esquerdo; a thread que particionou segue com o lado direito.";
      else msg.innerHTML = (p === 1 ? "Com 1 thread não há divisão: a T1 faz tudo." :
        "Pronto: " + sim.threads + " threads, " + (sim.threads - 1) + " criadas com pthread_create. As barras mostram quanto cada uma ordenou: o pivô não divide exatamente ao meio, então a carga não fica igual.");
      bPasso.textContent = passo > sim.prof ? "do começo ▶" : "próximo nível ▶";
    }

    raiz.appendChild(el("div", { classe: "controles", estilo: "margin:0 0 14px" }, [sel, bPasso, bPlay, bRei]));
    raiz.appendChild(arv);
    raiz.appendChild(leg);
    raiz.appendChild(msg);
    raiz.appendChild(carga);
    montar();
    aoSairDoSlide(raiz, parar);
  }

  /* --- create / join --------------------------------------------------------- */

  function createjoin(raiz) {
    var passos = [
      { codigo: [], msg: "Começo: só existe a thread que chamou a função (a principal, T1)." },
      { codigo: [0], msg: "<b>1.</b> A T1 particiona o trecho. Até aqui, só ela trabalha." },
      { codigo: [1, 2], msg: "<b>2.</b> <code>pthread_create</code> cria a T2, que ordena o lado <b style='color:var(--esq)'>esquerdo</b>. Ao mesmo tempo, a T1 ordena o lado <b style='color:var(--dir)'>direito</b>." },
      { codigo: [3], msg: "<b>3.</b> A T1 terminou o lado dela antes e fica <b>esperando</b> em <code>pthread_join</code>: o lado esquerdo ainda não acabou." },
      { codigo: [3], msg: "<b>4.</b> A T2 termina, o <code>join</code> retorna e o trecho inteiro está ordenado." }
    ];
    var linhasCod = ["long p = particionar(v, lo, hi);", "pthread_create(&th, NULL, rotina_thread, &esq);", "quicksort_par(v, p + 1, hi, orc_dir);", "pthread_join(th, NULL);"];
    var k = 0, timer = null;

    var t1 = el("div", { classe: "pista" }), t2 = el("div", { classe: "pista" });
    var caixa = el("div", { classe: "tempo-threads" }, [
      el("div", { classe: "raia" }, [el("span", { classe: "nome", texto: "T1 (principal)" }), t1]),
      el("div", { classe: "raia" }, [el("span", { classe: "nome", texto: "T2 (nova)" }), t2])
    ]);
    function bloco(pista, ini, fim, txt, cor, extra) {
      var b = el("div", { classe: "bloco " + (extra || ""), estilo: "left:" + ini + "%;width:" + (fim - ini) + "%;background:" + cor, texto: txt });
      pista.appendChild(b); return b;
    }
    var bPart = bloco(t1, 0, 20, "particiona", "var(--t0)");
    var bDir = bloco(t1, 21, 62, "ordena lado direito", "var(--dir)");
    var bEsq = bloco(t2, 21, 82, "ordena lado esquerdo", "var(--esq)");
    var bEsp = bloco(t1, 62.5, 82, "espera", "", "espera");
    var bFim = bloco(t1, 83, 100, "pronto ✓", "var(--ok)");
    // setas (posicionadas sobre a área das pistas, à direita da coluna de nomes)
    var area = el("div", { estilo: "position:absolute;left:162px;right:0;top:0;bottom:0;pointer-events:none" });
    var sCria = el("div", { classe: "seta desce", estilo: "left:20.5%;top:40px;height:34px" });
    var eCria = el("div", { classe: "etq", estilo: "left:21.5%;top:-2px", texto: "pthread_create" });
    var sJoin = el("div", { classe: "seta sobe", estilo: "left:82.5%;top:40px;height:34px" });
    var eJoin = el("div", { classe: "etq", estilo: "left:70%;top:94px", texto: "pthread_join retorna" });
    [sCria, eCria, sJoin, eJoin].forEach(function (x) { area.appendChild(x); });
    caixa.appendChild(area);

    var cod = el("div", { classe: "codigo", estilo: "--fs:" + (raiz.dataset.fs || "15px") + ";margin-top:16px" });
    linhasCod.forEach(function (l) { cod.appendChild(el("div", { classe: "ln" }, [el("span", { classe: "n", texto: "" }), el("span", { texto: l })])); });
    var msg = el("p", { classe: "explica", estilo: "margin-top:12px" });
    var info = el("span", { classe: "info" });

    function desenhar() {
      var vis = [
        [],
        [bPart],
        [bPart, bDir, bEsq, sCria, eCria],
        [bPart, bDir, bEsq, sCria, eCria, bEsp],
        [bPart, bDir, bEsq, sCria, eCria, bEsp, sJoin, eJoin, bFim]
      ][k];
      [bPart, bDir, bEsq, bEsp, bFim, sCria, eCria, sJoin, eJoin].forEach(function (x) { x.classList.toggle("oculto", vis.indexOf(x) === -1); });
      cod.classList.toggle("focando", passos[k].codigo.length > 0);
      Array.prototype.forEach.call(cod.children, function (ln, i) { ln.classList.toggle("on", passos[k].codigo.indexOf(i) !== -1); });
      msg.innerHTML = passos[k].msg;
      info.textContent = "passo " + k + " / " + (passos.length - 1);
      bAnt.disabled = k === 0; bProx.disabled = k === passos.length - 1;
    }
    function parar() { if (timer) { clearInterval(timer); timer = null; } bPlay.textContent = "▶ animar"; }
    var bAnt = botao("◀ voltar", function () { parar(); k = Math.max(0, k - 1); desenhar(); });
    var bProx = botao("avançar ▶", function () { parar(); k = Math.min(passos.length - 1, k + 1); desenhar(); });
    var bPlay = botao("▶ animar", function () {
      if (timer) return parar();
      if (k === passos.length - 1) k = 0;
      bPlay.textContent = "❚❚ pausar"; desenhar();
      timer = setInterval(function () { if (k >= passos.length - 1) return parar(); k++; desenhar(); }, 1600);
    });

    raiz.appendChild(caixa);
    raiz.appendChild(cod);
    raiz.appendChild(msg);
    raiz.appendChild(el("div", { classe: "controles" }, [bAnt, bProx, bPlay, info]));
    desenhar();
    aoSairDoSlide(raiz, parar);
  }

  /* --- condição de corrida --------------------------------------------------- */

  function corrida(raiz) {
    var linhas = [
      ["lê contador → 0", "", 0],
      ["", "lê contador → 0", 0],
      ["soma 1 → 1", "", 0],
      ["", "soma 1 → 1", 0],
      ["grava 1", "", 1],
      ["", "grava 1", 1]
    ];
    var k = -1;
    var tab = el("table", { classe: "corrida" });
    tab.appendChild(el("tr", {}, [el("th", { texto: "passo" }), el("th", { texto: "Thread A" }), el("th", { texto: "Thread B" }), el("th", { texto: "contador" })]));
    var trs = linhas.map(function (l, i) {
      var tr = el("tr", {}, [el("td", { texto: String(i + 1) }), el("td", { texto: l[0] }), el("td", { texto: l[1] }), el("td", { texto: String(l[2]) })]);
      tab.appendChild(tr); return tr;
    });
    var mem = el("div", { classe: "memoria" });
    function desenhar() {
      trs.forEach(function (tr, i) { tr.className = i === k ? "atual" : (i > k ? "futuro" : ""); });
      var valor = k < 0 ? 0 : linhas[k][2];
      mem.innerHTML = "contador na memória: <b>" + valor + "</b>" +
        (k === linhas.length - 1 ? " <span class='erro forte'>esperado 2 · uma soma se perdeu</span>" : "");
    }
    raiz.appendChild(tab);
    raiz.appendChild(mem);
    raiz.appendChild(el("div", { classe: "controles", estilo: "justify-content:center" }, [
      botao("avançar ▶", function () { k = Math.min(linhas.length - 1, k + 1); desenhar(); }),
      botao("↺ reiniciar", function () { k = -1; desenhar(); })
    ]));
    desenhar();
  }

  /* --- código com passos ----------------------------------------------------- */

  var PASSOS_COD = [
    { de: 53, ate: 57, t: "Caso base", x: "Se o orçamento é 1 ou o trecho tem menos de <code>LIMITE_PARALELO</code> (4.096) números, não vale a pena dividir: chama <code>quicksort_seq</code>, <b>a mesma função da versão sequencial</b>. É isso que deixa a comparação justa." },
    { de: 59, ate: 60, t: "Particiona", x: "Separa o trecho: tudo em <code>v[lo..p]</code> é ≤ pivô e tudo em <code>v[p+1..hi]</code> é ≥ pivô. Os dois lados agora são independentes." },
    { de: 62, ate: 66, t: "Divide o orçamento", x: "O lado maior recebe mais threads, proporcional ao tamanho. Ex.: orçamento 4 e lado esquerdo com 75% → 3 threads para ele e 1 para o direito. Os dois <code>if</code> garantem pelo menos 1 para cada lado." },
    { de: 68, ate: 69, t: "Prepara a tarefa", x: "A <code>struct Tarefa</code> leva para a nova thread o vetor, o começo, o fim e o orçamento dela. <code>pthread_t th</code> guarda a identificação da thread." },
    { de: 70, ate: 75, t: "pthread_create", x: "Cria a thread nova, que vai rodar <code>rotina_thread</code> → <code>quicksort_par</code> no lado <b>esquerdo</b>. Se a criação falhar (retorno ≠ 0), faz os dois lados nesta mesma thread: o programa nunca quebra por isso." },
    { de: 76, ate: 76, t: "Lado direito na thread atual", x: "Enquanto a nova thread cuida da esquerda, a thread atual <b>não fica parada</b>: ordena a direita. Como a chamada é recursiva, ela pode dividir de novo se ainda tiver orçamento." },
    { de: 77, ate: 77, t: "pthread_join", x: "Espera a thread do lado esquerdo terminar. Só depois disso o trecho inteiro está ordenado. É a <b>única sincronização</b> do programa: não precisa de mutex porque as faixas do vetor não se sobrepõem." }
  ];

  function realcarC(txt) {
    var esc = txt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var com = "";
    var m = esc.match(/(\/\*.*\*\/)\s*$/);
    if (m) { com = "<span class='com'>" + m[1] + "</span>"; esc = esc.slice(0, m.index); }
    esc = esc.replace(/\b(if|return|static|void|long|int|double)\b/g, "<span class='kw'>$1</span>")
             .replace(/\b(pthread_create|pthread_join|quicksort_par|quicksort_seq|particionar)\b/g, "<span class='fn'>$1</span>");
    return esc + com;
  }

  function codigo(raiz) {
    var C = window.CODIGO_QS;
    if (!C) { raiz.textContent = "(codigo.js não carregou)"; return; }
    var de = parseInt(raiz.dataset.de || "52", 10), ate = parseInt(raiz.dataset.ate || "78", 10);
    var passos = PASSOS_COD.filter(function (p) { return p.de >= de && p.ate <= ate; });
    var cod = el("div", { classe: "codigo", estilo: "--fs:" + (raiz.dataset.fs || "15px") });
    var lns = {};
    for (var n = de; n <= ate; n++) {
      var ln = el("div", { classe: "ln" }, [el("span", { classe: "n", texto: String(n) }), el("span", { html: realcarC(C.linhas[n - C.inicio] || "") || " " })]);
      lns[n] = ln; cod.appendChild(ln);
    }
    var lista = el("div", { classe: "passos-codigo" });
    var expl = el("div", { classe: "explica", html: "Clique num passo para ver as linhas dele destacadas." });
    var botoes = passos.map(function (p, i) {
      var b = el("button", { type: "button", html: "<b>" + (i + 1) + "</b>" + p.t + " <span class='miudo'>(linha" + (p.de === p.ate ? " " + p.de : "s " + p.de + "–" + p.ate) + ")</span>" });
      b.addEventListener("click", function () { escolher(i); });
      lista.appendChild(b); return b;
    });
    function escolher(i) {
      botoes.forEach(function (b, j) { b.classList.toggle("ligado", i === j); });
      cod.classList.add("focando");
      Object.keys(lns).forEach(function (n) { lns[n].classList.toggle("on", n >= passos[i].de && n <= passos[i].ate); });
      expl.innerHTML = passos[i].x;
    }
    var lado = el("div", { estilo: "display:flex;flex-direction:column;gap:12px" }, [lista, expl]);
    var grade = el("div", { estilo: "display:grid;grid-template-columns:" + (raiz.dataset.colunas || "1fr 330px") + ";gap:18px;align-items:start" }, [cod, lado]);
    raiz.appendChild(grade);
    if (raiz.dataset.inicial !== undefined) escolher(+raiz.dataset.inicial);
  }

  /* --- gráfico de resultados (dados medidos) -------------------------------- */

  function grafico(raiz) {
    var D = window.DADOS_QS;
    if (!D) { raiz.textContent = "(dados.js não carregou)"; return; }
    var entrada = raiz.dataset.entrada || "grande", metrica = raiz.dataset.metrica || "tempo";
    var NOMES = { pequena: "pequena (20 mil)", media: "média (120 mil)", grande: "grande (400 mil)" };
    var MET = { tempo: "tempo médio (ms)", speedup: "speedup", eficiencia: "eficiência" };
    var selE = el("div", { classe: "seletor" }), selM = el("div", { classe: "seletor" });
    Object.keys(NOMES).forEach(function (k) { var b = botao(NOMES[k], function () { entrada = k; desenhar(); }); b.dataset.k = k; selE.appendChild(b); });
    Object.keys(MET).forEach(function (k) { var b = botao(MET[k], function () { metrica = k; desenhar(); }); b.dataset.k = k; selM.appendChild(b); });
    var W = 640, H = parseInt(raiz.dataset.altura || "300", 10), m = { e: 56, d: 12, t: 26, b: 44 };
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("role", "img");
    var resumo = el("p", { classe: "miudo", estilo: "margin:8px 0 0" });

    function s(tag, at, txt) { var e = document.createElementNS(NS, tag); Object.keys(at).forEach(function (k) { e.setAttribute(k, at[k]); }); if (txt !== undefined) e.textContent = txt; svg.appendChild(e); return e; }

    function desenhar() {
      selE.querySelectorAll("button").forEach(function (b) { b.classList.toggle("ligado", b.dataset.k === entrada); });
      selM.querySelectorAll("button").forEach(function (b) { b.classList.toggle("ligado", b.dataset.k === metrica); });
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cfg = D.entradas[entrada].configs;
      var campo = metrica === "tempo" ? "media_ms" : metrica;
      var vals = cfg.map(function (c) { return c[campo]; });
      var topo = metrica === "tempo" ? Math.max.apply(null, cfg.map(function (c) { return c.media_ms + c.desvio_ms; })) * 1.18
               : metrica === "speedup" ? Math.max(2.3, Math.max.apply(null, vals) * 1.2) : 1.15;
      var ih = H - m.t - m.b, iw = W - m.e - m.d;
      function y(v) { return m.t + ih - v / topo * ih; }
      // grade e eixo
      for (var g = 0; g <= 4; g++) {
        var gv = topo / 4 * g;
        s("line", { x1: m.e, x2: W - m.d, y1: y(gv), y2: y(gv), "class": g ? "grade" : "eixo" });
        s("text", { x: m.e - 8, y: y(gv) + 4, "text-anchor": "end" }, fmt(gv, metrica === "tempo" && topo > 10 ? 0 : 1));
      }
      s("text", { x: m.e, y: 14 }, MET[metrica] + " · entrada " + NOMES[entrada]);
      var larg = iw / cfg.length;
      cfg.forEach(function (c, i) {
        var v = c[campo], x0 = m.e + larg * i + larg * 0.18, bw = larg * 0.64;
        var cor = c.config === "seq" ? "var(--texto-2)" : "var(--destaque)";
        var r = s("rect", { "class": "barra", x: x0, y: y(v), width: bw, height: y(0) - y(v), rx: 4, fill: cor });
        r.addEventListener("mousemove", function (ev) {
          mostrarDica(ev, "<b>" + (c.config === "seq" ? "Sequencial" : c.config === "max" ? "Máximo (" + c.threads + " CPUs)" : c.threads + " threads") + "</b><br>" +
            "média: " + fmt(c.media_ms, 3) + " ms<br>desvio: " + fmt(c.desvio_ms, 3) + " ms<br>mín–máx: " + fmt(c.min_ms, 2) + "–" + fmt(c.max_ms, 2) + " ms<br>" +
            "speedup: " + fmt(c.speedup) + "×<br>eficiência: " + fmt(c.eficiencia));
        });
        r.addEventListener("mouseleave", esconderDica);
        if (metrica === "tempo") {
          var cx = x0 + bw / 2;
          s("line", { x1: cx, x2: cx, y1: y(c.media_ms + c.desvio_ms), y2: y(Math.max(0, c.media_ms - c.desvio_ms)), stroke: "var(--texto)", "stroke-width": 1.5 });
          s("line", { x1: cx - 6, x2: cx + 6, y1: y(c.media_ms + c.desvio_ms), y2: y(c.media_ms + c.desvio_ms), stroke: "var(--texto)", "stroke-width": 1.5 });
        }
        var ideal = metrica === "speedup" ? c.threads : metrica === "eficiencia" ? 1 : null;
        if (ideal !== null && c.config !== "seq") {
          if (ideal <= topo) s("line", { "class": "ideal", x1: x0 - 4, x2: x0 + bw + 4, y1: y(ideal), y2: y(ideal) });
          else s("text", { x: x0 + bw / 2, y: m.t + 12, "text-anchor": "middle" }, "ideal " + ideal + " ↑");
        }
        var rotY = metrica === "tempo" ? y(c.media_ms + c.desvio_ms) - 8 : y(v) - 8;
        s("text", { "class": "valor", x: x0 + bw / 2, y: Math.max(m.t + 26, rotY), "text-anchor": "middle" }, fmt(v, metrica === "tempo" ? (v < 10 ? 2 : 1) : 2));
        s("text", { x: x0 + bw / 2, y: H - m.b + 20, "text-anchor": "middle" }, c.config === "seq" ? "seq" : c.config === "max" ? "máx (" + c.threads + ")" : c.threads + " thr");
      });
      var seq = cfg[0], dois = cfg[1];
      resumo.innerHTML = metrica === "tempo"
        ? "Sequencial " + fmt(seq.media_ms) + " ms → 2 threads " + fmt(dois.media_ms) + " ms. Barra fina = desvio padrão. Passe o mouse nas barras para ver os detalhes."
        : metrica === "speedup" ? "Tracejado = speedup ideal (igual ao número de threads). Com 2 threads: " + fmt(dois.speedup) + "×."
        : "Eficiência = speedup ÷ threads. 1 é o ideal; com 8 threads cada uma rende pouco porque a máquina tem só " + D.maquina.cpus + " CPUs.";
    }
    raiz.appendChild(el("div", { classe: "controles", estilo: "margin:0 0 10px" }, [selE, selM]));
    raiz.appendChild(el("div", { classe: "grafico" }, [svg]));
    raiz.appendChild(resumo);
    desenhar();
  }

  /* --- CPUs: troca de contexto (modelo didático) ----------------------------- */

  // Escalonamento circular simples: cada núcleo roda uma thread por um "quantum";
  // trocar de thread num núcleo custa um pouco. NÃO é medição, só ilustração.
  function escalonar(k, nucleos) {
    var TRAB = 120, Q = 10, TROCA = 1.6, CRIA = 0.8;
    var resta = [], fila = [], fatias = [];
    for (var t = 0; t < k; t++) { resta.push(TRAB / k); fila.push(t); }
    var livre = [], ultimo = [];
    for (var c = 0; c < nucleos; c++) { livre.push(0); ultimo.push(c === 0 ? 0 : -1); }
    // a thread principal cria as outras, uma por vez, no núcleo 1
    if (k > 1) { fatias.push({ c: 0, ini: 0, fim: CRIA * (k - 1), tipo: "cria" }); livre[0] = CRIA * (k - 1); }
    var guarda = 0;
    while (fila.length && guarda++ < 5000) {
      var cc = 0;
      for (var x = 1; x < nucleos; x++) if (livre[x] < livre[cc]) cc = x;
      var th = fila.shift(), t0 = livre[cc];
      if (ultimo[cc] !== -1 && ultimo[cc] !== th) { fatias.push({ c: cc, ini: t0, fim: t0 + TROCA, tipo: "troca" }); t0 += TROCA; }
      var dur = Math.min(Q, resta[th]);
      fatias.push({ c: cc, ini: t0, fim: t0 + dur, tipo: "roda", th: th });
      resta[th] -= dur; livre[cc] = t0 + dur; ultimo[cc] = th;
      if (resta[th] > 1e-9) fila.push(th);
    }
    return { fatias: fatias, total: Math.max.apply(null, livre), trocas: fatias.filter(function (f) { return f.tipo === "troca"; }).length };
  }

  function cpus(raiz) {
    var D = window.DADOS_QS, nucleos = (D && D.maquina.cpus) || 2;
    var k = parseInt(raiz.dataset.k || "2", 10), timer = null, t = 0, r;
    var sel = el("div", { classe: "seletor" });
    [2, 4, 8].forEach(function (x) { var b = botao(x + " threads", function () { k = x; montar(); }); b.dataset.k = x; sel.appendChild(b); });
    var gantt = el("div", { classe: "gantt" });
    var placar = el("div", { classe: "contadores", estilo: "font-family:var(--mono);font-size:15px;margin-top:10px;display:flex;gap:18px;flex-wrap:wrap" });
    var base = escalonar(2, nucleos).total, ESCALA = escalonar(8, nucleos).total * 1.02;
    var pistas = [];

    function montar() {
      parar();
      sel.querySelectorAll("button").forEach(function (b) { b.classList.toggle("ligado", +b.dataset.k === k); });
      r = escalonar(k, nucleos);
      gantt.innerHTML = ""; pistas = [];
      for (var c = 0; c < nucleos; c++) {
        var p = el("div", { classe: "pista" });
        pistas.push(p);
        gantt.appendChild(el("div", { classe: "raia" }, [el("span", { classe: "nome", texto: "CPU " + (c + 1) }), p]));
      }
      t = 0; desenhar(ESCALA);
      tocar();
    }
    function desenhar(ate) {
      pistas.forEach(function (p) { p.innerHTML = ""; });
      r.fatias.forEach(function (f) {
        if (f.ini >= ate) return;
        var fim = Math.min(f.fim, ate);
        var d = el("div", { classe: "fatia " + (f.tipo === "roda" ? "" : f.tipo), estilo: "left:" + (f.ini / ESCALA * 100) + "%;width:" + ((fim - f.ini) / ESCALA * 100) + "%;" + (f.tipo === "roda" ? "background:" + corThread(f.th) : "") });
        if (f.tipo === "roda" && (fim - f.ini) / ESCALA > 0.035) d.textContent = "T" + (f.th + 1);
        pistas[f.c].appendChild(d);
      });
      var fimAte = Math.min(ate, r.total);
      placar.innerHTML = "<span>tempo total (modelo): <b>" + fmt(fimAte, 1) + "</b></span>" +
        "<span>trocas de contexto: <b>" + r.fatias.filter(function (f) { return f.tipo === "troca" && f.ini < ate; }).length + "</b></span>" +
        (ate >= r.total ? "<span class='" + (r.total > base + 0.01 ? "erro" : "ok") + "'>" + (k === 2 ? "referência: 1 thread por CPU" : "+" + fmt((r.total / base - 1) * 100, 0) + "% em relação a 2 threads") + "</span>" : "");
    }
    function parar() { if (timer) { clearInterval(timer); timer = null; } }
    function tocar() {
      parar(); t = 0;
      timer = setInterval(function () { t += ESCALA / 60; desenhar(t); if (t >= ESCALA) parar(); }, 40);
    }

    raiz.appendChild(el("div", { classe: "controles", estilo: "margin:0 0 12px" }, [sel, botao("↺ repetir", function () { tocar(); })]));
    raiz.appendChild(gantt);
    raiz.appendChild(el("div", { classe: "legenda-threads" }, [
      el("span", {}, [el("i", { estilo: "background:var(--texto-2);opacity:.5" }), document.createTextNode("criar threads")]),
      el("span", {}, [el("i", { estilo: "background:repeating-linear-gradient(135deg,var(--texto-2) 0 3px,transparent 3px 6px)" }), document.createTextNode("troca de contexto")])
    ]));
    raiz.appendChild(placar);
    raiz.appendChild(el("p", { classe: "miudo", estilo: "margin:6px 0 0", texto: "Modelo didático simplificado (não é medição): mesmo trabalho total, dividido entre k threads, em " + nucleos + " CPUs." }));
    montar();
    aoSairDoSlide(raiz, parar);
    var sl = raiz.closest(".slide");
    if (sl) sl.addEventListener("slide:entrou", function () { tocar(); });
  }

  /* --- Lei de Amdahl --------------------------------------------------------- */

  function amdahl(raiz) {
    var s = parseFloat(raiz.dataset.s || "10"), p = parseInt(raiz.dataset.p || "2", 10);
    var NS = "http://www.w3.org/2000/svg", W = 560, H = 250, m = { e: 40, d: 14, t: 12, b: 30 }, PMAX = 16, YMAX = 8;
    function sp(sv, pv) { var f = sv / 100; return 1 / (f + (1 - f) / pv); }
    var rS = el("input", { type: "range", min: "0", max: "50", step: "1", value: String(s) });
    var rP = el("input", { type: "range", min: "1", max: "16", step: "1", value: String(p) });
    var oS = el("output"), oP = el("output");
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var saida = el("div", { estilo: "display:flex;gap:28px;flex-wrap:wrap;align-items:baseline;margin-top:8px" });
    function x(v) { return m.e + (v - 1) / (PMAX - 1) * (W - m.e - m.d); }
    function y(v) { return m.t + (H - m.t - m.b) * (1 - Math.min(v, YMAX) / YMAX); }
    function n(tag, at, txt) { var e = document.createElementNS(NS, tag); Object.keys(at).forEach(function (k) { e.setAttribute(k, at[k]); }); if (txt !== undefined) e.textContent = txt; svg.appendChild(e); return e; }
    function desenhar() {
      s = +rS.value; p = +rP.value;
      oS.textContent = s + "%"; oP.textContent = String(p);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      for (var g = 0; g <= YMAX; g += 2) { n("line", { x1: m.e, x2: W - m.d, y1: y(g), y2: y(g), stroke: "var(--linha)", "stroke-dasharray": g ? "2 4" : "" }); n("text", { x: m.e - 6, y: y(g) + 4, "text-anchor": "end" }, g + "×"); }
      [1, 2, 4, 8, 16].forEach(function (v) { n("text", { x: x(v), y: H - 10, "text-anchor": "middle" }, v); });
      var ideal = "", curva = "";
      for (var v = 1; v <= PMAX; v += 0.25) { ideal += (v === 1 ? "M" : "L") + x(v) + " " + y(v); curva += (v === 1 ? "M" : "L") + x(v) + " " + y(sp(s, v)); }
      n("path", { d: ideal, "class": "ideal-l" });
      n("path", { d: curva, "class": "curva" });
      n("circle", { cx: x(p), cy: y(sp(s, p)), r: 7, "class": "ponto" });
      n("text", { x: W - m.d, y: y(YMAX) + 12, "text-anchor": "end" }, "tracejado = ideal (speedup = threads)");
      var S = sp(s, p);
      saida.innerHTML = "<span>speedup: <span class='grande-num'>" + fmt(S) + "×</span></span>" +
        "<span>eficiência: <span class='grande-num'>" + fmt(S / p) + "</span></span>" +
        "<span class='miudo'>limite com infinitas threads: " + (s === 0 ? "sem limite" : fmt(100 / s, 1) + "×") + "</span>";
    }
    rS.addEventListener("input", desenhar); rP.addEventListener("input", desenhar);
    raiz.appendChild(el("div", { classe: "amdahl" }, [
      el("div", { classe: "linha-ctrl" }, [el("label", { texto: "parte que só roda em 1 thread" }), rS, oS]),
      el("div", { classe: "linha-ctrl" }, [el("label", { texto: "número de threads (p)" }), rP, oP]),
      svg, saida
    ]));
    desenhar();
  }

  /* --- início ---------------------------------------------------------------- */

  var DEMOS = { particao: particao, arvore: arvore, createjoin: createjoin, corrida: corrida, codigo: codigo, grafico: grafico, cpus: cpus, amdahl: amdahl };
  window.QSDemos = DEMOS;

  function iniciar() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-demo]"), function (raiz) {
      var f = DEMOS[raiz.dataset.demo];
      if (f) { try { f(raiz); } catch (e) { raiz.textContent = "Erro na demo: " + e.message; if (window.console) console.error(e); } }
    });
    // números medidos espalhados pelo texto: <span data-num="grande.2.media_ms" data-casas="1">
    var D = window.DADOS_QS;
    if (D) Array.prototype.forEach.call(document.querySelectorAll("[data-num]"), function (e) {
      var p = e.dataset.num.split("."), cfg = D.entradas[p[0]].configs.filter(function (c) { return c.config === p[1]; })[0];
      if (cfg) e.textContent = fmt(cfg[p[2]], e.dataset.casas ? +e.dataset.casas : 2);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
