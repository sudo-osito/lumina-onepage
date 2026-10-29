/* Lumina · one-page. Sin dependencias. Partes que vienen de la one-page de Médula y la v6 de Optimizo: títulos que se arman,
   texto que se escribe, scroll suave con la frase que detiene la página y las detecciones reales del modelo sobre el video. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOVIL = () => innerWidth < 1020;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = (x) => 1 - Math.pow(1 - x, 3);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const hora = (d = new Date()) => d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

/* ── Títulos que se arman palabra por palabra ── */
$$(".arma").forEach((h) => {
  let i = 0;
  const partir = (txt, cls) => txt.split(/(\s+)/).map((w) => (w.trim() ? `<span class="pal"><span class="${cls || ""}" style="--i:${i++}">${w}</span></span>` : w)).join("");
  h.innerHTML = [...h.childNodes].map((n) => (n.nodeType === 3 ? partir(n.textContent) : partir(n.textContent, n.className))).join("");
});
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } }), { threshold: .15 });
$$("[data-r], .arma").forEach((n) => io.observe(n));

function alVer(el, entrar, salir, umbral = .1) {
  new IntersectionObserver(([e]) => (e.isIntersecting ? entrar() : salir && salir()), { threshold: umbral }).observe(el);
}
function bucleVisible(el, cuadro, fps = 60) {
  let vivo = false, raf = 0, ultimo = 0;
  const paso = (ahora) => { if (!vivo) return; raf = requestAnimationFrame(paso); if (ahora - ultimo < 1000 / fps - 2) return; ultimo = ahora; cuadro(); };
  alVer(el, () => { if (!vivo) { vivo = true; raf = requestAnimationFrame(paso); } }, () => { vivo = false; cancelAnimationFrame(raf); }, 0);
  if (QUIETO) requestAnimationFrame(() => cuadro());
}
function lienzo(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h); return { c, w, h };
}

/* ── La luz de Lumina: una malla de puntos que casi no se ve; donde pasa la luz, los puntos se encienden ── */
const LUCES = {
  // el héroe: la luz recorre la mitad derecha y sigue al puntero; el cierre: sube desde abajo, al centro
  heroe: (t, w, h) => [MOVIL() ? w * (.5 + .3 * Math.sin(t * .23)) : w * (.72 + .16 * Math.sin(t * .21)), h * (.36 + .2 * Math.sin(t * .17 + 1.3))],
  fin: (t, w, h) => [w * (.5 + .22 * Math.sin(t * .19)), h * (.78 + .1 * Math.sin(t * .23 + .7))],
};
function luz(cv, recorrido) {
  const sec = cv.parentElement, ptr = { x: 0, y: 0, dentro: false };
  let base = null, paso = 16, bw = 0, bh = 0, t = Math.random() * 20, lx = null, ly = null, previo = performance.now();
  const malla = (w, h) => {
    paso = w < 600 ? 14 : 16; bw = w; bh = h;
    const dpr = Math.min(2, devicePixelRatio || 1);
    base = document.createElement("canvas"); base.width = Math.round(w * dpr); base.height = Math.round(h * dpr);
    const b = base.getContext("2d"); b.scale(dpr, dpr); b.fillStyle = "rgba(11,19,27,.075)";
    for (let y = paso / 2; y < h; y += paso) for (let x = paso / 2; x < w; x += paso) { b.beginPath(); b.arc(x, y, 1, 0, 7); b.fill(); }
  };
  sec.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.dentro = e.pointerType === "mouse"; });
  sec.addEventListener("pointerleave", () => (ptr.dentro = false));
  bucleVisible(sec, () => {
    const { c, w, h } = lienzo(cv), ahora = performance.now(), dt = Math.min(.1, (ahora - previo) / 1000); previo = ahora;
    if (!base || bw !== w || bh !== h) malla(w, h);
    t += QUIETO ? 0 : dt;
    let [mx, my] = recorrido(t, w, h);
    if (ptr.dentro) { mx = lerp(mx, ptr.x, .75); my = lerp(my, ptr.y, .75); }
    if (lx === null) { lx = mx; ly = my; }
    const s = 1 - Math.pow(1 - .06, dt * 60); lx += (mx - lx) * s; ly += (my - ly) * s;
    const R = Math.min(300, Math.max(180, w * .2));
    c.drawImage(base, 0, 0, w, h);
    const g = c.createRadialGradient(lx, ly, 0, lx, ly, R * 1.9);
    g.addColorStop(0, "rgba(255,190,70,.1)"); g.addColorStop(.35, "rgba(255,190,70,.05)"); g.addColorStop(.7, "rgba(255,190,70,.015)"); g.addColorStop(1, "rgba(255,190,70,0)");
    c.fillStyle = g; c.fillRect(lx - R * 2, ly - R * 2, R * 4, R * 4);
    const x0 = Math.max(paso / 2, Math.floor((lx - R) / paso) * paso + paso / 2), y0 = Math.max(paso / 2, Math.floor((ly - R) / paso) * paso + paso / 2);
    for (let y = y0; y < Math.min(h, ly + R); y += paso) for (let x = x0; x < Math.min(w, lx + R); x += paso) {
      const d = Math.hypot(x - lx, y - ly) / R; if (d >= 1) continue;
      const k = Math.pow(1 - d, 1.6);
      c.fillStyle = k > .55 ? `rgba(240,138,0,${.25 + .6 * k})` : `rgba(255,174,26,${.08 + .75 * k})`;
      c.beginPath(); c.arc(x, y, 1 + 1.25 * k, 0, 7); c.fill();
    }
  }, 30);
}
$$("canvas[data-luz]").forEach((cv) => luz(cv, LUCES[cv.dataset.luz]));

/* ── Texto que se escribe y se borra, como un teclado ── */
function maquina(el, { una = false, ms = 0 } = {}) {
  const palabras = el.dataset.palabras.split("|");
  let i = el.textContent ? 1 : 0, vivo = false, turno = 0;
  const tipear = ms || 62, borrar = 30;
  async function correr() {
    const mio = ++turno, sigue = () => vivo && mio === turno;
    if (el.textContent) { await esperar(2200); }
    while (sigue()) {
      el.classList.add("escribiendo");
      let letras = Array.from(el.textContent);
      while (letras.length && sigue()) { letras.pop(); el.textContent = letras.join(""); await esperar(borrar); }
      const w = Array.from(palabras[i % palabras.length]);
      for (let k = 1; k <= w.length && sigue(); k++) { el.textContent = w.slice(0, k).join(""); await esperar(tipear + Math.random() * (ms ? ms * .6 : 45)); }
      el.classList.remove("escribiendo");
      if (una || !sigue()) { vivo = false; return; }
      i++; await esperar(2400);
    }
  }
  return {
    iniciar() { if (vivo) return; if (QUIETO) { el.textContent = palabras[0]; return; } vivo = true; return correr(); },
    parar() { vivo = false; turno++; el.classList.remove("escribiendo"); },
  };
}
{ const m = maquina($("#tipeo")); alVer($("#heroe"), () => m.iniciar(), () => m.parar(), 0); }

/* ── Detecciones reales del modelo sobre el video (las mismas de la v6 de Optimizo) ── */
const DET = window.DETECCIONES || [];
const LETRA = (px) => `600 ${px}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
function mapa(w, h) { const s = Math.max(w / 16, h / 9), vw = 16 * s, vh = 9 * s, ox = (w - vw) / 2, oy = (h - vh) / 2; return { X: (n) => ox + n * vw, Y: (n) => oy + n * vh }; }
function cajas(t) {
  const f = DET.length ? DET[Math.min(DET.length - 1, Math.round(t * 25))] : null, out = [];
  if (!f) return out;
  if (f.m) { const [mx, my, mw, mh] = f.m, x0 = Math.max(mx, .43), x1 = Math.min(mx + mw, .84 - .08 * t / 5.96); out.push({ x: x0, y: Math.max(my, .02) + 40 / 630, w: x1 - x0, h: mh - 70 / 630, col: "#FF8A00", txt: "Montacargas", m: 1 }); }
  f.p.slice(0, 2).forEach((p) => out.push({ x: p[0], y: p[1] + 30 / 630, w: p[2], h: p[3], col: "#FFD37A", txt: "Persona" }));
  return out;
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
function pildora(c, x, y, txt, col, k, e) {
  const fs = 12.5 * e; c.font = LETRA(fs); const tw = c.measureText(txt).width + 22 * e, hh = 24 * e, ly = Math.max(y - hh - 6 * e, 4);
  c.globalAlpha = k; c.fillStyle = "rgba(15,11,6,.82)"; rr(c, x, ly, tw, hh, hh / 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x + 11 * e, ly + hh / 2, 3.5 * e, 0, 7); c.fill();
  c.fillStyle = "#fff"; c.textBaseline = "middle"; c.fillText(txt, x + 19 * e, ly + hh / 2 + .5); c.globalAlpha = 1;
}
function dibujarCajas(c, M, lista, k, e) {
  lista.forEach((b, i) => {
    const ki = eo(clamp(k * 1.4 - i * .15)); if (ki <= 0) return;
    const g = (1 - ki) * 10, x = M.X(b.x) - g, y = M.Y(b.y) - g, w = M.X(b.x + b.w) - M.X(b.x) + 2 * g, h = M.Y(b.y + b.h) - M.Y(b.y) + 2 * g;
    c.globalAlpha = ki; c.strokeStyle = b.col; c.lineWidth = 2 * e; c.fillStyle = b.col + "18"; rr(c, x, y, w, h, 14 * e); c.fill(); c.stroke(); c.globalAlpha = 1;
    pildora(c, x, y, b.txt, b.col, ki, e);
  });
}
function dibujarRiesgo(c, M, lista, k, t, e) {
  if (k <= .01) return;
  const P = [[.66, .99], [.7, .33], [.78, .25], [.995, .2], [.995, .99]];
  c.globalAlpha = eo(k); c.beginPath(); P.forEach(([x, y], i) => (i ? c.lineTo(M.X(x), M.Y(y)) : c.moveTo(M.X(x), M.Y(y)))); c.closePath();
  c.fillStyle = `rgba(229,72,77,${.1 + .06 * Math.sin(t * 5)})`; c.fill(); c.strokeStyle = "#E5484D"; c.lineWidth = 2 * e; c.setLineDash([8 * e, 6 * e]); c.stroke(); c.setLineDash([]);
  c.globalAlpha = 1; pildora(c, M.X(.69), M.Y(.97), "Zona de riesgo", "#E5484D", eo(k), e);
  const m = lista.find((b) => b.m), p = lista.find((b) => !b.m);
  if (m && p) {
    const ax = M.X(m.x + m.w), ay = M.Y(m.y + m.h * .45), bx = M.X(p.x), by = M.Y(p.y + p.h * .5), kk = eo(clamp(k * 1.5 - .3));
    c.globalAlpha = kk; c.strokeStyle = "#FFAE1A"; c.lineWidth = 2.5 * e; c.setLineDash([6 * e, 6 * e]); c.lineDashOffset = -t * 30;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(lerp(ax, bx, kk), lerp(ay, by, kk)); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    pildora(c, (ax + bx) / 2 - 44 * e, (ay + by) / 2 + 6 * e, "Proximidad", "#FFAE1A", kk, e);
  }
}
function videoConCapa(cont, alCuadro, fps = 60) {
  const video = $("video", cont);
  bucleVisible(cont, () => alCuadro(video.currentTime, video), fps);
  alVer(cont, () => { if (!cont.dataset.pausa) video.play().catch(() => {}); }, () => video.pause(), 0);
  return video;
}
const cuenta = (lista) => { const np = lista.filter((b) => !b.m).length; return [np, lista.some((b) => b.m) ? 1 : 0]; };

/* ── El visor: el video a todo el ancho, siempre detectando ── */
{
  const visor = $("#visor"), cv = $("canvas", visor), conteo = $("#conteo-visor");
  let previo = "";
  videoConCapa(visor, (t) => {
    const { c, w, h } = lienzo(cv), lista = cajas(t);
    dibujarCajas(c, mapa(w, h), lista, 1, clamp(w / 900, .8, 1.25));
    const [np, nm] = cuenta(lista), txt = `${np} ${np === 1 ? "persona" : "personas"} · ${nm} montacargas`;
    if (txt !== previo) { conteo.textContent = txt; previo = txt; }
  });
}

/* ── El desafío: un solo video repartido en cuatro cámaras en gris, sin nadie mirando ── */
{
  const muro = $("#muro"), video = $("video", muro), cams = $$(".cam canvas", muro), relojes = $$(".cam__hora", muro);
  let ultimoReloj = 0;
  bucleVisible(muro, () => {
    if (video.readyState >= 2) cams.forEach((cv) => {
      const { c, w, h } = lienzo(cv), z = +cv.dataset.z, vw = video.videoWidth, vh = video.videoHeight;
      const sw = vw / z, sh = Math.min(vh, sw * h / w), sx = clamp(+cv.dataset.x * vw - sw / 2, 0, vw - sw), sy = (vh - sh) * +cv.dataset.y;
      if (cv.hasAttribute("data-espejo")) { c.translate(w, 0); c.scale(-1, 1); }
      c.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    });
    const ahora = Date.now();
    if (ahora - ultimoReloj > 500) { ultimoReloj = ahora; relojes.forEach((r) => (r.textContent = hora(new Date(ahora + +r.dataset.off * 1000)))); }
  }, 24);
  alVer(muro, () => { video.preload = "auto"; video.play().catch(() => {}); }, () => video.pause(), 0);
}

/* ── Navegación ── */
const nav = $("#nav");
function pintarNav() { nav.classList.toggle("bajo", scrollY > 8); }

/* ── Scroll suave (solo con mouse o trackpad; en el celular queda el nativo) y bloqueo mientras la frase se escribe ── */
const suave = { y: scrollY, meta: scrollY, activo: false, bloqueado: false, viaje: false };
{
  const fino = !QUIETO && matchMedia("(pointer: fine)").matches;
  const paso = () => {
    suave.y += (suave.meta - suave.y) * .12;
    if (Math.abs(suave.meta - suave.y) < .5) { suave.y = suave.meta; suave.activo = false; suave.viaje = false; }
    scrollTo(0, suave.y);
    if (suave.activo) requestAnimationFrame(paso);
  };
  addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;
    if (suave.bloqueado) { e.preventDefault(); return; }
    if (!fino || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); suave.viaje = false;
    if (!suave.activo) suave.y = suave.meta = scrollY;
    const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1);
    suave.meta = clamp(suave.meta + d, 0, document.documentElement.scrollHeight - innerHeight);
    if (!suave.activo) { suave.activo = true; requestAnimationFrame(paso); }
  }, { passive: false });
  addEventListener("touchmove", (e) => suave.bloqueado && e.preventDefault(), { passive: false });
  addEventListener("keydown", (e) => { if (suave.bloqueado && [" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "End", "Home"].includes(e.key)) e.preventDefault(); });
  addEventListener("scroll", () => { if (!suave.activo) suave.y = suave.meta = scrollY; }, { passive: true });
  // los enlaces internos viajan suave y no se detienen en la frase
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const t = a.getAttribute("href") === "#inicio" ? document.body : $(a.getAttribute("href")); if (!t || QUIETO) return;
    e.preventDefault(); suave.viaje = true; suave.y = scrollY;
    suave.meta = clamp(t.getBoundingClientRect().top + scrollY - (t === document.body ? 0 : 64), 0, document.documentElement.scrollHeight - innerHeight);
    if (!suave.activo) { suave.activo = true; requestAnimationFrame(paso); }
  }));
}
function irA(y) { suave.activo = false; suave.y = suave.meta = y; scrollTo(0, y); }

/* ── La frase: al llegar, la página se detiene hasta que termina de escribirse ── */
let pintarFrase = () => {};
{
  const sec = $("#frase"), ls = $$(".frase__l", sec), ms = ls.map((l, i) => maquina($(".tipeo", l), { una: true, ms: i ? 44 : 20 }));
  let estado = 0; // 0 esperando · 1 escribiendo · 2 listo
  async function escribir() {
    estado = 1; suave.bloqueado = true;
    const r = sec.getBoundingClientRect(); irA(Math.round(scrollY + r.top + r.height / 2 - innerHeight / 2));
    const suelta = setTimeout(() => (suave.bloqueado = false), 4500);
    for (const [i, l] of ls.entries()) { l.classList.add("on"); await ms[i].iniciar(); await esperar(i ? 0 : 260); if (i < ls.length - 1) l.classList.remove("on"); }
    await esperar(300);
    clearTimeout(suelta); suave.bloqueado = false; estado = 2;
  }
  pintarFrase = () => {
    if (estado || suave.viaje) return;
    const r = sec.getBoundingClientRect(), centro = r.top + r.height / 2;
    if (QUIETO) { if (r.top < innerHeight) { estado = 2; ms.forEach((m) => m.iniciar()); } return; }
    if (centro <= innerHeight * .55 && r.bottom > innerHeight * .3) escribir();
  };
}

/* ── Pasos que avanzan solos con su barra; un clic salta a ese paso y el mouse encima los pausa ── */
function carrusel({ caja, items, dur, alCambiar }) {
  let actual = 0, t0 = 0, previo = performance.now(), pausa = false, iniciado = false;
  const ir = (i) => { actual = i; t0 = performance.now(); items.forEach((p, j) => { p.classList.toggle("activo", j === i); p.style.setProperty("--prog", 0); }); alCambiar(i); };
  items.forEach((p, i) => $("button", p).addEventListener("click", () => ir(i)));
  caja.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && (pausa = true));
  caja.addEventListener("pointerleave", () => (pausa = false));
  if (QUIETO) { ir(0); return; }
  alVer(caja, () => { if (!iniciado) { iniciado = true; ir(0); } }, null, .3);
  bucleVisible(caja, () => {
    const ahora = performance.now(), dt = ahora - previo; previo = ahora;
    if (!iniciado) return;
    if (pausa) { t0 += Math.min(dt, 100); return; }
    const d = typeof dur === "function" ? dur(actual) : dur, k = clamp((ahora - t0) / d);
    items[actual].style.setProperty("--prog", k);
    if (k >= 1) ir((actual + 1) % items.length);
  }, 30);
}

/* ── Cómo funciona: detectar, alertar, evidenciar y mejorar sobre el mismo video ── */
{
  const mon = $("#monitor"), cv = $("canvas", mon), conteo = $("#conteo-mon"), k = { c: 1, r: 0 };
  let fase = 0, previo = "";
  const video = videoConCapa(mon, (t) => {
    const { c, w, h } = lienzo(cv), M = mapa(w, h), e = clamp(w / 900, .7, 1.2), ahora = performance.now() / 1000, lista = cajas(t);
    k.c += ((fase <= 2 ? 1 : .0) - k.c) * .1; k.r += ((fase === 1 || fase === 2 ? 1 : 0) - k.r) * .07;
    dibujarRiesgo(c, M, lista, k.r, ahora, e); dibujarCajas(c, M, lista, k.c, e);
    const [np, nm] = cuenta(lista), txt = `${np} ${np === 1 ? "PERSONA" : "PERSONAS"} · ${nm} MONTACARGAS`;
    if (txt !== previo) { conteo.textContent = txt; previo = txt; }
  });
  const sube = () => { const t0 = performance.now(), bs = $$(".tablero b[data-n]", mon); const paso = () => { const q = eo(clamp((performance.now() - t0) / 1100)); bs.forEach((b) => { const n = Math.round(q * +b.dataset.n); b.textContent = b.hasAttribute("data-pad") ? String(n).padStart(2, "0") : n; }); if (q < 1 && fase === 3) requestAnimationFrame(paso); }; paso(); };
  carrusel({
    caja: $("#como-in"), items: $$(".paso"), dur: (i) => [3600, 4600, 4000, 4600][i],
    alCambiar: (i) => {
      fase = i; mon.dataset.fase = i;
      // evidenciar: el cuadro se congela, como una captura, y queda la ficha del hallazgo
      if (i === 2) { delete mon.dataset.pausa; video.pause(); mon.classList.remove("flash"); void mon.offsetWidth; mon.classList.add("flash"); const d = new Date(); $("#ficha-hora").textContent = hora(d); $("#ficha-fecha").textContent = d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }); mon.dataset.pausa = 1; }
      else { delete mon.dataset.pausa; video.play().catch(() => {}); }
      if (i === 3) sube();
    },
  });
}

/* ── Aplicaciones: la vitrina cambia con el caso ── */
{
  const imgs = $$(".vitrina img");
  carrusel({ caja: $("#usos-in"), items: $$(".caso"), dur: 5200, alCambiar: (i) => imgs.forEach((im, j) => im.classList.toggle("activo", j === i)) });
}

/* ── Metodología: la luz recorre la línea y enciende cada etapa ── */
{
  const cont = $("#etapas"), luzL = $(".etapas__luz", cont), etapas = $$(".etapa", cont), CICLO = 11000, PAUSA = 2200;
  let t0 = 0;
  if (QUIETO) { luzL.style.setProperty("--k", 1); etapas.forEach((e) => e.classList.add("on")); }
  else {
    alVer(cont, () => { if (!t0) t0 = performance.now(); }, null, .3);
    bucleVisible(cont, () => {
      if (!t0) return;
      const q = ((performance.now() - t0) % (CICLO + PAUSA)) / CICLO, k = clamp(q);
      luzL.style.setProperty("--k", k);
      etapas.forEach((e, i) => e.classList.toggle("on", k >= i / 4 + .02));
    }, 30);
  }
}

/* ── Arquitectura: un plano con la inteligencia en tu operación (Edge AI) o en la nube (Cloud AI) ── */
{
  const svg = $("#plano-svg"), plano = $("#plano"), NS = "http://www.w3.org/2000/svg";
  const PLANOS = {
    ancho: {
      vb: [1120, 460],
      zonas: [{ x: 0, y: 0, w: 640, h: 460, t: "Tu operación" }, { x: 680, y: 0, w: 440, h: 200, t: "Nube", nube: 1 }, { x: 680, y: 240, w: 440, h: 220, t: "Interfaz central" }],
      nodos: {
        cam: { x: 40, y: 72, w: 230, t: "Cámaras", s: "Video y señales desde terreno" },
        per: { x: 40, y: 338, w: 230, t: "Periféricos", s: "Balizas, proyectores, alarmas" },
        ia: { edge: [372, 205], nube: [790, 78], w: 230, t: "Procesamiento IA", s: { edge: "PC industrial o servidor GPU", nube: "Sin GPU en tu operación" } },
        plat: { x: 704, y: 318, w: 192, t: "Plataforma", s: "Eventos y evidencia" },
        eq: { x: 912, y: 318, w: 184, t: "Tu equipo", s: "Jefaturas notificadas" },
      },
    },
    angosto: {
      vb: [360, 760],
      zonas: [{ x: 0, y: 0, w: 360, h: 370, t: "Tu operación" }, { x: 0, y: 400, w: 360, h: 140, t: "Nube", nube: 1 }, { x: 0, y: 570, w: 360, h: 190, t: "Interfaz central" }],
      nodos: {
        cam: { x: 16, y: 52, w: 156, t: "Cámaras", s: "Video en terreno" },
        per: { x: 188, y: 52, w: 156, t: "Periféricos", s: "Balizas y alarmas" },
        ia: { edge: [90, 246], nube: [90, 446], w: 180, t: "Procesamiento IA", s: { edge: "PC o servidor GPU", nube: "Modelos en la nube" } },
        plat: { x: 16, y: 640, w: 156, t: "Plataforma", s: "Eventos y evidencia" },
        eq: { x: 188, y: 640, w: 156, t: "Tu equipo", s: "Jefaturas" },
      },
    },
  };
  const ALTO = 72, LINEAS = [["cam", "ia"], ["ia", "per"], ["ia", "plat"], ["plat", "eq"]];
  let P, modo = "edge", iaPos = null, iaMeta = null, els = {};
  const el = (n, a = {}, padre = svg) => { const e = document.createElementNS(NS, n); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); padre.appendChild(e); return e; };
  function armar() {
    P = MOVIL() ? PLANOS.angosto : PLANOS.ancho; svg.innerHTML = ""; els = { lineas: [], datos: [] };
    svg.setAttribute("viewBox", `0 0 ${P.vb[0]} ${P.vb[1]}`);
    P.zonas.forEach((z) => { el("rect", { class: "p-zona" + (z.nube ? " p-zona--nube" : ""), x: z.x + .5, y: z.y + .5, width: z.w - 1, height: z.h - 1, rx: 20 }); el("text", { class: "p-zona-t", x: z.x + 20, y: z.y + 30 }).textContent = z.t.toUpperCase(); });
    LINEAS.forEach(() => { els.lineas.push(el("path", { class: "p-linea" })); els.datos.push([el("circle", { class: "p-dato", r: 4 }), el("circle", { class: "p-dato", r: 4 })]); });
    els.nodos = {};
    Object.entries(P.nodos).forEach(([id, n]) => {
      const g = el("g", { class: "p-nodo" + (id === "ia" ? " p-nodo--ia" : "") });
      el("rect", { width: n.w, height: ALTO, rx: 16 }, g);
      el("circle", { class: "p-ico", cx: 22, cy: ALTO / 2, r: id === "ia" ? 6 : 4.5 }, g);
      el("text", { class: "p-t", x: 38, y: 31 }, g).textContent = n.t;
      els.nodos[id] = { g, sub: el("text", { class: "p-s", x: 38, y: 51 }, g) };
      if (id !== "ia") { els.nodos[id].sub.textContent = n.s; g.setAttribute("transform", `translate(${n.x} ${n.y})`); }
    });
    els.fantasma = el("g", { class: "p-fantasma", role: "button", "aria-label": "Cambiar el lugar del procesamiento" });
    el("rect", { width: P.nodos.ia.w, height: ALTO, rx: 16 }, els.fantasma);
    els.fantasmaT = el("text", { x: P.nodos.ia.w / 2, y: ALTO / 2 + 5, "text-anchor": "middle" }, els.fantasma);
    els.fantasma.addEventListener("click", () => elegir(modo === "edge" ? "nube" : "edge"));
    svg.insertBefore(els.fantasma, els.nodos.ia.g);
    iaPos = [...P.nodos.ia[modo]]; iaMeta = [...P.nodos.ia[modo]]; ponerFantasma();
    els.nodos.ia.sub.textContent = P.nodos.ia.s[modo];
  }
  function ponerFantasma() { const otro = modo === "edge" ? "nube" : "edge", [x, y] = P.nodos.ia[otro]; els.fantasma.setAttribute("transform", `translate(${x} ${y})`); els.fantasmaT.textContent = otro === "nube" ? "Procesar en la nube" : "Procesar en tu operación"; }
  const caja = (id) => { const n = P.nodos[id]; return id === "ia" ? { x: iaPos[0], y: iaPos[1], w: n.w, h: ALTO } : { x: n.x, y: n.y, w: n.w, h: ALTO }; };
  function curva(a, b) {
    const ca = [a.x + a.w / 2, a.y + a.h / 2], cb = [b.x + b.w / 2, b.y + b.h / 2], dx = cb[0] - ca[0], dy = cb[1] - ca[1];
    if (Math.abs(dx) > Math.abs(dy) * 1.1 && Math.abs(dx) > (a.w + b.w) / 2) {
      const s = Math.sign(dx), p0 = [ca[0] + s * a.w / 2, ca[1]], p1 = [cb[0] - s * b.w / 2, cb[1]], m = Math.abs(p1[0] - p0[0]) * .5;
      return `M${p0[0]} ${p0[1]} C${p0[0] + s * m} ${p0[1]} ${p1[0] - s * m} ${p1[1]} ${p1[0]} ${p1[1]}`;
    }
    const s = Math.sign(dy) || 1, p0 = [ca[0], ca[1] + s * a.h / 2], p1 = [cb[0], cb[1] - s * b.h / 2], m = Math.max(30, Math.abs(p1[1] - p0[1]) * .5);
    return `M${p0[0]} ${p0[1]} C${p0[0]} ${p0[1] + s * m} ${p1[0]} ${p1[1] - s * m} ${p1[0]} ${p1[1]}`;
  }
  let fuera = 0, previo = performance.now(), t = 0;
  function cuadro() {
    const ahora = performance.now(), dt = Math.min(.1, (ahora - previo) / 1000); previo = ahora; t += dt;
    const s = 1 - Math.pow(1 - .09, dt * 60);
    iaPos[0] += (iaMeta[0] - iaPos[0]) * s; iaPos[1] += (iaMeta[1] - iaPos[1]) * s;
    els.nodos.ia.g.setAttribute("transform", `translate(${iaPos[0].toFixed(1)} ${iaPos[1].toFixed(1)})`);
    const viajando = Math.hypot(iaMeta[0] - iaPos[0], iaMeta[1] - iaPos[1]) > 2;
    fuera = viajando ? Math.max(0, fuera - dt * 4) : Math.min(1, fuera + dt * 1.5);
    LINEAS.forEach(([a, b], i) => {
      const path = els.lineas[i]; path.setAttribute("d", curva(caja(a), caja(b)));
      const L = path.getTotalLength();
      els.datos[i].forEach((d, j) => { const q = (t * (modo === "nube" && (a === "ia" || b === "ia") ? .32 : .42) + j * .5 + i * .17) % 1, p = path.getPointAtLength(q * L); d.setAttribute("cx", p.x); d.setAttribute("cy", p.y); d.setAttribute("opacity", (fuera * Math.sin(q * Math.PI)).toFixed(2)); });
    });
  }
  const elegir = (m) => {
    modo = m; plano.dataset.modo = m; iaMeta = [...P.nodos.ia[m]]; els.nodos.ia.sub.textContent = P.nodos.ia.s[m]; ponerFantasma();
    $$(".modo").forEach((b) => b.setAttribute("aria-pressed", b.dataset.modo === m));
  };
  armar(); cuadro();
  let eraMovil = MOVIL();
  addEventListener("resize", () => { if (MOVIL() !== eraMovil) { eraMovil = MOVIL(); armar(); cuadro(); } });
  $$(".modo").forEach((b) => b.addEventListener("click", () => elegir(b.dataset.modo)));
  bucleVisible(plano, cuadro, 60);
}

/* ── Plataforma: tres vistas de la misma ventana ── */
{
  const tabs = $$(".vistas button"), lados = $$(".app__lado span"), vistas = $$(".vista");
  const mostrar = (v) => {
    tabs.forEach((b) => b.setAttribute("aria-selected", b.dataset.vista === v));
    lados.forEach((s) => s.classList.toggle("activo", s.dataset.vista === v));
    vistas.forEach((s) => s.classList.toggle("activo", s.dataset.vista === v));
  };
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => mostrar(b.dataset.vista));
    b.addEventListener("keydown", (e) => { if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return; e.preventDefault(); const n = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); mostrar(n.dataset.vista); });
  });
  lados.forEach((s) => s.addEventListener("click", () => mostrar(s.dataset.vista)));
  lados.forEach((s) => (s.style.cursor = "pointer"));
}

/* ── Menú del celular y progreso de lectura ── */
{
  const boton = $("#nav-menu"), menu = $("#menu-movil");
  const cerrar = () => { nav.classList.remove("abierto"); boton.setAttribute("aria-expanded", false); boton.setAttribute("aria-label", "Abrir el menú"); };
  boton.addEventListener("click", () => { const ab = nav.classList.toggle("abierto"); boton.setAttribute("aria-expanded", ab); boton.setAttribute("aria-label", ab ? "Cerrar el menú" : "Abrir el menú"); });
  $$("a", menu).forEach((a) => a.addEventListener("click", cerrar));
  addEventListener("keydown", (e) => e.key === "Escape" && cerrar());
}
const progreso = $("#progreso");
function pintarProgreso() { progreso.style.setProperty("--p", clamp(scrollY / (document.documentElement.scrollHeight - innerHeight))); }

/* El visor se acerca apenas mientras entra en pantalla */
const visorImg = $(".visor__img");
function pintarVisor() { const r = visorImg.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; visorImg.style.setProperty("--zoom", lerp(1.12, 1, eo(clamp(1 - r.top / innerHeight)))); }

/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarProgreso(); pintarFrase(); pintarVisor(); }); }
addEventListener("scroll", alScroll, { passive: true }); addEventListener("resize", alScroll);
alScroll();
