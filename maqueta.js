/* Lumina · «La planta que se enciende» (v2). Maqueta isométrica en Three.js, toda procedural, guiada por el scroll.
   Una sola historia: una planta en penumbra; tres cámaras la encienden por zonas; la IA, instalada en la misma planta,
   ve lo que el operador no ve: una grúa sale de un punto ciego mientras cruza un peatón. Lumina proyecta la advertencia
   en el piso, prende la baliza, la grúa frena, el momento queda como evidencia y el aviso llega al supervisor que ya
   está caminando en la planta (no a alguien mirando pantallas). */

import * as THREE from "./recursos/vendor/three.module.min.js";

const L = window.LUMINA;
const cont = document.getElementById("maqueta"), lienzo = cont.querySelector(".maqueta__lienzo"), capa = document.getElementById("etiquetas");
const chips = [...document.querySelectorAll(".rec__seg")];
const recN = document.getElementById("rec-n"), recT = document.getElementById("rec-t"), recD = document.getElementById("rec-d"), recActual = recN.parentElement;
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const suave = (x) => x * x * (3 - 2 * x);
const eo = (x) => 1 - Math.pow(1 - x, 3);
const tramo = (t, a, b) => clamp((t - a) / (b - a));
const LETRA = (px, peso = 600) => `${peso} ${px}px -apple-system, "SF Pro Text", Inter, system-ui, sans-serif`;

/* ── Escenario ── */
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: "high-performance" });
render.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
render.shadowMap.enabled = true; render.shadowMap.type = THREE.PCFSoftShadowMap;
render.toneMapping = THREE.ACESFilmicToneMapping;
const escena = new THREE.Scene();
const camara = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 300);

const NARANJO = 0xEC6D27;
const C = { blanco: 0xF5F5F3, yeso: 0xE7E8E5, gris: 0xC3C9CC, piedra: 0xD9DDDF, cable: 0xCDD3D6, tinta: 0x2A3036, kraft: 0xE8DECD, kraft2: 0xDCCDB4 };
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .9, ...extra });
const mat = {
  blanco: std(C.blanco), yeso: std(C.yeso), gris: std(C.gris, { roughness: .75 }), piedra: std(C.piedra), tinta: std(C.tinta, { roughness: .5 }),
  kraft: std(C.kraft), kraft2: std(C.kraft2), cable: std(C.cable, { roughness: .6 }), marca: std(0xD3D7DA, { roughness: 1 }), film: std(0xF2F3F1, { roughness: .35, transparent: true, opacity: .92 }),
  edge: std(0xFAFAF8, { roughness: .5 }), chip: std(0x3A2A1E, { emissive: NARANJO, emissiveIntensity: 0, roughness: .4 }),
  baliza: std(0xF4CDB4, { emissive: NARANJO, emissiveIntensity: 0, roughness: .35 }), luzGrua: std(0xF4CDB4, { emissive: NARANJO, emissiveIntensity: 0, roughness: .35 }),
  telefono: std(C.tinta, { emissive: NARANJO, emissiveIntensity: 0, roughness: .4 }), lente: std(0x1E2328, { roughness: .2, metalness: .3 }),
};
const linea = new THREE.LineBasicMaterial({ color: 0x0B131B, transparent: true, opacity: .13 });
function malla(geo, m, x, y, z, padre = escena, bordes = true) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true;
  if (bordes) o.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), linea));
  padre.add(o); return o;
}
const caja = (w, h, d, x, y, z, m = mat.blanco, p, b) => malla(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, p, b);
const cil = (r, h, x, y, z, m = mat.blanco, p, b = true, seg = 24) => malla(new THREE.CylinderGeometry(r, r, h, seg), m, x, y + h / 2, z, p, b);
const capsula = (r, l, x, y, z, m, p) => malla(new THREE.CapsuleGeometry(r, l, 4, 12), m, x, y, z, p, false);
function losa(w, d, h, x, z, m = mat.blanco, r = .45, y = 0) {
  const s = new THREE.Shape(), x0 = -w / 2, y0 = -d / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); s.lineTo(x0 + w, y0 + d - r); s.quadraticCurveTo(x0 + w, y0 + d, x0 + w - r, y0 + d);
  s.lineTo(x0 + r, y0 + d); s.quadraticCurveTo(x0, y0 + d, x0, y0 + d - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); return malla(g, m, x, y, z);
}
const PISO = .55;
let semilla = 11; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

/* ── Luz: penumbra; las cámaras la encienden ── */
const cielo = new THREE.HemisphereLight(0xffffff, 0xd8dcdf, 1);
const sol = new THREE.DirectionalLight(0xffffff, 1.5);
sol.position.set(4, 28, 12); sol.target.position.set(0, 0, 0); sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 70 }); sol.shadow.bias = -.0004; sol.shadow.normalBias = .03;
escena.add(cielo, sol, sol.target);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShadowMaterial({ opacity: .07 })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; escena.add(piso);

/* ── 01 · La planta ── */
losa(17, 11.6, .5, 0, 0);
caja(17, 2, .2, 0, PISO, -5.7, mat.yeso);                       // muro del fondo
caja(.2, 2, 11.6, -8.4, PISO, 0, mat.yeso);                       // muro izquierdo
[2.4, 4.6, 6.8].forEach((x) => { caja(1.7, 1.55, .06, x, PISO, -5.58, mat.gris); for (let i = 1; i < 6; i++) caja(1.6, .012, .07, x, PISO + i * .26, -5.55, mat.piedra, escena, false); });
// pasillo de la grúa (entre los racks), carril principal y paso peatonal
const marcaPiso = (w, d, x, z) => caja(w, .012, d, x, PISO, z, mat.marca, escena, false);
marcaPiso(10.4, .06, -2.2, -3.32); marcaPiso(10.4, .06, -2.2, -2.08);
marcaPiso(15.6, .06, .2, .35); marcaPiso(15.6, .06, .2, 2.05);
for (let i = 0; i < 4; i++) marcaPiso(1.3, .16, 1.15, -3.08 + i * .3);    // cruce del pasillo de la grúa: franjas atravesadas al camino del peatón
for (let i = 0; i < 5; i++) marcaPiso(1.3, .16, 1.15, .55 + i * .34);
// racks con pallets y cajas
function rack(x0, z, largo, prof = .95) {
  const g = new THREE.Group(); escena.add(g);
  for (let x = 0; x <= largo + .01; x += largo / 5) [-prof / 2, prof / 2].forEach((dz) => caja(.07, 2.4, .07, x0 + x, PISO, z + dz, mat.gris, g, false));
  [.12, .9, 1.68].forEach((y) => {
    caja(largo + .1, .05, prof + .04, x0 + largo / 2, PISO + y, z, mat.yeso, g, false);
    for (let k = 0; k < 5; k++) {
      if (azar() < .14) continue;
      const cx = x0 + largo / 10 + k * largo / 5, alto = .3 + azar() * .3, varias = azar() < .5;
      caja(largo / 5 - .16, .07, prof - .14, cx, PISO + y + .05, z, mat.piedra, g, false);
      if (varias) { [-1, 1].forEach((s) => caja(largo / 10 - .14, alto * (.8 + azar() * .3), prof - .3, cx + s * largo / 20, PISO + y + .12, z, azar() < .5 ? mat.kraft : mat.kraft2, g)); }
      else caja(largo / 5 - .28, alto, prof - .26, cx, PISO + y + .12, z, azar() < .3 ? mat.film : mat.kraft, g);
    }
  });
}
rack(-7.9, -4.5, 6.2); rack(-7.9, -.95, 6.2); rack(-7.9, 4.6, 4.2);
// andén: pallets, cajas, un camión pegado a la puerta
[[2.1, -3.9], [3.3, -3.9], [6.9, -3.6], [6.9, -2.3]].forEach(([x, z], i) => { caja(1.05, .1, 1.05, x, PISO, z, mat.piedra); caja(.9, .45 + (i % 3) * .2, .9, x, PISO + .1, z, i % 2 ? mat.film : mat.kraft); });
[[5.9, 4.4], [7.1, 4.4]].forEach(([x, z]) => { caja(1.05, .1, 1.05, x, PISO, z, mat.piedra); caja(.9, .9, .9, x, PISO + .1, z, mat.kraft2); });
const camion = new THREE.Group(); escena.add(camion);
caja(6.2, 2.3, 2.2, 4.4, .55, -7.4, mat.blanco, camion); caja(1.9, 1.9, 2.2, 8.6, .55, -7.4, mat.yeso, camion); caja(.06, .8, 1.6, 9.57, 1.5, -7.4, mat.tinta, camion, false);
[[2.2, -8.55], [2.2, -6.25], [3.2, -8.55], [3.2, -6.25], [8.6, -8.55], [8.6, -6.25]].forEach(([x, z]) => { const r = cil(.32, .26, x, 0, z, mat.tinta, camion, false, 18); r.rotation.x = Math.PI / 2; r.position.y = .32; });
// bolardos en la esquina ciega
[[-1.5, -1.95], [-1.5, -3.45], [-1.5, .2]].forEach(([x, z]) => cil(.08, .6, x, PISO, z, mat.gris, escena, false, 12));

/* ── Personas: cuerpo con piernas y brazos que caminan, casco ── */
function persona({ tablet = false } = {}) {
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  const pierna = (x) => { const p = new THREE.Group(); p.position.set(x, .62, 0); capsula(.075, .42, 0, -.29, 0, mat.yeso, p); cuerpo.add(p); return p; };
  const brazo = (x) => { const p = new THREE.Group(); p.position.set(x, 1.16, 0); capsula(.055, .4, 0, -.24, 0, mat.blanco, p); cuerpo.add(p); return p; };
  const pi = pierna(-.09), pd = pierna(.09);
  capsula(.17, .34, 0, .96, 0, mat.blanco, cuerpo);
  capsula(.178, .24, 0, .99, 0, mat.yeso, cuerpo);                    // chaleco
  malla(new THREE.SphereGeometry(.12, 18, 14), mat.yeso, 0, 1.36, 0, cuerpo, false);
  malla(new THREE.SphereGeometry(.135, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat.blanco, 0, 1.4, 0, cuerpo, false);   // casco
  cil(.17, .02, 0, 1.39, .02, mat.blanco, cuerpo, false, 18);
  const bi = brazo(-.23), bd = brazo(.23);
  let pantalla = null;
  if (tablet) { bd.rotation.x = -1.1; bi.rotation.x = -.9; pantalla = caja(.24, .02, .17, 0, 1.0, .32, mat.telefono, cuerpo, false); pantalla.rotation.x = -.6; }
  g.position.y = PISO; escena.add(g);
  return { g, pi, pd, bi, bd, cuerpo, pantalla, tablet, fase: azar() * 6 };
}
function andar(p, velocidad, t) {
  const a = Math.sin(t * 7 + p.fase) * .55 * velocidad;
  p.pi.rotation.x = a; p.pd.rotation.x = -a;
  if (!p.tablet) { p.bi.rotation.x = -a * .8; p.bd.rotation.x = a * .8; }
  p.cuerpo.position.y = Math.abs(Math.cos(t * 7 + p.fase)) * .035 * velocidad;
}
const mirar = (p, dx, dz) => { if (Math.abs(dx) + Math.abs(dz) > 1e-4) p.g.rotation.y = Math.atan2(dx, dz); };

/* ── La grúa horquilla: carga, baliza propia y operador ── */
function grua() {
  const g = new THREE.Group();
  caja(1.3, .55, .95, 0, .2, 0, mat.blanco, g); caja(.42, .7, .97, -.6, .2, 0, mat.yeso, g);
  [[-.42, -.39], [-.42, .39], [.36, -.39], [.36, .39]].forEach(([x, z]) => cil(.03, 1.08, x, .75, z, mat.tinta, g, false, 8));
  caja(.92, .05, .88, -.03, 1.83, 0, mat.blanco, g);
  cil(.07, .1, -.3, 1.88, 0, mat.luzGrua, g, false, 12);
  [-.28, .28].forEach((z) => caja(.07, 2.05, .07, .72, .2, z, mat.tinta, g, false)); caja(.06, .06, .64, .72, 2.18, 0, mat.tinta, g, false);
  const carro = new THREE.Group(); carro.position.set(.8, .22, 0); g.add(carro);
  caja(.06, .5, .68, 0, 0, 0, mat.gris, carro);
  [-.22, .22].forEach((z) => caja(.85, .04, .11, .45, 0, z, mat.gris, carro, false));
  caja(.95, .1, .95, .5, .05, 0, mat.piedra, carro); caja(.8, .6, .8, .5, .15, 0, mat.kraft, carro);
  [[-.42, -.46], [-.42, .46], [.42, -.46], [.42, .46]].forEach(([x, z]) => { const r = cil(.18, .14, x, 0, z, mat.tinta, g, false, 16); r.rotation.x = Math.PI / 2; r.position.y = .18; });
  caja(.34, .1, .42, -.15, .75, 0, mat.yeso, g, false);
  capsula(.14, .3, -.15, 1.06, 0, mat.blanco, g); malla(new THREE.SphereGeometry(.12, 16, 12), mat.yeso, -.15, 1.42, 0, g, false);
  malla(new THREE.SphereGeometry(.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat.blanco, -.15, 1.46, 0, g, false);
  g.position.y = PISO; escena.add(g); return { g };
}
const montacargas = grua();
// la gente de la planta
const peaton = persona(), picker = persona(), anden = persona(), caminante = persona(), supervisor = persona({ tablet: true }), chofer = persona();
const gente = [peaton, picker, anden, caminante, supervisor, chofer];
const transpaleta = new THREE.Group(); escena.add(transpaleta); transpaleta.position.y = PISO;
caja(.9, .08, .5, .45, .05, 0, mat.gris, transpaleta, false); cil(.025, .9, -.05, .05, 0, mat.tinta, transpaleta, false, 6); caja(.85, .1, .85, .45, .13, 0, mat.piedra, transpaleta); caja(.7, .55, .7, .45, .23, 0, mat.film, transpaleta);

/* ── 02 · Tres cámaras: cada una con su luz real y su cono ── */
const conoGeo = new THREE.ConeGeometry(1, 1, 64, 1, true); conoGeo.translate(0, -.5, 0); conoGeo.rotateX(-Math.PI / 2);
const conoMat = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uLuz: { value: 0 }, uColor: { value: new THREE.Color(0xff9a5a) } },
  vertexShader: "varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ vZ = position.z; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
  fragmentShader: "uniform float uLuz; uniform vec3 uColor; varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ float f = abs(dot(vN, vV)); float a = pow(1. - vZ, 1.2) * pow(f, 1.7) * .3 * uLuz; gl_FragColor = vec4(uColor * a, a); }",
});
function camaraPoste(x, z, alto, mira, angulo) {
  cil(.065, alto, x, PISO, z, mat.gris);
  const lente = new THREE.Vector3(x, PISO + alto + .1, z);
  const cuerpo = caja(.62, .28, .3, 0, -.14, 0, mat.blanco); cuerpo.position.copy(lente);
  const l = cil(.11, .1, 0, -.05, .2, mat.lente, cuerpo, false, 18); l.rotation.x = Math.PI / 2;
  const foco = new THREE.SpotLight(0xfff0e2, 0, 0, angulo, .55, 0); foco.position.copy(lente); foco.target.position.copy(mira); escena.add(foco, foco.target);
  const cono = new THREE.Mesh(conoGeo, conoMat()); escena.add(cono);
  return { lente, cuerpo, foco, cono, mira: mira.clone(), angulo };
}
const camaras = [
  camaraPoste(1.1, -5.15, 3.6, new THREE.Vector3(-.6, PISO, -1.6), .5),      // CAM 01: la esquina ciega y el cruce
  camaraPoste(-8.0, 5.3, 3.9, new THREE.Vector3(-4.2, PISO, .6), .58),       // CAM 02: racks y carril
  camaraPoste(8.0, 5.3, 3.9, new THREE.Vector3(4.6, PISO, -.8), .58),        // CAM 03: andén y frente
];
// el equipo Lumina, dentro de la misma planta (no en otra sala)
const EDGE = new THREE.Vector3(-.35, PISO, -5.2);
const edge = new THREE.Group(); edge.position.copy(EDGE); escena.add(edge);
caja(1.5, 1.7, .62, 0, 0, 0, mat.edge, edge);
for (let i = 0; i < 5; i++) caja(1.1, .025, .02, 0, .3 + i * .13, .315, mat.tinta, edge, false);
caja(.7, .1, .3, .2, 1.32, .32, mat.chip, edge, false);
const isoLumina = new THREE.Mesh(new THREE.CircleGeometry(.17, 32), new THREE.MeshBasicMaterial({ color: NARANJO, toneMapped: false })); isoLumina.position.set(-.48, 1.42, .315); edge.add(isoLumina);
// cables por el muro: cada cámara llega al equipo
const curvaCable = (a, b, alto) => { const m1 = a.clone().lerp(b, .3), m2 = a.clone().lerp(b, .7); m1.y = Math.max(a.y, b.y) + alto; m2.y = Math.max(a.y, b.y) + alto * .6; return new THREE.CatmullRomCurve3([a, m1, m2, b]); };
const entradaEdge = EDGE.clone().add(new THREE.Vector3(0, 1.7, 0));
const cables = camaras.map((c, i) => { const cu = curvaCable(c.lente.clone().add(new THREE.Vector3(0, .12, 0)), entradaEdge, [.5, 2.4, 2.4][i]); if (i === 0) { const t = new THREE.Mesh(new THREE.TubeGeometry(cu, 80, .03, 6, false), mat.cable); t.castShadow = true; escena.add(t); } return cu; });

// proyector y baliza del cruce
const BALIZA = new THREE.Vector3(1.75, PISO, -1.15);
cil(.05, 1.5, BALIZA.x, PISO, BALIZA.z, mat.gris);
cil(.16, .28, BALIZA.x, PISO + 1.5, BALIZA.z, mat.baliza, escena, false);
const luzBaliza = new THREE.PointLight(NARANJO, 0, 7, 1.5); luzBaliza.position.set(BALIZA.x, PISO + 1.75, BALIZA.z); escena.add(luzBaliza);
const PROY = new THREE.Vector3(1.75, PISO + 1.25, -1.15);
caja(.3, .22, .24, PROY.x - .1, PROY.y - .11, PROY.z, mat.blanco);
const lienzoAviso = Object.assign(document.createElement("canvas"), { width: 512, height: 512 });
{ const c = lienzoAviso.getContext("2d"); c.clearRect(0, 0, 512, 512);
  c.strokeStyle = "rgba(236,109,39,1)"; c.lineWidth = 22; c.setLineDash([46, 30]); c.strokeRect(24, 24, 464, 464); c.setLineDash([]);
  c.fillStyle = "rgba(236,109,39,.22)"; c.fillRect(24, 24, 464, 464);
  c.fillStyle = "rgba(236,109,39,1)"; c.beginPath(); c.moveTo(256, 120); c.lineTo(392, 370); c.lineTo(120, 370); c.closePath(); c.fill();
  c.fillStyle = "#fff"; c.font = "800 150px -apple-system, Inter, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("!", 256, 285);
}
const texAviso = new THREE.CanvasTexture(lienzoAviso); texAviso.colorSpace = THREE.SRGBColorSpace;
const aviso = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: texAviso, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
aviso.rotation.x = -Math.PI / 2; aviso.position.set(1.15, PISO + .015, -2.7); aviso.scale.setScalar(.72); escena.add(aviso);   // la advertencia, en el cruce del pasillo
const haz = new THREE.Mesh(conoGeo, conoMat()); escena.add(haz); haz.material.uniforms.uColor.value.set(0xff7a3a);
const anillo = new THREE.Mesh(new THREE.RingGeometry(.8, .92, 64), new THREE.MeshBasicMaterial({ color: NARANJO, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
anillo.rotation.x = -Math.PI / 2; escena.add(anillo);

/* ── Cajas de detección ── */
const marco = (w, h, d) => { const m = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: NARANJO, transparent: true, opacity: 0 })); escena.add(m); return m; };
const marcos = [...gente.map(() => marco(.62, 1.62, .62)), marco(2.5, 2.4, 1.3), marco(1.2, 1.1, .7)];

function brillo() {
  const c = Object.assign(document.createElement("canvas"), { width: 128, height: 128 }), x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,206,170,1)"); g.addColorStop(.25, "rgba(236,109,39,.65)"); g.addColorStop(1, "rgba(236,109,39,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const texBrillo = brillo();
const chispa = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })); s.renderOrder = 7; escena.add(s); s.visible = false; return s; };
const punto = chispa(), estela = Array.from({ length: 8 }, chispa);

/* ── Las cuatro fases: detecta → lo procesa → el jefe recibe el aviso → va al lugar ── */
const ESTACIONES = [
  { t: "La cámara ve el riesgo", d: "Una grúa y un peatón están por cruzarse.", dur: 5.6, toma: [-.5, 1.1, -1.5, 5.4, -.06] },
  { t: "Lumina lo entiende y actúa", d: "Se enciende la baliza y la grúa frena a tiempo.", dur: 4.6, toma: [.5, 1.5, -2.9, 5.6, .1] },
  { t: "Avisa al jefe de planta", d: "Le llega al celular, esté donde esté.", dur: 4.4, toma: [1.8, 1.3, .2, 6.2, -.1] },
  { t: "Lo corrige en terreno", d: "Va al punto exacto con el video en la mano.", dur: 5.2, toma: [1.9, 1, -.6, 5.2, -.12] },
];
const N = ESTACIONES.length;
const INICIOS = ESTACIONES.reduce((a, e, i) => (a.push(i ? a[i - 1] + ESTACIONES[i - 1].dur : 0), a), []);
const TOTAL = INICIOS[N - 1] + ESTACIONES[N - 1].dur;
const GENERAL = [.4, 1.2, .2, 8.8, 0];
const TA = INICIOS[1] + 1.5;   // el momento en que Lumina actúa en el cruce (baliza, proyector, la grúa frena)
const TR = TA - 1.7;           // el momento en que la cámara ve el riesgo

const tag = (txt, extra = "") => { const el = document.createElement("span"); el.className = "tag3d " + extra; el.innerHTML = txt; capa.appendChild(el); return el; };
const tagPeaton = tag("Peatón"), tagGrua = tag("Grúa"), tagAlerta = tag("Riesgo: grúa y peatón", "tag3d--alerta");
const tagAviso = tag(`<img src="recursos/marcas/lumina-isotipo.svg" alt=""><span><small>Lumina · ahora</small><b>Riesgo: grúa y peatón</b><em>Pasillo 2 · ver video</em></span>`, "tag3d--aviso");
const tagLlega = tag("Revisado en terreno", "tag3d--ok");
tagGrua.style.setProperty("--c", "#EC6D27");
const proy = new THREE.Vector3();
function aPantalla(v, el, w, h, margen = 0) { proy.copy(v).project(camara); let x = (proy.x * .5 + .5) * w; const y = (-proy.y * .5 + .5) * h; if (margen) x = Math.min(x, w - margen); el.style.setProperty("--x", x.toFixed(1) + "px"); el.style.setProperty("--y", y.toFixed(1) + "px"); return x > -40 && x < w + 40 && y > -40 && y < h + 40; }
const mostrar = (el, on, v, w, h) => { el.classList.toggle("on", on); if (on) aPantalla(v, el, w, h); };
const LUGAR = new THREE.Vector3(.15, PISO, -1.75);   // donde el jefe llega a revisar

/* ── La cámara de la maqueta: cada estación su toma; arrastrar la inclina ── */
const DIR = new THREE.Vector3(.78, .95, 1).normalize(), Y = new THREE.Vector3(0, 1, 0);
const toma = { c: new THREE.Vector3(...GENERAL.slice(0, 3)), t: GENERAL[3], g: 0 }, meta = { c: new THREE.Vector3(), t: 0, g: 0 };
let giro = 0, giroVel = 0, arrastre = null;
lienzo.addEventListener("pointerdown", (e) => { arrastre = { x: e.clientX, g: giro }; lienzo.setPointerCapture(e.pointerId); });
lienzo.addEventListener("pointermove", (e) => { if (arrastre) giro = clamp(arrastre.g + (e.clientX - arrastre.x) / 900, -.25, .25); });
lienzo.addEventListener("pointerup", () => (arrastre = null));
function encuadrar(w, h) {
  const asp = w / h, mitad = asp >= 1.3 ? toma.t : toma.t * Math.max(1, asp < .8 ? .74 / asp : 1.05 / asp);   // vertical (celular): más cerca de la acción
  camara.left = -mitad * asp; camara.right = mitad * asp; camara.top = mitad; camara.bottom = -mitad; camara.updateProjectionMatrix();
  camara.position.copy(toma.c).addScaledVector(DIR.clone().applyAxisAngle(Y, giro + toma.g), 50); camara.lookAt(toma.c);
}

/* ── El reloj: el scroll maneja la historia ── */
let T = 0, previo = performance.now(), estacion = -1, visible = false;
const tramoScroll = document.getElementById("recorrido");
const metaScroll = () => { const r = tramoScroll.getBoundingClientRect(); return clamp(-(r.top - 64) / Math.max(1, r.height - (innerHeight - 64))) * TOTAL * .9999; };
const estacionDe = (t) => { let i = 0; while (i < N - 1 && t >= INICIOS[i + 1]) i++; return i; };
chips.forEach((b, i) => b.addEventListener("click", () => {
  const r = tramoScroll.getBoundingClientRect(), recorrible = r.height - (innerHeight - 64);
  scrollTo({ top: scrollY + r.top - 64 + recorrible * (INICIOS[i] + ESTACIONES[i].dur * .45) / TOTAL, behavior: "smooth" });
}));

// la historia del cruce, segundo a segundo (todo depende de T: el scroll hacia atrás la rebobina)
function gruaX(t) {
  if (t < TA - 2.6) return lerp(-7.2, -3.2, t / (TA - 2.6));
  if (t < TA) return lerp(-3.2, -1.75, tramo(t, TA - 2.6, TA));
  if (t < TA + .7) return lerp(-1.75, -1.45, eo(tramo(t, TA, TA + .7)));        // frena antes del cruce
  if (t < TA + 4.6) return -1.45;
  return lerp(-1.45, 5.6, suave(tramo(t, TA + 4.6, TOTAL - .6)));
}
function peatonZ(t) {
  if (t < TA - 2.9) return -4.9;
  if (t < TA) return lerp(-4.9, -3.75, tramo(t, TA - 2.9, TA));
  if (t < TA + 2.2) return -3.75;                                                  // se detiene con el aviso, antes del pasillo
  if (t < TA + 4.2) return lerp(-3.75, -1.5, suave(tramo(t, TA + 2.2, TA + 4.2)));  // la grúa frenó: cruza el pasillo
  return -1.5;                                                                      // y espera ahí, al lado del punto, a que llegue el jefe
}
function supervisorPos(t) {
  const a = INICIOS[3] + ESTACIONES[3].dur * .06, b = INICIOS[3] + ESTACIONES[3].dur * .7;
  if (t < a) return [4.6, 3.4, 0];
  const k = suave(tramo(t, a, b)); return [lerp(4.6, LUGAR.x, k), lerp(3.4, LUGAR.z, k), k > 0 && k < 1 ? 1 : 0];
}

function cuadro() {
  const ahora = performance.now(), dt = Math.min(.05, (ahora - previo) / 1000), reloj = ahora / 1000; previo = ahora;
  if (!L.congelar) { const m = metaScroll(); T += (m - T) * (QUIETO ? 1 : 1 - Math.pow(1 - .16, dt * 60)); }
  const e = estacionDe(T), k = clamp((T - INICIOS[e]) / ESTACIONES[e].dur), w = cont.clientWidth, h = cont.clientHeight;
  if (lienzo.width !== Math.round(w * render.getPixelRatio())) render.setSize(w, h, false);

  // 01–02 · penumbra, y las cámaras se encienden una a una
  const encendida = camaras.map((_, i) => (e === 0 ? eo(tramo(k, .02 + i * .07, .16 + i * .07)) : 1));
  const luz = (encendida[0] + encendida[1] + encendida[2]) / 3;
  cielo.intensity = lerp(.32, 1.25, luz); sol.intensity = lerp(.28, 1.65, luz); render.toneMappingExposure = lerp(.66, 1.02, luz);
  camaras.forEach((c, i) => {
    const barrido = e === 0 ? Math.sin(tramo(k, .04 + i * .07, .3 + i * .07) * Math.PI) * 1.2 : 0;
    c.foco.target.position.copy(c.mira).add(new THREE.Vector3(barrido, 0, -barrido * .5)); c.foco.intensity = 4.2 * encendida[i];
    const d = c.foco.target.position.clone().sub(c.lente), largo = d.length() * 1.15, r = Math.tan(c.angulo) * largo;
    c.cono.position.copy(c.lente); c.cono.lookAt(c.foco.target.position); c.cono.scale.set(r, r, largo); c.cono.material.uniforms.uLuz.value = encendida[i];
    c.cuerpo.lookAt(c.foco.target.position);
  });

  // la gente y la grúa
  const gx = gruaX(T), mueve = Math.abs(gx - gruaX(T - .05)) > .002;
  montacargas.g.position.set(gx, PISO, -2.7);
  const pz = peatonZ(T), pzp = peatonZ(T - .05), [sx, sz, sm] = supervisorPos(T), [sxp, szp] = supervisorPos(T - .05);
  peaton.g.position.set(1.15, PISO, pz); andar(peaton, Math.abs(pz - pzp) > .002 ? 1 : 0, reloj);
  if (T > TA + 4.2) mirar(peaton, sx - 1.15, sz - pz); else mirar(peaton, 0, pz - pzp || 1);   // ya cruzó: mira hacia el jefe
  picker.g.position.set(-5.2, PISO, -2.95); picker.g.rotation.y = Math.PI; andar(picker, 0, reloj); picker.bd.rotation.x = -1.2 - Math.sin(reloj * 1.6) * .5;
  const ax = 4.2 + Math.sin(reloj * .45) * 1.6, axp = 4.2 + Math.sin((reloj - .05) * .45) * 1.6;
  anden.g.position.set(ax, PISO, -2.2); mirar(anden, ax - axp, 0); andar(anden, .9, reloj); transpaleta.position.set(ax + (ax > axp ? .55 : -.55), PISO, -2.2); transpaleta.rotation.y = ax > axp ? 0 : Math.PI;
  const cxw = -5 + ((reloj * .55) % 10), cxp = -5 + (((reloj - .05) * .55) % 10);
  caminante.g.position.set(cxw, PISO, 3.2); mirar(caminante, cxw - cxp, 0); andar(caminante, 1, reloj);
  chofer.g.position.set(7.6, PISO, -4.4); chofer.g.rotation.y = -2.4; andar(chofer, 0, reloj); chofer.bd.rotation.x = -.4 + Math.sin(reloj) * .2;
  supervisor.g.position.set(sx, PISO, sz); if (sm) mirar(supervisor, sx - sxp, sz - szp); else supervisor.g.rotation.y = -2.6; andar(supervisor, sm, reloj);

  // detecciones: lo que alguna cámara alcanza a ver
  const ve = (p) => camaras.some((c, i) => { if (encendida[i] < .5) return false; const v = p.clone().sub(c.lente).normalize(), d = c.foco.target.position.clone().sub(c.lente).normalize(); return v.dot(d) > Math.cos(c.angulo * 1.05); });
  const objetos = [...gente.map((p) => [p.g, .8]), [montacargas.g, 1.2], [transpaleta, .55]];
  const enAlerta = T >= TR && T < TA + 3.4;
  objetos.forEach(([o, alto], i) => {
    const c = o.position.clone().setY(PISO + alto), m = marcos[i], visto = ve(c) && luz > .4;
    m.material.opacity += ((visto && (i === 0 || i === 6) && e <= 1 ? 1 : 0) - m.material.opacity) * .18;   // solo los protagonistas: menos ruido
    m.position.copy(c); m.rotation.y = o.rotation.y;
    m.material.color.set(enAlerta && (i === 0 || i === 6) ? 0xE5484D : NARANJO);
  });
  mat.luzGrua.emissiveIntensity = mueve || enAlerta ? .4 + (Math.sin(ahora / 140) * .5 + .5) * 1.2 : .15;

  mat.chip.emissiveIntensity = e === 1 && k < .5 ? .6 + Math.sin(ahora / 80) * .5 : e >= 1 ? .35 : luz * .15;

  // 04 · la alerta en terreno: proyector, baliza, anillo y la grúa que frena
  const tA = T - TA;
  const kAviso = tA >= 0 && tA < 4.4 ? clamp(tA * 3) * (1 - clamp((tA - 3.8) / .6)) : 0;
  aviso.material.opacity = kAviso * (.82 + Math.sin(ahora / 110) * .18);
  haz.position.copy(PROY); haz.lookAt(aviso.position); haz.scale.set(1.05, 1.05, aviso.position.distanceTo(PROY)); haz.material.uniforms.uLuz.value = kAviso * 1.4;
  const destello = kAviso > 0 ? (Math.sin(tA * 13) * .5 + .5) * kAviso : 0;
  mat.baliza.emissiveIntensity = .08 + destello * 2.4; luzBaliza.intensity = destello * 7;
  anillo.position.set(1.15, PISO + .02, pz); anillo.scale.setScalar(.8 + eo(clamp(tA / 1.3)) * 1.3); anillo.material.opacity = tA >= 0 && tA < 1.3 ? 1 - tA / 1.3 : 0;

  // 03 · el aviso viaja hasta el jefe de planta, que está trabajando en otro punto de la planta
  let pPunto = null;
  estela.forEach((s) => (s.visible = false));
  if (e === 2 && k > .04 && k < .44) {
    const kv = eo(tramo(k, .04, .42)), desde = EDGE.clone().add(new THREE.Vector3(.2, 2.2, .3)), hasta = supervisor.g.position.clone().setY(PISO + 1.05);
    const cu = new THREE.QuadraticBezierCurve3(desde, desde.clone().lerp(hasta, .5).add(new THREE.Vector3(0, 2.2, 0)), hasta);
    pPunto = cu.getPoint(kv); estela.forEach((s, i) => { s.visible = true; s.position.copy(cu.getPoint(clamp(kv - (i + 1) * .03))); s.scale.setScalar(.55 * (1 - i / 9)); s.material.opacity = .5 * (1 - i / 8); });
  }
  punto.visible = !!pPunto; if (pPunto) { punto.position.copy(pPunto); punto.scale.setScalar(.9 + Math.sin(ahora / 100) * .15); }
  mat.telefono.emissiveIntensity = (e === 2 && k > .42) || e === 3 ? .9 + Math.sin(ahora / 90) * .5 : 0;
  // 04 · llega al lugar: un anillo marca el punto exacto del hallazgo
  if (e === 3 && k > .06) { const kl = tramo(k, .7, .9); anillo.position.set(LUGAR.x, PISO + .02, LUGAR.z); anillo.scale.setScalar(lerp(1.15 + Math.sin(ahora / 260) * .1, .7, kl)); anillo.material.opacity = lerp(.8, .35, kl); anillo.material.color.set(kl >= 1 ? 0x1F9D5A : NARANJO); } else anillo.material.color.set(NARANJO);

  // la toma
  let t = ESTACIONES[e].toma;
  if (e === 0 && k < .12) t = GENERAL;
  meta.c.set(t[0], t[1], t[2]); meta.t = t[3]; meta.g = t[4];
  const s = 1 - Math.pow(1 - .09, dt * 60); toma.c.lerp(meta.c, s); toma.t = lerp(toma.t, meta.t, s); toma.g = lerp(toma.g, meta.g, s);
  if (!arrastre) { giroVel += -giro * .02; giroVel *= .86; giro += giroVel; }
  encuadrar(w, h);
  render.render(escena, camara);

  // etiquetas
  mostrar(tagPeaton, marcos[0].material.opacity > .5 && e <= 1 && !enAlerta, peaton.g.position.clone().setY(PISO + 1.9), w, h);
  mostrar(tagGrua, marcos[6].material.opacity > .5 && e <= 1 && !enAlerta, montacargas.g.position.clone().setY(PISO + 2.7), w, h);
  mostrar(tagAlerta, enAlerta && e <= 1, new THREE.Vector3(-.4, PISO + 3, -2.3), w, h);
  mostrar(tagAviso, (e === 2 && k > .42) || (e === 3 && k < .3), supervisor.g.position.clone().setY(PISO + 2.1), w, h);
  mostrar(tagLlega, e === 3 && k > .74, LUGAR.clone().setY(PISO + 2.2), w, h);
  if (e !== estacion) {
    estacion = e; chips.forEach((c, j) => { c.classList.toggle("activo", j === e); c.classList.toggle("hecho", j < e); });
    recN.textContent = `0${e + 1}`; recT.textContent = ESTACIONES[e].t; recD.textContent = ESTACIONES[e].d;
    recActual.classList.remove("cambia"); void recActual.offsetWidth; recActual.classList.add("cambia");
  }
  chips[e].style.setProperty("--prog", k);
}

/* ── Solo dibuja cuando se ve ── */
let raf = 0;
const bucle = () => { if (!visible) return; raf = requestAnimationFrame(bucle); cuadro(); };
new IntersectionObserver(([en]) => {
  visible = en.isIntersecting;
  if (visible) { previo = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(bucle); }
}, { threshold: 0 }).observe(cont);
cuadro();
cont.classList.add("lista"); document.getElementById("maqueta-cargando")?.remove();
// para revisar: salta a una estación y a un punto dentro de ella (0 a 1) y deja la escena quieta
L.maquetaIr = (i, k = .5) => { L.congelar = true; T = INICIOS[i] + ESTACIONES[i].dur * k - 1.2; for (let n = 0; n < 75; n++) { previo = performance.now() - 16; T += .016; cuadro(); } };
