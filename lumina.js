/* Lumina · one-page. Sin dependencias. Partes que vienen de la one-page de Médula y la v6 de Optimizo: títulos que se arman,
   texto que se escribe, scroll suave con la frase que detiene la página. Lo propio: cuatro cámaras en vivo con detecciones reales y el recorrido que se despliega. */

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
  heroe: (t, w, h) => [MOVIL() ? w * (.5 + .3 * Math.sin(t * .23)) : w * (.8 + .13 * Math.sin(t * .21)), h * (.3 + .18 * Math.sin(t * .17 + 1.3))],
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
    g.addColorStop(0, "rgba(243,130,60,.1)"); g.addColorStop(.35, "rgba(243,130,60,.05)"); g.addColorStop(.7, "rgba(243,130,60,.015)"); g.addColorStop(1, "rgba(243,130,60,0)");
    c.fillStyle = g; c.fillRect(lx - R * 2, ly - R * 2, R * 4, R * 4);
    const x0 = Math.max(paso / 2, Math.floor((lx - R) / paso) * paso + paso / 2), y0 = Math.max(paso / 2, Math.floor((ly - R) / paso) * paso + paso / 2);
    for (let y = y0; y < Math.min(h, ly + R); y += paso) for (let x = x0; x < Math.min(w, lx + R); x += paso) {
      const d = Math.hypot(x - lx, y - ly) / R; if (d >= 1) continue;
      const k = Math.pow(1 - d, 1.6);
      c.fillStyle = k > .55 ? `rgba(207,86,11,${.2 + .45 * k})` : `rgba(236,109,39,${.06 + .55 * k})`;
      c.beginPath(); c.arc(x, y, 1 + 1.25 * k, 0, 7); c.fill();
    }
  }, 30);
}
$$("canvas[data-luz]").forEach((cv) => luz(cv, LUCES[cv.dataset.luz]));

/* ── Texto que se escribe y se borra, como un teclado ── */
const PRISA = { v: 1 }; // si el usuario insiste con el scroll mientras algo se escribe, se escribe más rápido (nunca de golpe)
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
      for (let k = 1; k <= w.length && sigue(); k++) { el.textContent = w.slice(0, k).join(""); await esperar((tipear + Math.random() * (ms ? ms * .6 : 45)) / PRISA.v); }
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

/* ── Dibujo de detecciones (cajas con su píldora) ── */
const LETRA = (px) => `600 ${px}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
// foco: qué parte del video queda a la vista cuando la pantalla es más angosta que 16:9 (0 izquierda · 1 derecha)
function mapa(w, h, foco = .5) { const s = Math.max(w / 16, h / 9), vw = 16 * s, vh = 9 * s, ox = (w - vw) * foco, oy = (h - vh) / 2; return { X: (n) => ox + n * vw, Y: (n) => oy + n * vh }; }
function cajas(t) {
  const D = (window.DET || {}).despacho || [], f = D.length ? D[Math.min(D.length - 1, Math.round(t * 25))] : null, out = [];
  if (!f) return out;
  if (f.m) { const [mx, my, mw, mh] = f.m, x0 = Math.max(mx, .43), x1 = Math.min(mx + mw, .84 - .08 * t / 5.96); out.push({ x: x0, y: Math.max(my, .02) + 40 / 630, w: x1 - x0, h: mh - 70 / 630, col: "#EC6D27", txt: "Montacargas", m: 1 }); }
  f.p.slice(0, 2).forEach((p) => out.push({ x: p[0], y: p[1] + 30 / 630, w: p[2], h: p[3], col: "#F5A06A", txt: "Persona" }));
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
    c.globalAlpha = kk; c.strokeStyle = "#EC6D27"; c.lineWidth = 2.5 * e; c.setLineDash([6 * e, 6 * e]); c.lineDashOffset = -t * 30;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(lerp(ax, bx, kk), lerp(ay, by, kk)); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    pildora(c, (ax + bx) / 2 - 44 * e, (ay + by) / 2 + 6 * e, "Proximidad", "#EC6D27", kk, e);
  }
}
/* ── Detecciones reales del modelo (personas con Apple Vision, vehículos seguidos cuadro a cuadro) ── */
const DET = window.DET || {};
const cuadro = (cam, t) => { const D = DET[cam] || []; return D[Math.min(D.length - 1, Math.max(0, Math.round(t * 25)))] || { p: [] }; };
const AMBAR = "#F5A06A", HONDO = "#EC6D27", ROJO = "#E5484D", VERDE = "#4ADE80";
function caja(c, M, b, col, txt, e, k = 1) {
  const x = M.X(b[0]), y = M.Y(b[1]), w = M.X(b[0] + b[2]) - x, h = M.Y(b[1] + b[3]) - y;
  c.globalAlpha = k; c.strokeStyle = col; c.lineWidth = 2 * e; c.fillStyle = col + "18"; rr(c, x, y, w, h, 12 * e); c.fill(); c.stroke(); c.globalAlpha = 1;
  if (txt) pildora(c, x, y, txt, col, k, e);
  return { x, y, w, h };
}
// cada cámara sabe qué mirar y qué contar
const CAMARAS = {
  epp: {
    foco: .42,
    hud: "CAM 01 · LÍNEA DE ARMADO",
    dibujar(c, M, t, e) {
      const f = cuadro("epp", t), sin = f.p.filter((p) => !p[4]).length;
      // verde: chaleco de alta visibilidad confirmado por color en el torso; si no se alcanza a confirmar, queda como persona (nunca acusamos sin certeza)
      f.p.forEach((p) => caja(c, M, p.slice(0, 4), p[4] ? VERDE : AMBAR, p[4] ? "Chaleco" : "Persona", e * .9));
      return { conteo: `${f.p.length} PERSONAS · ${f.p.length - sin} CON CHALECO`, evento: f.p.length - sin ? "EPP correcto · chalecos detectados" : "" };
    },
  },
  despacho: {
    foco: .78,
    hud: "CAM 02 · ZONA DESPACHO",
    dibujar(c, M, t, e) {
      const lista = cajas(t), m = lista.find((b) => b.m), p = lista.find((b) => !b.m);
      dibujarRiesgo(c, M, lista, 1, performance.now() / 1000, e); dibujarCajas(c, M, lista, 1, e);
      const np = lista.filter((b) => !b.m).length;
      return { conteo: `${np} ${np === 1 ? "PERSONA" : "PERSONAS"} · ${m ? 1 : 0} MONTACARGAS`, evento: m && p ? "Riesgo persona–vehículo" : "" };
    },
  },
  zona: {
    foco: .4,
    hud: "CAM 03 · ZONA DE PREPARACIÓN",
    // la zona se define en cada instalación; acá, el piso frente a los estantes
    Z: [[.47, .32], [.78, .22], [.95, .62], [.54, .76]],
    dentro([x, y]) { const P = this.Z; let d = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d; } return d; },
    entrada() { if (this._e === undefined) { const D = DET.zona || [], f = D.find((q) => q.p[0] && this.dentro([q.p[0][0] + q.p[0][2] / 2, q.p[0][1] + q.p[0][3]])); this._e = f ? f.t : Infinity; } return this._e; },
    dibujar(c, M, t, e) {
      const f = cuadro("zona", t), p = f.p[0], ent = this.entrada(), dentro = !!p && t >= ent;
      c.save(); c.beginPath(); this.Z.forEach(([x, y], i) => (i ? c.lineTo(M.X(x), M.Y(y)) : c.moveTo(M.X(x), M.Y(y)))); c.closePath();
      c.fillStyle = dentro ? `rgba(229,72,77,${.12 + .06 * Math.sin(performance.now() / 160)})` : "rgba(229,72,77,.06)"; c.fill();
      c.setLineDash([9 * e, 7 * e]); c.strokeStyle = ROJO; c.lineWidth = 2 * e; c.stroke(); c.restore();
      pildora(c, M.X(this.Z[1][0]) - 120 * e, M.Y(this.Z[1][1]) + 2 * e, "Zona restringida", ROJO, 1, e);
      const seg = Math.max(0, Math.floor(t - ent));
      if (p) caja(c, M, p, dentro ? ROJO : AMBAR, dentro ? `Permanencia 00:${String(seg).padStart(2, "0")}` : "Persona", e);
      return { conteo: dentro ? "1 PERSONA EN ZONA" : `${f.p.length} ${f.p.length === 1 ? "PERSONA" : "PERSONAS"}`, evento: dentro ? "Ingreso a zona restringida" : "" };
    },
  },
  trafico: {
    foco: .62,
    hud: "CAM 04 · PASILLO CENTRAL",
    dibujar(c, M, t, e) {
      const D = DET.trafico || [], k = Math.min(D.length - 1, Math.round(t * 25)), f = D[k] || { p: [] };
      // la ruta: dónde estuvo el montacargas desde que entró en cuadro
      c.save(); c.strokeStyle = "rgba(236,109,39,.85)"; c.lineWidth = 3 * e; c.setLineDash([2 * e, 9 * e]); c.lineCap = "round"; c.beginPath();
      let primero = true; for (let i = 0; i <= k; i += 2) { const v = D[i].v; if (!v) continue; const x = M.X(v[0] + v[2] / 2), y = M.Y(v[1] + v[3] * .85); primero ? c.moveTo(x, y) : c.lineTo(x, y); primero = false; }
      c.stroke(); c.restore();
      if (f.v) caja(c, M, f.v, HONDO, "Montacargas", e);
      f.p.forEach((p) => caja(c, M, p, AMBAR, f.v ? null : "Persona", e, .8));
      return { conteo: `${f.v ? 1 : 0} MONTACARGAS · ${f.p.length ? "1 OPERADOR" : "SIN OPERADOR"}`, evento: f.v && k > 25 ? "Montacargas en movimiento · pasillo central" : "" };
    },
  },
};

/* ── Banner: las cuatro cámaras en ciclo, de fondo, con lo que Lumina detecta en cada una ── */
{
  const vivo = $("#camaras"), capa = $(".vivo__capa", vivo), videos = $$("video", vivo);
  const DUR = 6000;
  let i = 0, t0 = performance.now(), visible = false, foco = .5;
  const ir = (k) => {
    i = k; t0 = performance.now(); foco = CAMARAS[videos[k].dataset.cam].foco;
    videos.forEach((v, j) => { v.classList.toggle("on", j === k); if (j === k) { v.currentTime = 0; if (visible) v.play().catch(() => {}); } else v.pause(); });
  };
  videos.forEach((v) => (v.style.objectPosition = `${CAMARAS[v.dataset.cam].foco * 100}% 50%`));
  ir(0);
  alVer(vivo, () => { visible = true; videos[i].play().catch(() => {}); }, () => { visible = false; videos.forEach((v) => v.pause()); }, 0);
  bucleVisible(vivo, () => {
    const v = videos[i], { c, w, h } = lienzo(capa);
    const cam = CAMARAS[v.dataset.cam];
    // en pantallas angostas el encuadre sigue a lo detectado: paneo suave hacia el centro de las cajas
    const lista = v.dataset.cam === "despacho" ? cajas(v.currentTime).map((b) => [b.x, b.y, b.w, b.h]) : (() => { const f = cuadro(v.dataset.cam, v.currentTime); return [...f.p, ...(f.v ? [f.v] : [])]; })();
    if (lista.length) { const cx = lista.reduce((a, b) => a + b[0] + b[2] / 2, 0) / lista.length, vis = Math.min(1, (w / h) / (16 / 9)); const meta = vis >= 1 ? .5 : clamp((cx - vis / 2) / (1 - vis)); foco += (meta - foco) * .04; }
    v.style.objectPosition = `${foco * 100}% 50%`;
    if (v.readyState >= 2) cam.dibujar(c, mapa(w, h, foco), v.currentTime, clamp(w / 1300, .8, 1.3));
    const k = clamp((performance.now() - t0) / DUR);
    if (k >= 1 && !QUIETO) ir((i + 1) % videos.length);
  });
}

/* ── El recorrido: la maqueta 3D se carga recién cuando la sección se acerca (Three.js pesa) ── */
window.LUMINA = { cajas, dibujarCajas, dibujarRiesgo, mapa, hora };
{
  const m = $("#maqueta");
  const io3d = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io3d.disconnect(); import("./maqueta.js?v=15").catch((err) => { console.error(err); $("#maqueta-cargando").textContent = "No se pudo cargar la maqueta."; }); }, { rootMargin: "120% 0px" });
  io3d.observe(m);
}

/* ── Metodología: tarjetas que entran una a una y se apilan; cada una con su escena ── */
let pintarPila = () => {};
{
  const cartas = $$(".carta");
  pintarPila = () => {
    const tops = cartas.map((c) => c.getBoundingClientRect().top), alto = cartas[0].offsetHeight;
    cartas.forEach((c, i) => {
      if (tops[i] > innerHeight * 1.5 || tops[i] < -alto * 2) return;
      const k = i < cartas.length - 1 ? clamp(1 - (tops[i + 1] - tops[i]) / alto) : 0, kk = Math.round(k * 100) / 100;
      if (c._k === kk) return; c._k = kk;
      c.style.setProperty("--esc", 1 - .06 * kk); c.style.setProperty("--luz", 1 - .6 * kk);
    });
  };
  // las escenas usan los cuadros reales de las cámaras (el póster es el segundo 1) y sus detecciones reales de ese cuadro
  const foto = (n) => Object.assign(new Image(), { src: `recursos/video/${n}.jpg?v=4` });
  const FOTOS = { zona: foto("zona"), epp: foto("epp"), despacho: foto("despacho"), trafico: foto("trafico") };
  const cubrir = (c, img, x, y, w, h) => { if (!img.naturalWidth) return; const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s; c.save(); c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 14) : c.rect(x, y, w, h); c.clip(); c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); c.restore(); return { X: (n) => x + (w - iw) / 2 + n * iw, Y: (n) => y + (h - ih) / 2 + n * ih }; };
  const LET = (px, peso = 600) => `${peso} ${px}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;
  const pastilla = (c, x, y, txt, col, e = 1) => { c.font = LET(12.5 * e); const w = c.measureText(txt).width + 24 * e, h = 24 * e; c.fillStyle = "rgba(15,11,6,.84)"; rr(c, x, y - h, w, h, h / 2); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x + 11 * e, y - h / 2, 3.5 * e, 0, 7); c.fill(); c.fillStyle = "#fff"; c.textBaseline = "middle"; c.fillText(txt, x + 19 * e, y - h / 2 + .5); };
  const trazo = (c, M, P, k, col, e) => { // dibuja el contorno de una zona de a poco, como si alguien la estuviera marcando
    const pts = P.map(([x, y]) => [M.X(x), M.Y(y)]); let total = 0; pts.forEach((p, i) => (total += Math.hypot(...p.map((v, j) => v - pts[(i + 1) % pts.length][j]))));
    c.save(); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
    c.fillStyle = col + Math.round(26 * k).toString(16).padStart(2, "0"); c.fill();
    c.setLineDash([total * k, total]); c.strokeStyle = col; c.lineWidth = 2.4 * e; c.stroke(); c.restore();
  };
  // cada etapa: su video (lo que dice el texto, pasando) y encima un panel de Lumina que se arma solo
  const tarjeta = (c, x, y, w, h, e) => { c.save(); c.shadowColor = "rgba(11,19,27,.28)"; c.shadowBlur = 40 * e; c.shadowOffsetY = 14 * e; c.fillStyle = "rgba(255,255,255,.96)"; rr(c, x, y, w, h, 18 * e); c.fill(); c.restore(); };
  const texto = (c, t, x, y, px, col = "#0B131B", peso = 600) => { c.font = LET(px, peso); c.fillStyle = col; c.textBaseline = "middle"; c.fillText(t, x, y); };
  const check = (c, x, y, k, e) => { c.fillStyle = k >= 1 ? "#1F9D5A" : "#E3E5E8"; c.beginPath(); c.arc(x, y, 9 * e, 0, 7); c.fill(); if (k >= 1) { c.strokeStyle = "#fff"; c.lineWidth = 2 * e; c.beginPath(); c.moveTo(x - 4 * e, y); c.lineTo(x - 1 * e, y + 3 * e); c.lineTo(x + 4.5 * e, y - 3.5 * e); c.stroke(); } else if (k > 0) { c.strokeStyle = "#EC6D27"; c.lineWidth = 2 * e; c.beginPath(); c.arc(x, y, 9 * e, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.stroke(); } };
  function lista(c, x, y, w, e, titulo, sub, filas, q, paso = .9) {
    const alto = 74 * e + filas.length * 44 * e; tarjeta(c, x, y, w, alto, e);
    texto(c, titulo, x + 20 * e, y + 30 * e, 16 * e); texto(c, sub, x + 20 * e, y + 52 * e, 12.5 * e, "#5E6A71", 500);
    filas.forEach((f, i) => { const k = clamp((q - .6 - i * paso) / (paso * .8)), fy = y + 86 * e + i * 44 * e; c.globalAlpha = .35 + .65 * clamp(k * 3); check(c, x + 30 * e, fy, k, e); texto(c, f, x + 50 * e, fy, 14 * e, "#0B131B", 500); c.globalAlpha = 1; });
  }
  const ESCENAS = {
    // 01 · Comprender: recorremos la operación y marcamos lo que hay que observar
    comprender(c, w, h, t, v) {
      const e = clamp(w / 820, .7, 1.1), q = t % 8;
      lista(c, w - Math.min(320 * e, w * .62) - 22 * e, h - (74 + 3 * 44 + 22) * e, Math.min(320 * e, w * .62), e, "Levantamiento en terreno", "Puntos críticos de la operación", ["Cruce peatonal en el pasillo", "Acceso a la sala eléctrica", "Andén de carga y descarga"], q);
    },
    // 02 · Entrenar: el modelo aprende de las escenas de cada cámara
    entrenar(c, w, h, t) {
      const e = clamp(w / 820, .7, 1.1), q = t % 9, pw = Math.min(w * .58, 430 * e), ph = pw * .72, px = w - pw - 22 * e, py = h - ph - 22 * e;
      tarjeta(c, px, py, pw, ph, e); texto(c, "Entrenamiento del modelo", px + 18 * e, py + 26 * e, 15 * e);
      const g = 8 * e, cw = (pw - 36 * e - g) / 2, ch = (ph - 62 * e - g) / 2;
      const fuentes = [["epp", () => (DET.epp[25] || { p: [] }).p.filter((p) => p[4]).map((p) => [p, "#4ADE80"])], ["despacho", () => cajas(1).map((b) => [[b.x, b.y, b.w, b.h], b.m ? "#EC6D27" : "#F5A06A"])], ["zona", () => (DET.zona[25] || { p: [] }).p.map((p) => [p, "#F5A06A"])], ["trafico", () => { const f = DET.trafico[25] || {}; return f.v ? [[f.v, "#EC6D27"]] : []; }]];
      fuentes.forEach(([n, cajasDe], i) => {
        const x = px + 18 * e + (i % 2) * (cw + g), y = py + 46 * e + Math.floor(i / 2) * (ch + g), M = cubrir(c, FOTOS[n], x, y, cw, ch); if (!M) return;
        const k = clamp((q - .4 - i * 1.5) / 1.1);
        if (k > 0 && k < 1) { const ly = y + ch * eo(k); c.fillStyle = "rgba(236,109,39,.9)"; c.fillRect(x, ly - 1, cw, 2); c.fillStyle = "rgba(236,109,39,.14)"; c.fillRect(x, y, cw, ly - y); }
        if (k >= 1) { cajasDe().forEach(([b, col]) => { const bx = M.X(b[0]), by = M.Y(b[1]); c.strokeStyle = col; c.lineWidth = 1.6 * e; rr(c, bx, by, M.X(b[0] + b[2]) - bx, M.Y(b[1] + b[3]) - by, 5 * e); c.stroke(); }); check(c, x + cw - 14 * e, y + 14 * e, 1, e * .8); }
      });
    },
    // 03 · Integrar: la cámara recién instalada queda conectada a la IA, la baliza y el aviso
    integrar(c, w, h, t) {
      const e = clamp(w / 820, .7, 1.1), q = t % 9;
      lista(c, w - Math.min(320 * e, w * .62) - 22 * e, h - (74 + 4 * 44 + 22) * e, Math.min(320 * e, w * .62), e, "CAM 05 · Acceso norte", "Nueva cámara en la red", ["Video en vivo recibido", "Detección de personas activa", "Baliza del pasillo enlazada", "Aviso a jefatura configurado"], q, .8);
    },
    // 04 · Acompañar: el equipo revisa el reporte de la semana
    acompanar(c, w, h, t) {
      const e = clamp(w / 820, .7, 1.1), q = t % 8, pw = Math.min(w * .5, 340 * e), ph = 210 * e, px = 22 * e, py = h - ph - 22 * e;
      tarjeta(c, px, py, pw, ph, e); texto(c, "Reporte semanal", px + 20 * e, py + 28 * e, 16 * e); texto(c, "Eventos por día", px + 20 * e, py + 50 * e, 12.5 * e, "#5E6A71", 500);
      const B = [.62, .78, .55, .9, .48, .36, .3], bw = (pw - 40 * e) / B.length, base = py + ph - 34 * e, alto = ph - 104 * e;
      B.forEach((b, i) => { const k = eo(clamp((q - .3 - i * .12) / .8)), bh = alto * b * k; c.fillStyle = i >= 4 ? "#EC6D27" : "#E3E5E8"; rr(c, px + 20 * e + i * bw + 3, base - bh, bw - 6, bh, 5 * e); c.fill(); });
      ["L", "M", "M", "J", "V", "S", "D"].forEach((d, i) => texto(c, d, px + 20 * e + i * bw + bw / 2 - 4 * e, base + 16 * e, 11.5 * e, "#5E6A71", 500));
      const kk = eo(clamp((q - 2) / .7));
      if (kk > 0) { c.globalAlpha = kk; const ox = Math.min(px + pw + 14 * e, w - 250 * e - 22 * e), oy = py + ph - 64 * e; c.fillStyle = "#0B131B"; rr(c, ox, oy, 250 * e, 64 * e, 14 * e); c.fill(); texto(c, "Observación", ox + 16 * e, oy + 22 * e, 12.5 * e, "#F5A06A"); texto(c, "Eventos a la baja desde el viernes", ox + 16 * e, oy + 43 * e, 13 * e, "#fff", 500); c.globalAlpha = 1; }
    },
  };
  // fondo de cada tarjeta: su video, a todo el panel
  $$("canvas[data-escena]").forEach((cv) => {
    const tipo = cv.dataset.escena, v = Object.assign(document.createElement("video"), { muted: true, loop: true, playsInline: true, preload: "none", src: `recursos/video/metodo/${tipo}.mp4?v=2`, poster: `recursos/video/metodo/${tipo}.jpg` });
    let t0 = performance.now();
    alVer(cv, () => { t0 = performance.now(); v.preload = "auto"; v.play().catch(() => {}); }, () => v.pause(), 0);
    bucleVisible(cv, () => {
      const { c, w, h } = lienzo(cv);
      if (v.readyState >= 2) { const s = Math.max(w / v.videoWidth, h / v.videoHeight); c.drawImage(v, (w - v.videoWidth * s) / 2, (h - v.videoHeight * s) / 2, v.videoWidth * s, v.videoHeight * s); }
      const g = c.createLinearGradient(0, h * .45, 0, h); g.addColorStop(0, "rgba(7,9,11,0)"); g.addColorStop(1, "rgba(7,9,11,.35)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      ESCENAS[tipo](c, w, h, QUIETO ? 99 : (performance.now() - t0) / 1000);
    }, 30);
  });
}

/* ── Navegación ── */
const nav = $("#nav");
function pintarNav() { nav.classList.toggle("bajo", scrollY > 8); }

/* ── Scroll suave (solo con mouse o trackpad; en el celular queda el nativo) y bloqueo mientras la frase se escribe ── */
const suave = { y: scrollY, meta: scrollY, activo: false, bloqueado: false, viaje: false };
const tramo = $("#recorrido");
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
    if (suave.bloqueado) { e.preventDefault(); if (performance.now() - suave.desde > 700 && Math.abs(e.deltaY) > 4) PRISA.v = 3; return; }
    if (!fino || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); suave.viaje = false;
    if (!suave.activo) suave.y = suave.meta = scrollY;
    let d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1);
    // dentro del recorrido el scroll va más lento y con tope: nadie pasa la maqueta de un solo envión
    const rr = tramo.getBoundingClientRect();
    if (rr.top < innerHeight * .5 && rr.bottom > innerHeight * .5) d = clamp(d * .5, -70, 70);
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
  const sec = $("#frase"), ls = $$(".frase__l", sec), ms = ls.map((l, i) => maquina($(".tipeo", l), { una: true, ms: i ? 16 : 8 }));
  let estado = 0; // 0 esperando · 1 escribiendo · 2 listo
  async function escribir() {
    estado = 1; suave.bloqueado = true; suave.desde = performance.now(); PRISA.v = 1;
    const r = sec.getBoundingClientRect(); irA(Math.round(scrollY + r.top + r.height / 2 - innerHeight / 2));
    const suelta = setTimeout(() => (suave.bloqueado = false), 2000);
    for (const [i, l] of ls.entries()) { l.classList.add("on"); await ms[i].iniciar(); await esperar(i ? 0 : 120); if (i < ls.length - 1) l.classList.remove("on"); }
    clearTimeout(suelta); suave.bloqueado = false; estado = 2; PRISA.v = 1;
  }
  pintarFrase = () => {
    if (estado || suave.viaje) return;
    const r = sec.getBoundingClientRect(), centro = r.top + r.height / 2;
    if (QUIETO) { if (r.top < innerHeight) { estado = 2; ms.forEach((m) => m.iniciar()); } return; }
    if (centro <= innerHeight * .55 && r.bottom > innerHeight * .3) escribir();
  };
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


/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarProgreso(); pintarFrase(); pintarPila(); }); }
addEventListener("scroll", alScroll, { passive: true }); addEventListener("resize", alScroll);
alScroll();
