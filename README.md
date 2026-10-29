# Lumina · one-page

Página de una sola vista para Lumina, el servicio de visión artificial con IA de Optimizo (antes «Cámaras con IA» de Neisstech). Mismo esqueleto que la one-page de Médula y la v6 de Optimizo (siempre clara, retícula de cuatro columnas, texto que se escribe), con la identidad de Lumina: ámbar `#FFAE1A` (claro `#FFD37A`, hondo `#F08A00`, texto `#A35C00`), tinta de Optimizo y SF.

- **En línea:** https://sudo-osito.github.io/lumina-onepage/ (GitHub Pages, rama `main`; cada push republica).
- **Local:** `python3 -m http.server 4412 --bind 127.0.0.1` → http://127.0.0.1:4412/
- **CTA:** siempre «Agenda tu Discovery» (regla de Max). Todos llevan al cierre (`#discovery`), y el del cierre abre WhatsApp +56 9 5708 0410 con el mensaje del Discovery.
- **Textos:** narrativa de Optimizo V1.0 (C: héroe · A: cierre · D: frase) + contenido de https://neisstech-camaras-ia.netlify.app/. Lo que es demo está marcado como ilustrativo.
- **Cámaras (v3):** 4 clips de CCTV real, uno por aplicación, sacados de YouTube por pedido de Max (videos demo de cámaras de seguridad; **son de terceros, hay que reemplazarlos por material propio o con permiso antes de lanzar en serio**):
  - CAM 01 · EPP: `8DJi4PrdFCg` (planta, CCTVDOC), seg 2–11. Chaleco medido por color de alta visibilidad en el torso de cada persona, estable con ventana de ±0,5 s; si no se ve, «Revisar EPP».
  - CAM 02 · Persona–vehículo: el video de la v6 con sus detecciones.
  - CAM 03 · Zona restringida: `G8z74loJO7U` (ClearPix Warehouse Dock), seg 1–7. Zona dibujada a mano (en cada instalación se define); la entrada se calcula con los pies de la persona.
  - CAM 04 · Tráfico interno: `rry9LbJlGa0` (ClearPix Warehouse Fork Lift), seg 9–17. Montacargas seguido con Apple Vision y su ruta real dibujada.
  - Personas: YOLO11m + ByteTrack (Ultralytics), en un entorno temporal que se borró después. Para regenerar: `uv venv` + `uv pip install ultralytics lap` y los scripts de la sesión (`yolo.py`, `chaleco.py`, `detectar.swift`). Todo queda en `recursos/video/detecciones.js`.
- **Recorrido (v2):** banner con las 4 cámaras en vivo y la franja para elegirlas → frase (desafío + D) → cómo funciona en 5 paradas que se despliegan (cámaras, procesamiento IA con Edge/Cloud, respuesta en terreno, plataforma, tu equipo) → metodología → preguntas → cierre. ~5.500 px en escritorio (la v1 tenía 11.000).
- **Logo:** provisorio (lente + punto de luz), el mismo de la v6 de Optimizo.
