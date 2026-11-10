/* Preguntas con IA (10-nov-2026): la sección «Preguntas» se vuelve un chat con Claude que responde con lo que dice este sitio.
   Va DENTRO de la página (no flota). Misma copia en getmedula.ai y lumina.optimizo.ai. Se monta sobre el contenedor
   [data-asistente] (la lista de <details> de siempre): sus preguntas pasan a ser las sugeridas y sus respuestas quedan de
   respaldo si la IA no contesta. Sin JS, la lista de siempre sigue visible. Se configura en la etiqueta <script>:
     data-sitio="medula|lumina"  data-nombre="Médula"  data-color="#34529D"  data-discovery="https://…" (link de «Agenda tu Discovery»)
   Respuestas de https://arm.neisstech.com/api/faq?sitio=… (sin clave en el navegador). */
(() => {
  const cfg = document.currentScript?.dataset || {};
  const SITIO = cfg.sitio, NOMBRE = cfg.nombre || "el equipo", COLOR = cfg.color || "#0B131B";
  const DISCOVERY = cfg.discovery || "#discovery";
  const API = `https://arm.neisstech.com/api/faq?sitio=${encodeURIComponent(SITIO)}`;
  const caja = document.querySelector("[data-asistente]");
  if (!SITIO || !caja) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const base = [...caja.querySelectorAll("details")].map((d) => {
    const s = d.querySelector("summary").cloneNode(true); s.querySelector("span")?.remove();
    return { q: s.textContent.trim(), a: d.querySelector("p")?.textContent.trim() || "" };
  });
  const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "").trim();

  const css = `
  .pc { --c: ${COLOR}; display: grid; grid-template-rows: 1fr auto auto; border-radius: 28px; background: #fff; color: var(--tinta);
    box-shadow: 0 0 0 1px var(--linea), 0 24px 60px -30px rgba(6,16,46,.22); overflow: hidden; }
  .pc__msjs { min-height: 420px; max-height: 560px; overflow-y: auto; overscroll-behavior: contain; padding: 30px 30px 18px; display: flex; flex-direction: column; gap: 12px; }
  .pc__m { max-width: 86%; padding: 13px 17px; border-radius: 20px; font-size: 16px; line-height: 1.5; white-space: pre-wrap; animation: pc-in .5s var(--llegada) both; }
  .pc__m--yo { align-self: flex-end; background: var(--c); color: #fff; border-bottom-right-radius: 7px; }
  .pc__m--ia { align-self: flex-start; background: var(--nube); border-bottom-left-radius: 7px; }
  .pc__hola { align-self: flex-start; display: grid; gap: 4px; margin-bottom: 4px; }
  .pc__hola b { display: flex; align-items: center; gap: 10px; font-size: 18px; letter-spacing: -.02em; }
  .pc__hola span { color: var(--texto-2); font-size: 15px; }
  .pc__punto { width: 9px; height: 9px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 16%, transparent); flex: none; }
  .pc__pens { display: inline-flex; gap: 5px; padding: 17px 18px; }
  .pc__pens i { width: 6px; height: 6px; border-radius: 50%; background: var(--texto-3); animation: pc-p 1s infinite ease-in-out; }
  .pc__pens i:nth-child(2) { animation-delay: .15s; } .pc__pens i:nth-child(3) { animation-delay: .3s; }
  .pc__cta { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 18px; border-radius: 999px; background: var(--tinta); color: #fff;
    font-size: 14.5px; font-weight: 600; text-decoration: none; animation: pc-in .5s var(--llegada) both; transition: transform .3s var(--llegada); }
  .pc__cta:hover { transform: translateY(-1px); }
  .pc__sugs { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 4px 30px 14px; mask-image: linear-gradient(90deg, #000 calc(100% - 40px), transparent); }
  .pc__sugs::-webkit-scrollbar { display: none; }
  .pc__sugs:empty { display: none; }
  .pc--vacio .pc__msjs { min-height: 0; padding-bottom: 14px; }
  .pc--vacio .pc__sugs { flex-wrap: wrap; overflow: visible; mask-image: none; padding-bottom: 22px; }
  .pc__sug { flex: none; height: 38px; padding: 0 15px; border: 1px solid var(--linea); border-radius: 999px; background: #fff; color: var(--tinta); font: inherit; font-size: 14px; cursor: pointer; transition: border-color .25s, background .25s; }
  .pc__sug:hover { border-color: var(--c); background: color-mix(in srgb, var(--c) 5%, #fff); }
  .pc__form { display: flex; align-items: flex-end; gap: 10px; margin: 0 14px 14px; padding: 6px 6px 6px 18px; border-radius: 22px; background: var(--nube); transition: box-shadow .25s; }
  .pc__form:focus-within { box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 45%, transparent); }
  .pc__form textarea { flex: 1; min-height: 44px; max-height: 130px; padding: 11px 0; border: 0; resize: none; background: none; color: var(--tinta); font: inherit; font-size: 16px; line-height: 1.4; outline: none; }
  .pc__form textarea::placeholder { color: var(--texto-3); }
  .pc__env { width: 44px; height: 44px; flex: none; border: 0; border-radius: 50%; background: var(--c); color: #fff; cursor: pointer; display: grid; place-items: center; transition: opacity .2s; }
  .pc__env:disabled { opacity: .35; cursor: default; }
  .pc button:focus-visible, .pc a:focus-visible { outline: 2px solid var(--c); outline-offset: 2px; }
  @keyframes pc-in { from { opacity: 0; transform: translateY(6px); } }
  @keyframes pc-p { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
  @media (max-width: 560px) {
    .pc { border-radius: 22px; }
    .pc__msjs { min-height: 340px; max-height: 62svh; padding: 22px 18px 14px; }
    .pc__m { font-size: 15.5px; max-width: 92%; }
    .pc__sugs { padding: 2px 18px 12px; }
    .pc__form { margin: 0 10px 10px; }
  }
  @media (prefers-reduced-motion: reduce) { .pc__m, .pc__cta { animation: none; } .pc__pens i { animation: none; } }`;
  const st = document.createElement("style"); st.textContent = css; document.head.append(st);

  const pc = document.createElement("div");
  pc.className = "pc pc--vacio";
  pc.innerHTML = `
    <div class="pc__msjs" aria-live="polite">
      <div class="pc__hola"><b><i class="pc__punto" aria-hidden="true"></i>Pregúntale a ${NOMBRE}</b><span>Escribe tu duda o parte por una de estas. Responde al tiro.</span></div>
    </div>
    <div class="pc__sugs"></div>
    <form class="pc__form"><textarea rows="1" maxlength="500" placeholder="Escribe tu pregunta…" aria-label="Tu pregunta para ${NOMBRE}"></textarea>
      <button class="pc__env" type="submit" aria-label="Enviar" disabled><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>`;
  caja.querySelectorAll("details").forEach((d) => (d.hidden = true));   // quedan en el HTML (buscadores y respaldo)
  caja.append(pc);

  const $ = (s) => pc.querySelector(s);
  const msjs = $(".pc__msjs"), sugs = $(".pc__sugs"), form = $(".pc__form"), txt = $("textarea"), env = $(".pc__env");
  const hist = []; let ocupado = false;

  const baja = () => msjs.scrollTo({ top: msjs.scrollHeight, behavior: reduce ? "auto" : "smooth" });   // solo dentro del chat, la página no salta
  const burbuja = (quien, t) => { const d = document.createElement("div"); d.className = `pc__m pc__m--${quien}`; d.textContent = t; msjs.append(d); baja(); return d; };
  const cta = () => {
    const a = document.createElement("a"); a.className = "pc__cta"; a.href = DISCOVERY;
    if (/^https?:/.test(DISCOVERY)) { a.target = "_blank"; a.rel = "noopener"; }
    a.innerHTML = 'Agenda tu Discovery <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    msjs.append(a); baja();
  };
  const usadas = new Set();
  function pintarSugs() {
    sugs.replaceChildren(...base.filter((x) => !usadas.has(x.q)).map((x) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pc__sug"; b.textContent = x.q;
      b.addEventListener("click", () => enviar(x.q)); return b;
    }));
  }
  async function enviar(t) {
    t = String(t || "").trim(); if (!t || ocupado) return;
    ocupado = true; env.disabled = true; txt.value = ""; txt.style.height = "";
    const fija = base.find((x) => norm(x.q) === norm(t));
    if (fija) { usadas.add(fija.q); pintarSugs(); }
    pc.classList.remove("pc--vacio");
    burbuja("yo", t);
    const p = document.createElement("div"); p.className = "pc__m pc__m--ia pc__pens"; p.setAttribute("aria-label", "Escribiendo"); p.innerHTML = "<i></i><i></i><i></i>"; msjs.append(p); baja();
    let d = null;
    try {
      const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pregunta: t, pagina: location.pathname, historial: hist.slice(-6) }), signal: AbortSignal.timeout(28000) });
      if (r.ok) d = await r.json();
    } catch { /* sin IA: respaldo abajo */ }
    p.remove();
    const resp = d?.respuesta || fija?.a;
    if (resp) {
      burbuja("ia", resp); hist.push({ quien: "yo", texto: t }, { quien: "ia", texto: resp });
      if (d?.especialista) cta();
    } else { burbuja("ia", "Ahora no te puedo responder. Lo mejor es verlo en un Discovery, con tu caso sobre la mesa."); cta(); }
    ocupado = false; env.disabled = !txt.value.trim();
  }
  pintarSugs();
  form.addEventListener("submit", (e) => { e.preventDefault(); enviar(txt.value); });
  txt.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  txt.addEventListener("input", () => { env.disabled = ocupado || !txt.value.trim(); txt.style.height = "auto"; txt.style.height = Math.min(130, txt.scrollHeight) + "px"; });
})();
