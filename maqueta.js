/* Lumina · «La planta que se enciende». Maqueta isométrica en Three.js, toda procedural: una planta en penumbra donde la
   luz de la cámara es lo único con color. El evento viaja como un punto de luz por las seis estaciones del diagrama
   (operación → cámara → IA → datos → dashboard → staff) y vuelve a la planta prendiendo la baliza. */

import * as THREE from "./recursos/vendor/three.module.min.js";

const L = window.LUMINA;
const cont = document.getElementById("maqueta"), lienzo = cont.querySelector(".maqueta__lienzo"), capa = document.getElementById("etiquetas");
const chips = [...document.querySelectorAll(".estacion")], textoMovil = document.getElementById("estacion-txt");
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const suave = (x) => x * x * (3 - 2 * x);
const eo = (x) => 1 - Math.pow(1 - x, 3);

/* ── Escenario ── */
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: "high-performance" });
render.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
render.shadowMap.enabled = true; render.shadowMap.type = THREE.PCFSoftShadowMap;
render.toneMapping = THREE.ACESFilmicToneMapping; render.toneMappingExposure = 1;
const escena = new THREE.Scene();
const camara = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 200);

const C = { blanco: 0xF4F4F2, yeso: 0xE6E7E4, gris: 0xBFC5C9, cable: 0xCDD3D6, tinta: 0x2A3036, kraft: 0xE6DCCB, ambar: 0xED6A14 };
const mat = {
  blanco: new THREE.MeshStandardMaterial({ color: C.blanco, roughness: .92 }),
  yeso: new THREE.MeshStandardMaterial({ color: C.yeso, roughness: .95 }),
  gris: new THREE.MeshStandardMaterial({ color: C.gris, roughness: .8 }),
  tinta: new THREE.MeshStandardMaterial({ color: C.tinta, roughness: .55 }),
  kraft: new THREE.MeshStandardMaterial({ color: C.kraft, roughness: .95 }),
  cable: new THREE.MeshStandardMaterial({ color: C.cable, roughness: .7 }),
  marca: new THREE.MeshStandardMaterial({ color: 0xD9DCDE, roughness: 1 }),
  chip: new THREE.MeshStandardMaterial({ color: 0x3A3020, emissive: C.ambar, emissiveIntensity: 0, roughness: .4 }),
  baliza: new THREE.MeshStandardMaterial({ color: 0xF4CDB4, emissive: C.ambar, emissiveIntensity: 0, roughness: .35 }),
  telefono: new THREE.MeshStandardMaterial({ color: C.tinta, emissive: C.ambar, emissiveIntensity: 0, roughness: .4 }),
};
const linea = new THREE.LineBasicMaterial({ color: 0x0B131B, transparent: true, opacity: .14 });

function malla(geo, m, x, y, z, padre = escena, bordes = true) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true;
  if (bordes) o.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), linea));
  padre.add(o); return o;
}
// cajas y cilindros apoyados en y (su base), no centrados
const caja = (w, h, d, x, y, z, m = mat.blanco, p, b) => malla(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, p, b);
const cil = (r, h, x, y, z, m = mat.blanco, p, b = true, seg = 28) => malla(new THREE.CylinderGeometry(r, r, h, seg), m, x, y + h / 2, z, p, b);
// losas de maqueta: rectángulo con esquinas redondas y un canto suave
function losa(w, d, h, x, z, m = mat.blanco, r = .38) {
  const s = new THREE.Shape(), x0 = -w / 2, y0 = -d / 2;
  s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); s.lineTo(x0 + w, y0 + d - r); s.quadraticCurveTo(x0 + w, y0 + d, x0 + w - r, y0 + d);
  s.lineTo(x0 + r, y0 + d); s.quadraticCurveTo(x0, y0 + d, x0, y0 + d - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2, curveSegments: 8 });
  g.rotateX(-Math.PI / 2);
  return malla(g, m, x, 0, z, escena, true);
}
const PISO = .55;

/* ── Luces: penumbra al comienzo; la luz de Lumina la enciende ── */
const cielo = new THREE.HemisphereLight(0xffffff, 0xd8dcdf, 1);
const sol = new THREE.DirectionalLight(0xffffff, 1.6);
sol.position.set(3, 26, 9); sol.target.position.set(1, 0, 0); sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 }); sol.shadow.bias = -.0004; sol.shadow.normalBias = .03;
escena.add(cielo, sol, sol.target);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: .07 }));
piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; escena.add(piso);

/* ── 01 · La planta ── */
losa(12.4, 10.4, .5, -4, 0);
caja(12.4, 1.9, .18, -4, PISO, -5.1, mat.yeso);
caja(.18, 1.9, 10.4, -10.1, PISO, 0, mat.yeso);
[-1.6, .5].forEach((x) => caja(1.5, 1.45, .06, x, PISO, -4.98, mat.gris));
// pasillo de la grúa: líneas de piso y el paso de peatones
[.2, 4.0].forEach((z) => caja(11.2, .012, .06, -4, PISO, z, mat.marca, escena, false));
for (let i = 0; i < 5; i++) caja(.22, .012, 3.6, -2.75 + i * .42, PISO, 2.1, mat.marca, escena, false);
// racks con pallets y cajas (semilla fija para que siempre se vea igual)
let semilla = 7; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
function rack(x0, z, largo) {
  const g = new THREE.Group(); escena.add(g);
  for (let x = 0; x <= largo + .01; x += largo / 4) [-.45, .45].forEach((dz) => caja(.07, 2.3, .07, x0 + x, PISO, z + dz, mat.gris, g, false));
  [.12, .9, 1.68].forEach((y) => {
    caja(largo + .1, .05, .98, x0 + largo / 2, PISO + y, z, mat.yeso, g);
    for (let k = 0; k < 4; k++) {
      if (azar() < .18) continue;
      const cx = x0 + largo / 8 + k * largo / 4, alto = .28 + azar() * .32;
      caja(largo / 4 - .2, .08, .8, cx, PISO + y + .05, z, mat.yeso, g, false);
      caja(largo / 4 - .32, alto, .68, cx, PISO + y + .13, z, mat.kraft, g);
    }
  });
}
rack(-9.5, -3.9, 5); rack(-9.5, -1.6, 5);
[[.6, -3.4], [-8.4, 4.4], [-7.2, 4.5]].forEach(([x, z], i) => { caja(1.1, .1, 1.1, x, PISO, z, mat.yeso); caja(.95, .5 + i * .2, .95, x, PISO + .1, z, i ? mat.kraft : mat.blanco); });

// la grúa horquilla (avanza hacia +x en su sistema local)
function grua() {
  const g = new THREE.Group();
  caja(1.25, .55, .9, 0, .2, 0, mat.blanco, g); caja(.38, .62, .92, -.55, .2, 0, mat.yeso, g);
  [[-.4, -.37], [-.4, .37], [.38, -.37], [.38, .37]].forEach(([x, z]) => cil(.03, 1.05, x, .75, z, mat.tinta, g, false, 8));
  caja(.92, .05, .86, -.01, 1.8, 0, mat.blanco, g);
  [-.27, .27].forEach((z) => caja(.06, 1.9, .06, .7, .2, z, mat.tinta, g, false));
  caja(.08, .42, .66, .76, .24, 0, mat.gris, g);
  [-.2, .2].forEach((z) => caja(.78, .04, .1, 1.18, .24, z, mat.gris, g, false));
  [[-.4, -.44], [-.4, .44], [.4, -.44], [.4, .44]].forEach(([x, z]) => { const r = cil(.17, .14, x, 0, z, mat.tinta, g, false, 16); r.rotation.x = Math.PI / 2; r.position.y = .17; });
  caja(.34, .1, .4, -.12, .75, 0, mat.yeso, g, false);
  malla(new THREE.CapsuleGeometry(.14, .32, 4, 12), mat.yeso, -.12, 1.07, 0, g, false); malla(new THREE.SphereGeometry(.12, 16, 12), mat.yeso, -.12, 1.43, 0, g, false);
  g.position.y = PISO; escena.add(g); return g;
}
function persona() {
  const g = new THREE.Group();
  malla(new THREE.CapsuleGeometry(.17, .6, 4, 14), mat.blanco, 0, .47, 0, g, false);
  malla(new THREE.SphereGeometry(.14, 18, 14), mat.yeso, 0, 1.13, 0, g, false);
  g.position.y = PISO; escena.add(g); return g;
}
const montacargas = grua();
const gente = [persona(), persona(), persona()];

// el camino de la grúa: una vuelta por los dos carriles
const ruta = new THREE.CatmullRomCurve3([[-8.6, .95], [-4, .95], [.3, .95], [1.05, 2.1], [.3, 3.3], [-4, 3.3], [-8.6, 3.3], [-9.3, 2.1]].map(([x, z]) => new THREE.Vector3(x, PISO, z)), true, "centripetal");

// el poste con la cámara y la baliza de la planta
const LENTE = new THREE.Vector3(1.55, 4.75, -4.35);
cil(.07, 4.2, 1.55, PISO, -4.35, mat.gris);
const cuerpoCam = caja(.7, .32, .34, 0, -.16, 0, mat.blanco, escena); cuerpoCam.position.copy(LENTE);
const lenteCam = cil(.12, .12, 0, -.06, .23, mat.tinta, cuerpoCam, false, 18); lenteCam.rotation.x = Math.PI / 2;
const BALIZA = new THREE.Vector3(-.35, PISO, 4.55);
cil(.05, 1.35, BALIZA.x, PISO, BALIZA.z, mat.gris);
const domo = cil(.17, .3, BALIZA.x, PISO + 1.35, BALIZA.z, mat.baliza, escena, false);
const luzBaliza = new THREE.PointLight(C.ambar, 0, 6, 1.6); luzBaliza.position.set(BALIZA.x, PISO + 1.6, BALIZA.z); escena.add(luzBaliza);

/* ── 02 · La luz de la cámara: luz focal real + cono de volumen ── */
const foco = new THREE.SpotLight(0xff9d5c, 0, 0, .5, .55, 0);
foco.position.copy(LENTE);
escena.add(foco, foco.target);
const conoGeo = new THREE.ConeGeometry(1, 1, 64, 1, true); conoGeo.translate(0, -.5, 0); conoGeo.rotateX(-Math.PI / 2);
const cono = new THREE.Mesh(conoGeo, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uLuz: { value: 0 }, uColor: { value: new THREE.Color(0xff8c45) } },
  vertexShader: "varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ vZ = position.z; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
  fragmentShader: "uniform float uLuz; uniform vec3 uColor; varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ float f = abs(dot(vN, vV)); float a = pow(1. - vZ, 1.15) * pow(f, 1.6) * .34 * uLuz; gl_FragColor = vec4(uColor * a, a); }",
}));
escena.add(cono);
const MIRA = new THREE.Vector3(-3.6, PISO, 1.2);

// cajas de detección: aparecen cuando la luz alcanza a cada persona o a la grúa
const ambarLinea = (o) => new THREE.LineBasicMaterial({ color: C.ambar, transparent: true, opacity: o });
function marco(w, h, d) { const m = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), ambarLinea(0)); escena.add(m); return m; }
const marcos = [...gente.map(() => marco(.62, 1.42, .62)), marco(2.35, 2.05, 1.25)];

/* ── 03 a 06 · Las islas ── */
losa(2.8, 2.8, .5, 4.8, -3.6);
losa(2.6, 2.6, .5, 8.5, -1.3);
losa(3.4, 2.4, .5, 4.7, 3.5);
losa(3.6, 2.9, .5, 8.9, 4.3);
// caja de procesamiento con tapa que se abre y el chip
const ia = new THREE.Group(); escena.add(ia);
caja(1.3, 1, 1.3, 0, 0, 0, mat.blanco, ia);
for (let i = 0; i < 3; i++) caja(.9, .03, .02, 0, .3 + i * .16, .66, mat.tinta, ia, false);
const chip = caja(.52, .1, .52, 0, 1, 0, mat.chip, ia, false);
const bisagra = new THREE.Group(); bisagra.position.set(0, 1, -.65); ia.add(bisagra);
caja(1.32, .1, 1.32, 0, 0, .65, mat.yeso, bisagra);
ia.position.set(4.8, PISO, -3.6);
// base de datos: discos que suman uno por evento
const discos = new THREE.Group(); discos.position.set(8.5, PISO, -1.3); escena.add(discos);
for (let i = 0; i < 3; i++) cil(.66, .32, 0, i * .4, 0, mat.blanco, discos);
const discoNuevo = cil(.66, .32, 0, 1.2, 0, mat.chip, discos); discoNuevo.visible = false;
// dashboard: un monitor grande con el video real y sus detecciones
const lienzoPantalla = Object.assign(document.createElement("canvas"), { width: 960, height: 560 });
const texPantalla = new THREE.CanvasTexture(lienzoPantalla); texPantalla.colorSpace = THREE.SRGBColorSpace; texPantalla.anisotropy = 4;
const monitor = new THREE.Group(); monitor.position.set(4.7, PISO, 3.5); monitor.rotation.y = Math.PI / 4; escena.add(monitor);
cil(.06, .9, 0, 0, 0, mat.gris, monitor); caja(.9, .05, .5, 0, 0, 0, mat.gris, monitor);
caja(3.1, 1.86, .12, 0, .9, 0, mat.tinta, monitor);
const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(2.96, 1.73), new THREE.MeshBasicMaterial({ map: texPantalla, toneMapped: false }));
pantalla.position.set(0, 1.83, .065); monitor.add(pantalla);
// escritorio del staff
const lienzoCurva = Object.assign(document.createElement("canvas"), { width: 420, height: 260 });
const texCurva = new THREE.CanvasTexture(lienzoCurva); texCurva.colorSpace = THREE.SRGBColorSpace;
const escritorio = new THREE.Group(); escritorio.position.set(8.9, PISO, 4.3); escritorio.rotation.y = Math.PI / 4; escena.add(escritorio);
caja(2.4, .07, 1.05, 0, .82, -.3, mat.blanco, escritorio);
[[-1.1, -.7], [1.1, -.7], [-1.1, .1], [1.1, .1]].forEach(([x, z]) => caja(.06, .82, .06, x, 0, z, mat.gris, escritorio, false));
[[-.58, texPantalla], [.62, texCurva]].forEach(([x, tex], i) => {
  const m = new THREE.Group(); m.position.set(x, .89, -.55); m.rotation.y = i ? -.12 : .12; escritorio.add(m);
  caja(.08, .28, .08, 0, 0, 0, mat.gris, m, false); caja(1.08, .66, .05, 0, .26, 0, mat.tinta, m);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1, .6), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); p.position.set(0, .59, .03); m.add(p);
});
const telefono = caja(.14, .03, .26, .55, .89, .05, mat.telefono, escritorio, false);
caja(.6, .08, .6, 0, .46, .55, mat.gris, escritorio); caja(.6, .6, .07, 0, .5, .85, mat.gris, escritorio);
const staff = persona(); escritorio.add(staff); staff.position.set(0, .1, .45); staff.scale.setScalar(.92);

/* ── Cables y el punto de luz que viaja ── */
const anclas = {
  cam: () => LENTE.clone().add(new THREE.Vector3(.1, .1, .3)),
  ia: () => ia.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
  bd: () => new THREE.Vector3(8.5, PISO + 1.25, -1.3),
  tablero: () => new THREE.Vector3(4.7, PISO + 2.1, 3.5),
  staff: () => new THREE.Vector3(8.9, PISO + 1.35, 4.3),
  baliza: () => BALIZA.clone().setY(PISO + 1.6),
};
const curva = (a, b, alto) => { const m1 = a.clone().lerp(b, .33), m2 = a.clone().lerp(b, .66); m1.y = Math.max(a.y, b.y) + alto; m2.y = Math.max(a.y, b.y) + alto * .8; return new THREE.CatmullRomCurve3([a, m1, m2, b]); };
const TRAMOS = [["cam", "ia", 1.2], ["ia", "bd", .9], ["bd", "tablero", .9], ["tablero", "staff", .7], ["staff", "baliza", 3.2]];
const tubos = TRAMOS.map(([, , ], i) => { const t = new THREE.Mesh(new THREE.BufferGeometry(), mat.cable); t.castShadow = true; t.visible = i < 4; escena.add(t); return t; });
let curvas = [];
function armarCables() {
  curvas = TRAMOS.map(([a, b, h]) => curva(anclas[a](), anclas[b](), h));
  tubos.forEach((t, i) => { if (!t.visible) return; t.geometry.dispose(); t.geometry = new THREE.TubeGeometry(curvas[i], 70, .035, 6, false); });
}
armarCables();
function brillo() {
  const c = Object.assign(document.createElement("canvas"), { width: 128, height: 128 }), x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,196,160,1)"); g.addColorStop(.25, "rgba(237,106,20,.65)"); g.addColorStop(1, "rgba(237,106,20,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const texBrillo = brillo();
const punto = new THREE.Group(); escena.add(punto);
punto.add(new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd2b4, toneMapped: false })));
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })); halo.scale.setScalar(1.3); punto.add(halo);
const estela = Array.from({ length: 7 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .5 * (1 - i / 7), toneMapped: false })); s.scale.setScalar(.7 * (1 - i / 9)); escena.add(s); return s; });
// el anillo de alerta en el piso
const anillo = new THREE.Mesh(new THREE.RingGeometry(.8, .92, 64), new THREE.MeshBasicMaterial({ color: C.ambar, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
anillo.rotation.x = -Math.PI / 2; escena.add(anillo);

/* ── Etiquetas en HTML, proyectadas sobre la maqueta ── */
const ESTACIONES = [
  { t: "Operación en tiempo real", d: "Personas, vehículos y activos en tus instalaciones.", ancla: () => new THREE.Vector3(-6.6, PISO + 2.3, -1.6), dur: 3.4, toma: [-3.6, 1, .4, 7] },
  { t: "Periférico de visión", d: "Cámaras con captura de video en vivo del sitio.", ancla: () => LENTE.clone().add(new THREE.Vector3(0, .5, 0)), dur: 3.8, toma: [-2.2, 1.6, -.8, 7.2] },
  { t: "Procesamiento con IA", d: "Análisis de video y detección de eventos.", ancla: () => ia.position.clone().add(new THREE.Vector3(0, 1.6, 0)), dur: 3.4, toma: [4.8, 1.5, -3.3, 4.4] },
  { t: "Base de datos", d: "Almacenamiento de eventos y evidencias.", ancla: () => new THREE.Vector3(8.5, PISO + 1.9, -1.3), dur: 3.8, toma: [2.6, 1, .6, 7.4] },
  { t: "Dashboard web", d: "Interfaz de consulta y administración de datos.", ancla: () => new THREE.Vector3(4.7, PISO + 2.9, 3.5), dur: 3.8, toma: [4.8, 1.8, 3.3, 3.5] },
  { t: "Admin / Staff", d: "Visualiza eventos, analiza datos y toma decisiones.", ancla: () => new THREE.Vector3(8.9, PISO + 1.9, 4.3), dur: 3.8, toma: [8.5, 1.4, 4, 3.6] },
];
const INICIOS = ESTACIONES.reduce((a, e, i) => (a.push((a[i - 1] ?? 0) + (i ? ESTACIONES[i - 1].dur : 0)), a), []);
const TOTAL = INICIOS[5] + ESTACIONES[5].dur;
const etiquetas = ESTACIONES.map((e, i) => {
  const el = document.createElement("div"); el.className = "eti3d";
  el.innerHTML = `<i class="eti3d__linea"></i><div class="eti3d__caja"><span class="eti3d__n">0${i + 1}</span><span class="eti3d__txt"><b>${e.t}</b><em>${e.d}</em></span></div>`;
  capa.appendChild(el); return el;
});
const tag = (txt, extra = "") => { const el = document.createElement("span"); el.className = "tag3d " + extra; el.textContent = txt; capa.appendChild(el); return el; };
const tags = [tag("Persona"), tag("Persona"), tag("Persona"), tag("Montacargas")];
tags[3].style.setProperty("--c", "#ED6A14");
const tagAlerta = tag("Riesgo persona–vehículo", "tag3d--alerta");
const proy = new THREE.Vector3();
function aPantalla(v, el, w, h, margen = 0) { proy.copy(v).project(camara); let x = (proy.x * .5 + .5) * w; const y = (-proy.y * .5 + .5) * h; if (margen) x = Math.min(x, w - margen); el.style.setProperty("--x", x.toFixed(1) + "px"); el.style.setProperty("--y", y.toFixed(1) + "px"); return x > -40 && x < w + 40 && y > -40 && y < h + 40; }

/* ── El monitor del dashboard: el video real con sus detecciones ── */
const video = Object.assign(document.createElement("video"), { muted: true, loop: true, playsInline: true, preload: "auto", src: "recursos/video/despacho.mp4?v=5" });
const feed = Object.assign(document.createElement("canvas"), { width: 600, height: 338 });
function pintarPantalla(hora) {
  const c = lienzoPantalla.getContext("2d"), W = 960, H = 560;
  c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#F5F5F7"; c.fillRect(0, 0, W, 58);
  c.fillStyle = "#ED6A14"; c.beginPath(); c.arc(38, 29, 10, 0, 7); c.fill();
  c.fillStyle = "#0B131B"; c.font = "600 22px -apple-system, Inter, system-ui, sans-serif"; c.fillText("Lumina", 58, 37);
  c.fillStyle = "#5E6A71"; c.font = "500 18px -apple-system, Inter, system-ui, sans-serif"; c.fillText("Hallazgos · en vivo", 150, 36);
  if (video.readyState >= 2) {
    const f = feed.getContext("2d"), s = Math.max(600 / video.videoWidth, 338 / video.videoHeight);
    f.drawImage(video, (600 - video.videoWidth * s) / 2, (338 - video.videoHeight * s) / 2, video.videoWidth * s, video.videoHeight * s);
    const M = L.mapa(600, 338), lista = L.cajas(video.currentTime); L.dibujarRiesgo(f, M, lista, 1, performance.now() / 1000, .7); L.dibujarCajas(f, M, lista, 1, .7);
    c.save(); c.beginPath(); c.roundRect ? c.roundRect(28, 82, 600, 338, 16) : c.rect(28, 82, 600, 338); c.clip(); c.drawImage(feed, 28, 82); c.restore();
  }
  c.fillStyle = "#F5F5F7"; c.beginPath(); c.roundRect ? c.roundRect(652, 82, 280, 338, 16) : c.rect(652, 82, 280, 338); c.fill();
  c.fillStyle = "rgba(229,72,77,.14)"; c.beginPath(); c.roundRect ? c.roundRect(674, 104, 86, 30, 8) : c.rect(674, 104, 86, 30); c.fill();
  c.fillStyle = "#C4282E"; c.font = "600 17px -apple-system, Inter, system-ui, sans-serif"; c.fillText("Crítica", 688, 125);
  c.fillStyle = "#0B131B"; c.font = "600 25px -apple-system, Inter, system-ui, sans-serif"; c.fillText("Riesgo", 674, 178); c.fillText("persona–vehículo", 674, 208);
  [["Zona", "Despacho"], ["Cámara", "CAM 02"], ["Hora", hora]].forEach(([k, v], i) => { c.fillStyle = "#5E6A71"; c.font = "500 17px -apple-system, Inter, system-ui, sans-serif"; c.fillText(k, 674, 262 + i * 46); c.fillStyle = "#0B131B"; c.font = "600 18px -apple-system, Inter, system-ui, sans-serif"; c.fillText(v, 674, 284 + i * 46); });
  [["Cámaras activas", "12"], ["Eventos hoy", String(eventos)], ["Críticos", "03"]].forEach(([k, v], i) => { const x = 28 + i * 304; c.fillStyle = "#F5F5F7"; c.beginPath(); c.roundRect ? c.roundRect(x, 442, 290, 92, 14) : c.rect(x, 442, 290, 92); c.fill(); c.fillStyle = "#5E6A71"; c.font = "500 17px -apple-system, Inter, system-ui, sans-serif"; c.fillText(k, x + 18, 474); c.fillStyle = "#0B131B"; c.font = "600 34px -apple-system, Inter, system-ui, sans-serif"; c.fillText(v, x + 18, 516); });
  texPantalla.needsUpdate = true;
}
function pintarCurva(k) {
  const c = lienzoCurva.getContext("2d"), W = 420, H = 260, B = [.35, .52, .44, .7, .58, .82, .66];
  c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#0B131B"; c.font = "600 20px -apple-system, Inter, system-ui, sans-serif"; c.fillText("Eventos por semana", 22, 38);
  B.forEach((b, i) => { const h = b * 160 * (i < B.length - 1 ? 1 : eo(k)); c.fillStyle = i === B.length - 1 ? "#ED6A14" : "#D9DCDE"; c.fillRect(26 + i * 54, 232 - h, 36, h); });
  texCurva.needsUpdate = true;
}


/* ── La cámara de la maqueta: viaja de toma en toma; arrastrar la inclina un poco ── */
const DIR = new THREE.Vector3(.78, .92, 1).normalize();
const GENERAL = [.9, 1.5, .9, 7.8];
const toma = { c: new THREE.Vector3(.9, 1.5, .9), t: 7.8 }, tomaMeta = { c: new THREE.Vector3(), t: 9.5 };
let giro = 0, giroVel = 0, arrastre = null;
lienzo.addEventListener("pointerdown", (e) => { arrastre = { x: e.clientX, g: giro }; lienzo.setPointerCapture(e.pointerId); });
lienzo.addEventListener("pointermove", (e) => { if (arrastre) giro = clamp(arrastre.g + (e.clientX - arrastre.x) / 900, -.22, .22); });
lienzo.addEventListener("pointerup", () => (arrastre = null));
function encuadrar(w, h) {
  const asp = w / h, mitad = asp >= 1.3 ? toma.t : toma.t * Math.max(1, 1.05 / asp * (asp < .8 ? .9 : 1));
  camara.left = -mitad * asp; camara.right = mitad * asp; camara.top = mitad; camara.bottom = -mitad; camara.updateProjectionMatrix();
  const d = DIR.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), giro);
  camara.position.copy(toma.c).addScaledVector(d, 40); camara.lookAt(toma.c);
}

/* ── El reloj del recorrido: todo depende de T, así un clic deja la planta coherente ── */
let T = 0, previo = performance.now(), eventos = 27, ultimoEvento = -1, estacion = -1, visible = false;
const tramoScroll = document.getElementById("recorrido");
// el scroll maneja el recorrido: 0 al entrar al tramo fijo, TOTAL al salir; T lo sigue con suavidad
const metaScroll = () => { const r = tramoScroll.getBoundingClientRect(); return clamp(-(r.top - 64) / Math.max(1, r.height - (innerHeight - 64))) * TOTAL * .9999; };
const estacionDe = (t) => { let i = 0; while (i < 5 && t >= INICIOS[i + 1]) i++; return i; };
const enEstacion = (t, i) => clamp((t - INICIOS[i]) / ESTACIONES[i].dur);
chips.forEach((b, i) => b.addEventListener("click", () => {
  const r = tramoScroll.getBoundingClientRect(), recorrible = r.height - (innerHeight - 64);
  scrollTo({ top: scrollY + r.top - 64 + recorrible * (INICIOS[i] + ESTACIONES[i].dur * .35) / TOTAL, behavior: "smooth" });
}));
// la grúa da una vuelta por recorrido y pasa por el paso de peatones justo cuando cruza la persona
const ALERTA = INICIOS[3] + .45;
const FASE = (() => { let mejor = 0, d = 1e9; for (let u = 0; u < 1; u += .001) { const p = ruta.getPointAt(u); const dd = Math.hypot(p.x + 2.1, p.z - .95) + (p.z > 2 ? 99 : 0); if (dd < d) { d = dd; mejor = u; } } return mejor; })();
const tramoPersona = (t) => { // el peatón: espera, cruza hasta el borde del carril, se detiene con la alerta, termina de cruzar y vuelve
  const P = [[0, 4.9], [7.2, 4.9], [ALERTA, 1.75], [ALERTA + 1.6, 1.75], [ALERTA + 3.8, -.55], [17.6, -.55], [TOTAL - .2, 4.9], [TOTAL, 4.9]];
  for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const k = suave(clamp((t - P[i - 1][0]) / (P[i][0] - P[i - 1][0]))); return [lerp(P[i - 1][1], P[i][1], k), P[i][1] !== P[i - 1][1]]; }
  return [4.9, false];
};

function cuadro() {
  const ahora = performance.now(), dt = Math.min(.05, (ahora - previo) / 1000); previo = ahora;
  if (!L.congelar) { const m = metaScroll(); T += (m - T) * (QUIETO ? 1 : 1 - Math.pow(1 - .09, dt * 60)); }
  const e = estacionDe(T), k = enEstacion(T, e), w = cont.clientWidth, h = cont.clientHeight;
  if (lienzo.width !== Math.round(w * render.getPixelRatio())) render.setSize(w, h, false);

  // la luz: penumbra en 01, se enciende en 02 y queda encendida hasta el final
  const luz = e === 0 ? 0 : e === 1 ? eo(clamp(k * 1.6)) : 1;
  cielo.intensity = lerp(.55, 1.25, luz); sol.intensity = lerp(.55, 1.7, luz); render.toneMappingExposure = lerp(.78, 1.02, luz);
  foco.intensity = 9 * luz; cono.material.uniforms.uLuz.value = luz;
  const barrido = e === 1 ? Math.sin(k * Math.PI * 1.5) * (1 - k) : 0;
  foco.target.position.copy(MIRA).add(new THREE.Vector3(barrido * 3.2, 0, -barrido * 1.2));
  const dirFoco = foco.target.position.clone().sub(LENTE), largo = dirFoco.length() * 1.18;
  cono.position.copy(LENTE); cono.lookAt(foco.target.position); cono.scale.set(Math.tan(foco.angle) * largo, Math.tan(foco.angle) * largo, largo);
  cuerpoCam.lookAt(foco.target.position);

  // grúa y personas
  const u = (T / TOTAL + FASE - ALERTA / TOTAL + 1) % 1, p = ruta.getPointAt(u), tg = ruta.getTangentAt(u);
  montacargas.position.set(p.x, PISO, p.z); montacargas.rotation.y = Math.atan2(-tg.z, tg.x);
  const [z1, camina] = tramoPersona(T);
  gente[0].position.set(-2.1, PISO + (camina ? Math.abs(Math.sin(ahora / 160)) * .04 : 0), z1);
  gente[1].position.set(-6.6, PISO, -2.75); gente[1].rotation.z = Math.sin(ahora / 900) * .05;
  gente[2].position.set(.2 + Math.sin(ahora / 2400) * .7, PISO, -3.75);

  // detecciones: solo lo que la luz alcanza
  const cosC = Math.cos(foco.angle * 1.02), dN = dirFoco.clone().normalize();
  [...gente, montacargas].forEach((o, i) => {
    const centro = o.position.clone().setY(PISO + (i === 3 ? 1 : .7)), v = centro.clone().sub(LENTE).normalize();
    const dentro = v.dot(dN) > cosC ? 1 : 0, m = marcos[i];
    m.material.opacity += ((luz > .6 ? dentro : 0) - m.material.opacity) * .15;
    m.position.copy(centro); m.rotation.y = o.rotation.y;
    o.userData.visto = m.material.opacity > .5;
  });

  // la alerta: la distancia real entre la grúa y el peatón
  const cerca = montacargas.position.distanceTo(gente[0].position) < 2.3 && luz > .6;
  if (cerca && ultimoEvento < 0) { ultimoEvento = ahora; anillo.position.set(gente[0].position.x, PISO + .02, gente[0].position.z); }
  const tA = ultimoEvento > 0 ? (ahora - ultimoEvento) / 1000 : 99;
  anillo.scale.setScalar(1 + eo(clamp(tA / 1.4)) * 2.4); anillo.material.opacity = tA < 1.4 ? 1 - tA / 1.4 : 0;
  const destello = tA < 3.2 ? (Math.sin(tA * 14) * .5 + .5) * (1 - tA / 3.2) : 0;
  mat.baliza.emissiveIntensity = .1 + destello * 2.2; luzBaliza.intensity = destello * 6;
  if (tA > 3.2 && !cerca) ultimoEvento = -1;
  marcos[0].material.color.set(tA < 3 ? 0xE5484D : C.ambar); marcos[3].material.color.set(tA < 3 ? 0xE5484D : C.ambar);

  const abierta = e === 2 ? eo(clamp(k * 2)) * (1 - clamp((k - .8) * 5)) : 0;
  bisagra.rotation.x = -abierta * 1.1; mat.chip.emissiveIntensity = e === 2 ? .4 + Math.sin(ahora / 90) * .3 + abierta : e > 2 ? .25 : 0;

  // la base de datos suma un disco con el evento
  const kd = e === 3 ? clamp((k - .35) / .5) : e > 3 ? 1 : 0;
  discoNuevo.visible = kd > 0; discoNuevo.position.y = 1.2 + .32 / 2 + (1 - eo(kd)) * 1.6;
  if (e === 3 && k > .85 && estacion === 3 && eventos === 27) eventos = 28;
  if (e === 0) eventos = 27;

  // el punto de luz: recorre el tramo de la estación
  const tramo = e >= 2 ? e - 2 : -1, kt = e === 5 ? clamp(k * 1.6) : eo(clamp(k * 1.25));
  let posPunto = null;
  if (e === 1 && k > .7) posPunto = curvas[0].getPointAt(0);
  else if (tramo >= 0 && tramo < 4) posPunto = curvas[tramo].getPointAt(kt);
  if (e === 5 && k > .62) posPunto = curvas[4].getPointAt(eo(clamp((k - .62) / .38)));
  punto.visible = !!posPunto; if (posPunto) punto.position.copy(posPunto); halo.scale.setScalar(1.1 + Math.sin(ahora / 120) * .15);
  estela.forEach((s, i) => { const c = e === 5 && k > .62 ? curvas[4] : tramo >= 0 && tramo < 4 ? curvas[tramo] : null, q = e === 5 && k > .62 ? eo(clamp((k - .62) / .38)) : kt; s.visible = !!c && q > .02; if (c) s.position.copy(c.getPointAt(clamp(q - (i + 1) * .018))); });
  if (e === 5 && k > .97 && ultimoEvento < 0) { ultimoEvento = ahora - 1600; anillo.position.set(BALIZA.x, PISO + .02, BALIZA.z); }
  mat.telefono.emissiveIntensity = e === 5 && k > .2 && k < .7 ? .8 + Math.sin(ahora / 70) * .6 : 0;

  // pantallas
  if (Math.floor(ahora / 80) !== cuadro.ultimaPantalla) { cuadro.ultimaPantalla = Math.floor(ahora / 80); pintarPantalla(L.hora()); pintarCurva(e === 5 ? clamp(k * 1.5) : e < 5 ? 0 : 1); }

  // la toma: cada estación tiene su encuadre; la última vuelve a la vista general
  let t = ESTACIONES[e].toma; t = typeof t === "function" ? t() : t;
  if (e === 5 && k > .6) t = GENERAL;
  if (e === 0 && k < .5) t = GENERAL;
  tomaMeta.c.set(t[0], t[1], t[2]); tomaMeta.t = t[3];
  const s = 1 - Math.pow(1 - .045, dt * 60); toma.c.lerp(tomaMeta.c, s); toma.t = lerp(toma.t, tomaMeta.t, s);
  if (!arrastre) { giroVel += -giro * .02; giroVel *= .86; giro += giroVel; }
  encuadrar(w, h);
  render.render(escena, camara);

  // etiquetas y estado de los chips
  etiquetas.forEach((el, i) => { el.classList.toggle("activo", i === e); el.style.display = aPantalla(ESTACIONES[i].ancla(), el, w, h, i === e ? (w < 700 ? 200 : 320) : 0) ? "" : "none"; });
  [...gente, montacargas].forEach((o, i) => { const on = o.userData.visto && e >= 1 && e <= 3 && !(i === 1 && w < 700) && !(tA < 2.6 && (i === 0 || i === 3)); tags[i].classList.toggle("on", on); if (on) aPantalla(o.position.clone().setY(PISO + (i === 3 ? 2.2 : 1.55)), tags[i], w, h); });
  tagAlerta.classList.toggle("on", tA < 2.6 && e >= 3 && e <= 3 + 1); aPantalla(gente[0].position.clone().setY(PISO + 2.4), tagAlerta, w, h);
  if (e !== estacion) {
    estacion = e; chips.forEach((c, j) => { c.classList.toggle("activo", j === e); c.setAttribute("aria-selected", j === e); });
    if (textoMovil) textoMovil.innerHTML = `<b>${ESTACIONES[e].t}</b> ${ESTACIONES[e].d}`;
  }
  chips[e].style.setProperty("--prog", k);
}

/* ── Solo dibuja cuando se ve ── */
let raf = 0;
const bucle = () => { if (!visible) return; raf = requestAnimationFrame(bucle); cuadro(); };
new IntersectionObserver(([en]) => {
  visible = en.isIntersecting;
  if (visible) { previo = performance.now(); video.play().catch(() => {}); cancelAnimationFrame(raf); raf = requestAnimationFrame(bucle); } else video.pause();
}, { threshold: 0 }).observe(cont);
cuadro();
cont.classList.add("lista"); document.getElementById("maqueta-cargando")?.remove();
// para revisar: salta a una estación y a un punto dentro de ella (0 a 1)
L.maquetaIr = (i, k = .5) => { L.congelar = false; T = INICIOS[i] + ESTACIONES[i].dur * k - 1.2; for (let n = 0; n < 75; n++) { previo = performance.now() - 16; cuadro(); } L.congelar = true; };
