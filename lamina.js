/* Modo lámina (?lamina): la presentación de la feria (FILCE 2026) muestra secciones de esta misma página dentro de un iframe.
   La presentación manda { lamina: "<id de sección>", u: 0…1, salto } y la página viaja ahí; las animaciones de scroll corren igual que en la web. */
(() => {
  if (!/[?&]lamina\b/.test(location.search)) return;
  document.documentElement.classList.add("lamina");
  history.scrollRestoration = "manual";
  // textos propios de la presentación (la web no cambia)
  addEventListener("DOMContentLoaded", () => { const b = document.querySelector("#hoy .bajada"); if (b) b.textContent = "Lo que pasa en tu operación queda grabado y se revisa cuando ya es tarde."; });
  let meta = 0, y = 0, anim = false;
  const paso = () => { y += (meta - y) * .075; if (Math.abs(meta - y) < .6) { y = meta; anim = false; } scrollTo(0, y); if (anim) requestAnimationFrame(paso); };
  const destino = (id, u) => {
    const el = document.getElementById(id); if (!el) return 0;
    const top = el.getBoundingClientRect().top + scrollY, h = el.offsetHeight, vh = innerHeight;
    return u == null ? top + (h - vh) / 2 : top + u * Math.max(0, h - vh);   // sin u: la sección centrada; con u: el punto del tramo fijo
  };
  addEventListener("message", (e) => {
    const d = e.data; if (!d || d.lamina == null) return;
    meta = destino(d.lamina, d.u);
    // privacidad: sus filas se encienden una a una al llegar (en la web, #vs lo hace el scroll)
    // privacidad y beneficios: sus filas se encienden una a una al llegar (en la web lo hace el scroll al pasar por el 62 % de la pantalla)
    for (const id of ["privacidad", "comparativa"]) {
      const filas = document.querySelectorAll(`#${id} .vs__fila`), llena = document.querySelector(`#${id} .vs__llena`);
      filas.forEach((f, i) => { clearTimeout(f._t); if (d.lamina === id) f._t = setTimeout(() => f.classList.add("on"), 900 + i * 650); });
      clearTimeout(llena._t); if (d.lamina === id) llena._t = setTimeout(() => { llena.style.setProperty("--p", 1); const ch = document.querySelector(`#${id} .vs__chispa`); if (ch) ch.style.setProperty("--vis", 0); }, 900);
    }
    if (d.salto) { anim = false; y = meta; scrollTo(0, y); return; }
    y = scrollY; if (!anim) { anim = true; requestAnimationFrame(paso); }
  });
  addEventListener("load", () => parent.postMessage({ luminaLista: true }, "*"));
})();
