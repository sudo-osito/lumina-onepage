/* Asistente del sitio (9-nov-2026): botón flotante → panel de chat con Claude, que responde solo con lo que dice este sitio.
   Mismo widget en getmedula.ai y lumina.optimizo.ai (copias idénticas). Se configura en la etiqueta <script>:
     data-sitio="medula|lumina"  data-nombre="Médula"  data-color="#34529D"  data-discovery="https://…" (link de «Agenda tu Discovery")
     data-sugerencias="pregunta 1|pregunta 2|pregunta 3"
   Respuestas de https://arm.neisstech.com/api/faq?sitio=… (sin clave en el navegador). Si la IA no responde, ofrece el Discovery. */
(() => {
  const yo = document.currentScript, cfg = yo?.dataset || {};
  const SITIO = cfg.sitio, NOMBRE = cfg.nombre || "el equipo", COLOR = cfg.color || "#0B131B";
  const DISCOVERY = cfg.discovery || "#discovery";
  const SUGS = (cfg.sugerencias || "").split("|").map((x) => x.trim()).filter(Boolean);
  const API = `https://arm.neisstech.com/api/faq?sitio=${encodeURIComponent(SITIO)}`;
  if (!SITIO || document.querySelector(".asis")) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const css = `
  .asis { --c: ${COLOR}; position: fixed; right: max(20px, env(safe-area-inset-right)); bottom: max(20px, env(safe-area-inset-bottom)); z-index: 70; font-family: inherit; color: #0B131B; }
  .asis__btn { display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 20px 0 16px; border: 0; border-radius: 999px; background: #fff; color: #0B131B;
    font: inherit; font-size: 15px; font-weight: 600; letter-spacing: -.01em; cursor: pointer;
    box-shadow: 0 0 0 1px rgba(11,19,27,.07), 0 10px 30px -8px rgba(11,19,27,.22), 0 2px 6px rgba(11,19,27,.06);
    transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s; }
  .asis__btn:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px rgba(11,19,27,.08), 0 16px 36px -10px rgba(11,19,27,.28), 0 2px 6px rgba(11,19,27,.06); }
  .asis__btn:focus-visible, .asis button:focus-visible, .asis a:focus-visible, .asis textarea:focus-visible { outline: 2px solid var(--c); outline-offset: 2px; }
  .asis__punto { width: 10px; height: 10px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 18%, transparent); }
  .asis__panel { position: absolute; right: 0; bottom: 0; width: min(380px, calc(100vw - 32px)); height: min(560px, calc(100svh - 40px)); display: grid; grid-template-rows: auto 1fr auto;
    border-radius: 22px; background: #fff; overflow: hidden;
    box-shadow: 0 0 0 1px rgba(11,19,27,.07), 0 30px 70px -20px rgba(11,19,27,.35), 0 4px 14px rgba(11,19,27,.08);
    transform-origin: 100% 100%; transition: opacity .3s, transform .45s cubic-bezier(.16,1,.3,1); }
  .asis:not(.abierto) .asis__panel { opacity: 0; transform: scale(.92) translateY(8px); pointer-events: none; visibility: hidden; }
  .asis.abierto .asis__btn { opacity: 0; pointer-events: none; }
  .asis__cab { display: flex; align-items: center; gap: 10px; padding: 16px 14px 14px 18px; border-bottom: 1px solid rgba(11,19,27,.07); }
  .asis__cab b { font-size: 15px; letter-spacing: -.01em; }
  .asis__cab span { font-size: 12.5px; color: #5E6A71; }
  .asis__cab div { display: grid; flex: 1; }
  .asis__x { width: 34px; height: 34px; border: 0; border-radius: 50%; background: #F5F5F7; color: #0B131B; font-size: 18px; line-height: 1; cursor: pointer; }
  .asis__msjs { overflow-y: auto; padding: 16px 16px 8px; display: flex; flex-direction: column; gap: 10px; overscroll-behavior: contain; }
  .asis__m { max-width: 88%; padding: 10px 13px; border-radius: 16px; font-size: 14.5px; line-height: 1.45; white-space: pre-wrap; }
  .asis__m--yo { align-self: flex-end; background: var(--c); color: #fff; border-bottom-right-radius: 6px; }
  .asis__m--ia { align-self: flex-start; background: #F5F5F7; border-bottom-left-radius: 6px; }
  .asis__cta { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; margin-top: -2px; padding: 9px 14px; border-radius: 999px; background: #0B131B; color: #fff; font-size: 13.5px; font-weight: 600; text-decoration: none; }
  .asis__sugs { display: flex; flex-wrap: wrap; gap: 8px; }
  .asis__sug { padding: 8px 12px; border: 1px solid rgba(11,19,27,.1); border-radius: 999px; background: #fff; color: #0B131B; font: inherit; font-size: 13px; cursor: pointer; text-align: left; }
  .asis__sug:hover { border-color: var(--c); }
  .asis__pens { display: inline-flex; gap: 4px; padding: 14px 14px; }
  .asis__pens i { width: 6px; height: 6px; border-radius: 50%; background: #A1A9AD; animation: asis-p 1s infinite ease-in-out; }
  .asis__pens i:nth-child(2) { animation-delay: .15s; } .asis__pens i:nth-child(3) { animation-delay: .3s; }
  @keyframes asis-p { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
  .asis__form { display: flex; align-items: flex-end; gap: 8px; padding: 10px 10px 12px 14px; border-top: 1px solid rgba(11,19,27,.07); }
  .asis__form textarea { flex: 1; min-height: 40px; max-height: 120px; padding: 10px 2px; border: 0; resize: none; background: none; color: #0B131B; font: inherit; font-size: 15px; line-height: 1.35; outline: none; }
  .asis__env { width: 40px; height: 40px; flex: none; border: 0; border-radius: 50%; background: var(--c); color: #fff; cursor: pointer; display: grid; place-items: center; }
  .asis__env:disabled { opacity: .4; cursor: default; }
  .asis__nota { padding: 0 16px 10px; font-size: 11px; color: #A1A9AD; }
  @media (max-width: 560px) {
    .asis { right: 12px; bottom: max(12px, env(safe-area-inset-bottom)); }
    .asis__btn { height: 48px; font-size: 14px; }
    .asis__panel { position: fixed; left: 8px; right: 8px; bottom: max(8px, env(safe-area-inset-bottom)); width: auto; height: min(78svh, 620px); }
  }
  @media (prefers-reduced-motion: reduce) { .asis__btn, .asis__panel { transition: none; } .asis__pens i { animation: none; } }`;
  const st = document.createElement("style"); st.textContent = css; document.head.append(st);

  const raiz = document.createElement("div");
  raiz.className = "asis";
  raiz.innerHTML = `
    <button class="asis__btn" type="button" aria-expanded="false" aria-controls="asis-panel"><span class="asis__punto" aria-hidden="true"></span>Pregúntale a ${NOMBRE}</button>
    <section class="asis__panel" id="asis-panel" role="dialog" aria-label="Pregúntale a ${NOMBRE}">
      <header class="asis__cab"><span class="asis__punto" aria-hidden="true"></span><div><b>Pregúntale a ${NOMBRE}</b><span>Responde con lo que está en este sitio</span></div>
        <button class="asis__x" type="button" aria-label="Cerrar">×</button></header>
      <div class="asis__msjs" aria-live="polite"></div>
      <div><form class="asis__form"><textarea rows="1" maxlength="500" placeholder="Escribe tu pregunta…" aria-label="Tu pregunta"></textarea>
        <button class="asis__env" type="submit" aria-label="Enviar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>
        <p class="asis__nota">Respuestas con IA. Para tu caso puntual, agenda un Discovery.</p></div>
    </section>`;
  document.body.append(raiz);
  const $ = (s) => raiz.querySelector(s);
  const btn = $(".asis__btn"), msjs = $(".asis__msjs"), form = $(".asis__form"), txt = $("textarea"), env = $(".asis__env");
  const hist = []; let ocupado = false;

  const baja = () => msjs.scrollTo({ top: msjs.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  const burbuja = (quien, t) => { const d = document.createElement("div"); d.className = `asis__m asis__m--${quien}`; d.textContent = t; msjs.append(d); baja(); return d; };
  const cta = () => { const a = document.createElement("a"); a.className = "asis__cta"; a.href = DISCOVERY; if (/^https?:/.test(DISCOVERY)) { a.target = "_blank"; a.rel = "noopener"; } else a.addEventListener("click", () => abrir(false)); a.textContent = "Agenda tu Discovery →"; msjs.append(a); baja(); };
  function inicio() {
    if (msjs.childElementCount) return;
    burbuja("ia", `Hola. Pregúntame lo que quieras saber de ${NOMBRE}.`);
    if (SUGS.length) {
      const s = document.createElement("div"); s.className = "asis__sugs";
      s.innerHTML = SUGS.map((x) => `<button type="button" class="asis__sug"></button>`).join("");
      [...s.children].forEach((b, i) => { b.textContent = SUGS[i]; b.addEventListener("click", () => { s.remove(); enviar(SUGS[i]); }); });
      msjs.append(s);
    }
  }
  function abrir(on) {
    raiz.classList.toggle("abierto", on); btn.setAttribute("aria-expanded", String(on));
    if (on) { inicio(); setTimeout(() => txt.focus(), reduce ? 0 : 250); } else btn.focus();
  }
  async function enviar(t) {
    t = String(t || "").trim(); if (!t || ocupado) return;
    ocupado = true; env.disabled = true; txt.value = ""; txt.style.height = "";
    burbuja("yo", t);
    const p = document.createElement("div"); p.className = "asis__m asis__m--ia asis__pens"; p.innerHTML = "<i></i><i></i><i></i>"; msjs.append(p); baja();
    let d = null;
    try {
      const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pregunta: t, pagina: location.pathname, historial: hist.slice(-6) }), signal: AbortSignal.timeout(28000) });
      if (r.ok) d = await r.json();
    } catch { /* sin IA */ }
    p.remove();
    if (d?.respuesta) {
      burbuja("ia", d.respuesta); hist.push({ quien: "yo", texto: t }, { quien: "ia", texto: d.respuesta });
      if (d.especialista) cta();
    } else { burbuja("ia", "Ahora no te puedo responder. Lo mejor es verlo en un Discovery, con tu caso sobre la mesa."); cta(); }
    ocupado = false; env.disabled = false;
  }
  btn.addEventListener("click", () => abrir(true));
  $(".asis__x").addEventListener("click", () => abrir(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && raiz.classList.contains("abierto")) abrir(false); });
  form.addEventListener("submit", (e) => { e.preventDefault(); enviar(txt.value); });
  txt.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  txt.addEventListener("input", () => { txt.style.height = "auto"; txt.style.height = Math.min(120, txt.scrollHeight) + "px"; });
})();
