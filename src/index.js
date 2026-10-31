// lumina.optimizo.ai · todo se sirve tal cual desde los assets estáticos, salvo los videos.
// Los assets no responden por tramos (Range) y Safari del iPhone no reproduce un video sin eso:
// los videos pasan por el Worker, que corta el tramo pedido y responde 206 (mismo arreglo que web-optimizo).
async function video(request, env) {
  const r = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  if (!r.ok) return r;
  const datos = await r.arrayBuffer(), total = datos.byteLength, h = new Headers(r.headers);
  h.set("Accept-Ranges", "bytes"); h.delete("Content-Encoding");
  const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get("Range") || "");
  if (!m) { h.set("Content-Length", total); return new Response(request.method === "HEAD" ? null : datos, { status: 200, headers: h }); }
  let ini = m[1] === "" ? Math.max(0, total - Number(m[2])) : Number(m[1]), fin = m[1] !== "" && m[2] !== "" ? Math.min(Number(m[2]), total - 1) : total - 1;
  if (ini >= total || ini > fin) { h.set("Content-Range", `bytes */${total}`); return new Response(null, { status: 416, headers: h }); }
  h.set("Content-Range", `bytes ${ini}-${fin}/${total}`); h.set("Content-Length", fin - ini + 1);
  return new Response(request.method === "HEAD" ? null : datos.slice(ini, fin + 1), { status: 206, headers: h });
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.endsWith(".mp4")) return video(request, env);
    return env.ASSETS.fetch(request);
  },
};
