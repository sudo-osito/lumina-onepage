# Lumina · one-page

Página de una sola vista para Lumina, el servicio de visión artificial con IA de Optimizo (antes «Cámaras con IA» de Neisstech). Mismo esqueleto que la one-page de Médula y la v6 de Optimizo (siempre clara, retícula de cuatro columnas, texto que se escribe), con la identidad de Lumina: ámbar `#FFAE1A` (claro `#FFD37A`, hondo `#F08A00`, texto `#A35C00`), tinta de Optimizo y SF.

- **En línea:** https://sudo-osito.github.io/lumina-onepage/ (GitHub Pages, rama `main`; cada push republica).
- **Local:** `python3 -m http.server 4412 --bind 127.0.0.1` → http://127.0.0.1:4412/
- **CTA:** siempre «Agenda tu Discovery» (regla de Max). Todos llevan al cierre (`#discovery`), y el del cierre abre WhatsApp +56 9 5708 0410 con el mensaje del Discovery.
- **Textos:** narrativa de Optimizo V1.0 (C: héroe · A: cierre · D: frase) + contenido de https://neisstech-camaras-ia.netlify.app/. Lo que es demo está marcado como ilustrativo.
- **Cámaras (v2):** 4 clips, uno por aplicación. Despacho (persona–vehículo) es el video de la v6. EPP, zona restringida y patio de camiones son de Mixkit (licencia libre: 46753, 23378, 23852). Detecciones reales: personas con Apple Vision (`VNDetectHumanRectanglesRequest`) y el camión seguido con `VNTrackObjectRequest`, a 25 cuadros por segundo (`recursos/video/detecciones.js`). El casco es la parte de arriba de la caja de la persona y la zona restringida está dibujada a mano: son ilustrativos.
- **Recorrido (v2):** banner con las 4 cámaras en vivo y la franja para elegirlas → frase (desafío + D) → cómo funciona en 5 paradas que se despliegan (cámaras, procesamiento IA con Edge/Cloud, respuesta en terreno, plataforma, tu equipo) → metodología → preguntas → cierre. ~5.500 px en escritorio (la v1 tenía 11.000).
- **Logo:** provisorio (lente + punto de luz), el mismo de la v6 de Optimizo.
