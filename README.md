# PreU Perú AI

Aplicación web adaptable para preparar postulantes a universidades del Perú.

## Universidades
- UNDAC
- UNEVHAL
- UNMSM
- UNI
- UNFV (Villarreal)

## Funciones disponibles
- Panel principal con resumen del banco.
- Banco de preguntas por universidad y curso.
- Registro manual de preguntas con cinco alternativas.
- Importación de preguntas desde Excel (.xlsx / .xls) y CSV.
- Descarga de plantilla Excel.
- Búsqueda y filtro por curso.
- Simulacro de hasta 10 preguntas con resultado.
- Diseño adaptable a computadora y celular.

## Formato del Excel
La primera hoja debe tener estos encabezados:
`universidad, curso, pregunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, respuesta, explicacion, dificultad`

La columna `respuesta` debe contener A, B, C, D o E.

## Ejecutar en una computadora
Requiere Node.js instalado:
```bash
npm install
npm run dev
```
Abre la dirección local que Vite muestra en la terminal.

## Publicar en Internet con Vercel
1. Entra en https://vercel.com e inicia sesión con GitHub.
2. Selecciona **Add New → Project**.
3. Importa `kgbkepler007-creator/preu-peru-ai`.
4. Framework: Vite; Build Command: `npm run build`; Output Directory: `dist`.
5. Pulsa **Deploy**.

## Almacenamiento
Esta primera versión guarda las preguntas en el almacenamiento local del navegador (localStorage). Los datos se mantienen en ese navegador y computadora. Para compartir automáticamente el mismo banco entre varios dispositivos, se debe conectar una base de datos en la nube en una siguiente etapa.
