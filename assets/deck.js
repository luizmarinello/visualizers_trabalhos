/* --------------------------------------------------------------------------
   deck.js - o motor de slides do repositório.

   Cada <section class="slide"> é um slide. Todos têm 1280x720 fixo e são
   escalados por transform para caber na tela: o que se vê no monitor é
   exatamente o que aparece no projetor.

   Teclas
     → ↓ espaço PageDown   próximo
     ← ↑ PageUp            anterior
     Home / End            primeiro / último
     n                     notas do apresentador
     t                     alterna tema claro/escuro
     f                     tela cheia

   O número do slide vai para o hash da URL (.../#7), então dá para mandar
   link direto e recarregar sem perder o lugar.

   Um <aside> no fim do slide vira nota do apresentador. ATENÇÃO: a nota NÃO é
   privada — qualquer pessoa com o link consegue abri-la com a tecla n.

   Cada slide recebe os eventos `slide:entrou` e `slide:saiu`, que as demos
   usam para ligar e desligar animações.

   Um slide com data-arrows="demo" devolve as setas do teclado para a demo que
   está dentro dele; nesse slide a navegação passa a ser feita pelo espaço.
   -------------------------------------------------------------------------- */

(function () {
  "use strict";

  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  if (!slides.length) return;

  var atual = -1;

  // --- elementos de apoio criados na marra, para o HTML dos slides ficar limpo

  var progresso = document.createElement("div");
  progresso.className = "progresso";
  document.body.appendChild(progresso);

  var notas = document.createElement("div");
  notas.className = "notas";
  document.body.appendChild(notas);

  var barra = document.createElement("div");
  barra.className = "barra";
  barra.innerHTML =
    '<button data-ir="anterior" title="anterior">&larr;</button>' +
    '<span class="contador"></span>' +
    '<button data-ir="proximo" title="próximo">&rarr;</button>' +
    '<button data-ir="notas" title="notas do apresentador (n)">n</button>' +
    '<button data-ir="tema" title="tema claro/escuro (t)">t</button>' +
    '<button data-ir="tela" title="tela cheia (f)">f</button>';
  document.body.appendChild(barra);

  var contador = barra.querySelector(".contador");

  // --- escala -------------------------------------------------------------

  function escalar() {
    var k = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    slides.forEach(function (s) { s.style.transform = "scale(" + k + ")"; });
  }

  // --- navegação ----------------------------------------------------------

  function mostrar(i, semHash) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === atual) return;

    if (atual >= 0) {
      slides[atual].classList.remove("ativo");
      slides[atual].dispatchEvent(new CustomEvent("slide:saiu"));
    }

    atual = i;
    var s = slides[atual];
    s.classList.add("ativo");
    s.dispatchEvent(new CustomEvent("slide:entrou"));

    contador.textContent = (atual + 1) + " / " + slides.length;
    progresso.style.width = ((atual + 1) / slides.length * 100) + "%";

    var aside = s.querySelector("aside");
    notas.innerHTML = aside
      ? '<h4>notas do apresentador</h4>' + aside.innerHTML
      : '<h4>notas do apresentador</h4><p>(este slide não tem nota)</p>';

    if (!semHash) location.hash = String(atual + 1);
  }

  function proximo() { mostrar(atual + 1); }
  function anterior() { mostrar(atual - 1); }

  // --- teclado ------------------------------------------------------------

  var AVANCA = [" ", "Spacebar", "PageDown", "ArrowRight", "ArrowDown", "Enter"];
  var VOLTA = ["PageUp", "ArrowLeft", "ArrowUp"];
  var SETAS = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

  document.addEventListener("keydown", function (ev) {
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;

    var alvo = ev.target;
    if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA")) return;

    // Slide de demo: as setas pertencem à demo, não à navegação.
    var demo = slides[atual] && slides[atual].dataset.arrows === "demo";
    if (demo && SETAS.indexOf(ev.key) !== -1) return;

    if (ev.key === "n") { notas.classList.toggle("aberta"); ev.preventDefault(); return; }
    if (ev.key === "t") { alternarTema(); ev.preventDefault(); return; }
    if (ev.key === "f") { telaCheia(); ev.preventDefault(); return; }
    if (ev.key === "Home") { mostrar(0); ev.preventDefault(); return; }
    if (ev.key === "End") { mostrar(slides.length - 1); ev.preventDefault(); return; }

    if (AVANCA.indexOf(ev.key) !== -1) { proximo(); ev.preventDefault(); return; }
    if (VOLTA.indexOf(ev.key) !== -1) { anterior(); ev.preventDefault(); return; }
  });

  barra.addEventListener("click", function (ev) {
    var acao = ev.target.dataset.ir;
    if (acao === "proximo") proximo();
    else if (acao === "anterior") anterior();
    else if (acao === "notas") notas.classList.toggle("aberta");
    else if (acao === "tema") alternarTema();
    else if (acao === "tela") telaCheia();
  });

  // --- tema e tela cheia --------------------------------------------------

  function alternarTema() {
    var raiz = document.documentElement;
    var novo = raiz.dataset.tema === "claro" ? "escuro" : "claro";
    raiz.dataset.tema = novo;
    try { localStorage.setItem("tema", novo); } catch (e) { /* modo anônimo */ }
  }

  try {
    var salvo = localStorage.getItem("tema");
    if (salvo) document.documentElement.dataset.tema = salvo;
  } catch (e) { /* modo anônimo: segue no tema padrão */ }

  function telaCheia() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  // --- início -------------------------------------------------------------

  function doHash() {
    var n = parseInt(location.hash.replace("#", ""), 10);
    return isNaN(n) ? 0 : n - 1;
  }

  window.addEventListener("resize", escalar);
  window.addEventListener("hashchange", function () { mostrar(doHash(), true); });

  escalar();
  mostrar(doHash(), true);
})();
