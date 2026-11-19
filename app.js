(() => {
  const C = window.CONFIG, CATS = window.CATEGORIAS;
  const PRODS = window.PRODUTOS.filter(p => p.ativo !== false);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const wa = msg => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;
  const msgProduto = nome => `Oi! Vim pelo site e quero um orçamento de: ${nome} ✉️`;
  const img = (nome, w) => `img/${nome}-${w}.webp`;

  // links gerais
  $$(".js-wa-geral").forEach(a => (a.href = wa(C.mensagemGeral)));
  $$(".js-ig").forEach(a => (a.href = `https://instagram.com/${C.instagram}`));
  $$(".js-tt").forEach(a => (a.href = `https://www.tiktok.com/@${C.tiktok}`));

  // aviso de Natal com contagem
  const fim = new Date(C.prazoNatal + "T23:59:59");
  const dias = Math.ceil((fim - new Date()) / 864e5);
  if (dias >= 0) {
    const el = $(".js-natal");
    el.hidden = false;
    $(".js-natal-txt").textContent = dias === 0
      ? "Hoje é o último dia para pedidos de Natal"
      : `Pedidos de Natal até ${fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · faltam ${dias} ${dias === 1 ? "dia" : "dias"}`;
  }

  // ---------- catálogo ----------
  const chips = $(".js-chips"), faixas = $(".js-faixas");
  const seta = d => `<svg viewBox="0 0 24 24"><path d="${d ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"}"/></svg>`;

  CATS.forEach(cat => {
    const itens = PRODS.filter(p => p.categoria === cat.id);
    if (!itens.length) return;
    chips.insertAdjacentHTML("beforeend", `<a class="chip" href="#cat-${cat.id}" data-cat="${cat.id}">${esc(cat.nome)}</a>`);
    faixas.insertAdjacentHTML("beforeend", `
      <section class="faixa revela" id="cat-${cat.id}" aria-labelledby="h-${cat.id}">
        <div class="faixa-cab">
          <div><h3 id="h-${cat.id}">${esc(cat.nome)}</h3>${cat.nota ? `<p class="nota">${esc(cat.nota)}</p>` : ""}</div>
          <div class="setas">
            <button class="seta-btn" type="button" data-dir="-1" aria-label="Ver anteriores em ${esc(cat.nome)}">${seta(0)}</button>
            <button class="seta-btn" type="button" data-dir="1" aria-label="Ver mais em ${esc(cat.nome)}">${seta(1)}</button>
          </div>
        </div>
        <div class="trilho" tabindex="0" role="list" aria-label="${esc(cat.nome)}">
          ${itens.map(p => `
          <article class="card" role="listitem">
            <button class="card-abrir" type="button" data-id="${p.id}" aria-label="Ver detalhes: ${esc(p.nome)}">
              <div class="card-foto"><img src="${img(p.foto, 480)}" srcset="${img(p.foto, 480)} 480w, ${img(p.foto, 800)} 800w" sizes="280px" alt="${esc(p.nome)}" width="480" height="600" loading="lazy" decoding="async"></div>
              ${p.selo ? `<span class="selo">${esc(p.selo)}</span>` : ""}
              <div class="card-txt"><h4>${esc(p.nome)}</h4><p>${esc(p.curta)}</p></div>
            </button>
            <div class="card-rodape">
              <p class="preco">a partir de <strong>${esc(p.preco)}</strong>${esc(p.unidade || "")}</p>
              <a class="btn btn-tinta" href="${wa(msgProduto(p.nome))}" target="_blank" rel="noopener">
                <svg class="ico-wa" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wa"/></svg>Pedir no WhatsApp
              </a>
            </div>
          </article>`).join("")}
        </div>
      </section>`);
  });

  // setas das faixas (computador)
  $$(".faixa").forEach(f => {
    const t = $(".trilho", f), [ant, prox] = $$(".seta-btn", f);
    const atualiza = () => {
      ant.disabled = t.scrollLeft < 8;
      prox.disabled = t.scrollLeft + t.clientWidth >= t.scrollWidth - 8;
    };
    $$(".seta-btn", f).forEach(b => b.addEventListener("click", () =>
      t.scrollBy({ left: +b.dataset.dir * t.clientWidth * 0.85, behavior: "smooth" })));
    t.addEventListener("scroll", atualiza, { passive: true });
    window.addEventListener("resize", atualiza);
    atualiza();
  });

  // chip ativo conforme a rolagem
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.id.replace("cat-", "");
    $$(".chip").forEach(c => {
      const on = c.dataset.cat === id;
      c.setAttribute("aria-current", on);
      if (on) c.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    });
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$(".faixa").forEach(f => io.observe(f));

  // ---------- modal ----------
  const modal = $(".js-modal");
  let atual = null;
  const abrir = p => {
    atual = p;
    const cat = CATS.find(c => c.id === p.categoria);
    $(".js-m-img").src = img(p.foto, 800);
    $(".js-m-img").alt = p.nome;
    $(".js-m-cat").textContent = cat ? cat.nome : "";
    $(".js-m-nome").textContent = p.nome;
    $(".js-m-preco").textContent = p.preco + (p.unidade || "");
    $(".js-m-desc").textContent = p.descricao;
    $(".js-m-prazo").textContent = p.prazo;
    $(".js-m-min").textContent = p.minimo;
    $(".js-m-tags").innerHTML = (p.personaliza || []).map(t => `<li>${esc(t)}</li>`).join("");
    $(".js-m-wa").href = wa(msgProduto(p.nome));
    modal.showModal();
    modal.scrollTop = 0;
    history.pushState({ modal: p.id }, "", "#" + p.id);
  };
  const fechar = () => { if (modal.open) modal.close(); };
  faixas.addEventListener("click", e => {
    const b = e.target.closest(".card-abrir");
    if (b) abrir(PRODS.find(p => p.id === b.dataset.id));
  });
  $(".js-fechar").addEventListener("click", fechar);
  modal.addEventListener("click", e => { if (e.target === modal) fechar(); });
  modal.addEventListener("close", () => { if (history.state && history.state.modal) history.back(); });
  window.addEventListener("popstate", () => { if (modal.open) modal.close(); });
  $(".js-m-montar").addEventListener("click", () => {
    const id = atual && atual.id;
    fechar();
    setTimeout(() => {
      sel.value = id;
      $("#pedido").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => $("[name=quantidade]").focus({ preventScroll: true }), 600);
    }, 60);
  });
  // abrir direto por link (ex.: site/#bola-foto)
  const inicial = PRODS.find(p => "#" + p.id === location.hash);
  if (inicial) { history.replaceState(null, "", location.pathname); abrir(inicial); }

  // ---------- formulário ----------
  const sel = $(".js-select-produto");
  sel.innerHTML = `<option value="" disabled selected>Escolha um produto</option>` +
    CATS.map(c => {
      const itens = PRODS.filter(p => p.categoria === c.id);
      return itens.length ? `<optgroup label="${esc(c.nome)}">${itens.map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join("")}</optgroup>` : "";
    }).join("") + `<option value="outro">Outra ideia / ainda não sei</option>`;

  $(".js-form").addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target), v = k => (f.get(k) || "").toString().trim();
    const campoSel = sel.closest(".campo");
    if (!sel.value) { campoSel.classList.add("erro"); sel.focus(); return; }
    campoSel.classList.remove("erro");
    const prod = PRODS.find(p => p.id === sel.value);
    let data = v("data");
    if (data) { const [a, m, d] = data.split("-"); data = `${d}/${m}/${a}`; }
    const linhas = [
      `Oi! Vim pelo site e quero um orçamento ✉️`,
      ``,
      `• Produto: ${prod ? prod.nome : "Outra ideia"}`,
      v("quantidade") && `• Quantidade: ${v("quantidade")}`,
      data && `• Para quando: ${data}`,
      v("tema") && `• Tema / nomes: ${v("tema")}`,
      v("cidade") && `• Entrega em: ${v("cidade")}`,
      v("obs") && `• Detalhes: ${v("obs")}`,
      v("nome") && `\nMeu nome é ${v("nome")}.`,
    ].filter(x => x !== "" && x !== false && x != null);
    location.href = wa(linhas.join("\n"));
  });
  sel.addEventListener("change", () => sel.closest(".campo").classList.remove("erro"));

  // topo com sombra ao rolar
  const topo = $("#topo");
  const onScroll = () => topo.classList.toggle("rolou", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // marca as seções para a entrada suave
  $$(".passos, .pedido, .sobre, .faq").forEach(s => s.classList.add("revela"));
})();
