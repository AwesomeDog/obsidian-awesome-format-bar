# Awesome Format Bar —— una barra de formato Markdown al estilo de Word para Obsidian

> Negrita, cursiva, subrayado, resaltado, fuente, títulos, listas, tablas, recuadros y emoji —— **con solo hacer clic en botones, sin escribir sintaxis Markdown**.

[![Obsidian](https://img.shields.io/badge/Obsidian-1.13.7%2B-7C3AED)](https://obsidian.md)
[![GitHub release](https://img.shields.io/github/v/release/AwesomeDog/obsidian-awesome-format-bar)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/releases/latest)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&query=%24%5B%22awesome-format-bar%22%5D.downloads&label=downloads&color=573E7A)](https://obsidian.md/plugins?id=awesome-format-bar)
[![Commands](https://img.shields.io/badge/commands-100+-informational)](#full-command-reference)
[![i18n](https://img.shields.io/badge/languages-9-success)]()
[![Stars](https://img.shields.io/github/stars/AwesomeDog/obsidian-awesome-format-bar?style=social)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/stargazers)

[English](../../README.md) · **Español** (esta página) —— Esta página es una traducción del README en inglés, **la versión en inglés es la referencia**.

🌍 La interfaz admite nueve idiomas —— **English、简体中文、繁體中文、日本語、한국어、Deutsch、Français、Español、Русский** —— y sigue automáticamente el idioma de Obsidian.

**Awesome Format Bar** es un **plugin de barra de formato（cinta）para [Obsidian](https://obsidian.md)**. Superpone una **barra de herramientas** conocida, parecida a la de Word, sobre tus notas, para que el formato diario quede a un clic de distancia, mientras tu biblioteca sigue siendo 100 % texto plano.

Todo lo que escribe la barra es **Markdown estándar**, **Markdown con sabor a Obsidian** o ——cuando Markdown sencillamente no tiene sintaxis（subrayado, superíndice, subíndice, alineación del texto, color del texto, fuente, tamaño de fuente）—— una pequeña cantidad de **HTML en línea** que Obsidian renderiza de forma nativa.

*¿Buscas un **plugin de barra de herramientas para Obsidian**, una **barra de formato**, una **barra del editor**, una **barra de edición tipo texto enriquecido / WYSIWYG**, **botones de formato Markdown**, un **selector de emoji**, un **editor de tablas** o una **cinta tipo Microsoft Word para Obsidian**? Es este plugin.*

<p align="center">
  <img src="../img/light.png" alt="Awesome Format Bar para Obsidian —— barra de formato Markdown al estilo de Word, con Negrita, Cursiva, Subrayado, Resaltar, Color de fuente, Títulos, Listas y Tablas (tema claro)">
</p>

---

## Índice

- [Por qué una barra de formato en Obsidian](#por-qué-una-barra-de-formato-en-obsidian)
- [De un vistazo](#de-un-vistazo)
- [Funciones](#funciones)
- [Referencia completa de comandos](#referencia-completa-de-comandos)
- [Instalación](#instalación)
- [Primeros pasos](#primeros-pasos)
- [Ajustes](#ajustes)
- [Compatibilidad](#compatibilidad)
- [Preguntas frecuentes](#preguntas-frecuentes)
- [Desarrollo](#desarrollo)
- [Publicación](#publicación)
- [Palabras clave](#palabras-clave)

---

## Por qué una barra de formato en Obsidian

Obsidian es rápido **si** ya hablas Markdown. Para todos los demás ——estudiantes, escritores que vienen de Word o Google Docs, equipos que incorporan a nuevos usuarios—— la sintaxis es un muro.

- **Nada de sintaxis que memorizar.** Selecciona el texto, haz clic en **Negrita**. Y ya está.
- **La terminología de Word que ya conoces.** Pestañas Inicio / Insertar / Vista / Tabla, «Borrar formato», «Cambiar mayúsculas y minúsculas», «Panel de navegación».
- **Descubre lo que Obsidian sabe hacer.** Los recuadros, las referencias de bloque, los elementos incrustados, los bloques de fórmula y las etiquetas tienen botón; funciones que muchos usuarios nunca encuentran en la sintaxis.
- **Haz lo que Markdown no puede.** Subrayado, superíndice, subíndice, alineación de párrafo, colores de texto y de resaltado, fuente y tamaño de fuente, escritos como HTML en línea limpio.
- **Texto plano para siempre.** Nada de formato propietario, ni base de datos, ni cautividad: tus notas siguen siendo simples archivos `.md`.
- **Sin conexión y privado.** Sin llamadas de red, sin cuentas, sin telemetría. La biblioteca de unos 2.150 emoji viaja dentro del plugin.
- **También para el teclado.** Desactiva las tres posiciones de la barra y la interfaz desaparece por completo: los 105 comandos registrados en la paleta siguen disponibles y puedes asignarles tus propios atajos.

## De un vistazo

|                     |                                                                          |
| ------------------- | ------------------------------------------------------------------------ |
| **Posiciones**      | Cinta superior, barra flotante sobre la selección, barra inferior fija —— combinables libremente |
| **Comandos**        | **115** integrados, **105** disponibles en la paleta de comandos para atajos propios |
| **Pestañas**        | Inicio · Insertar · Vista · Tabla · Utilidades · **Anclado**               |
| **Recuadros**       | Los 12 tipos de recuadro de Obsidian en un solo desplegable               |
| **Emoji y símbolos** | Unos 2.150 emoji, kaomoji y símbolos, totalmente sin conexión            |
| **Edición de tablas** | Insertar / eliminar / mover filas y columnas, alinear, ordenar, reformatear, pegar como tabla |
| **Botones propios** | Ancla **cualquier** comando: del núcleo, de este plugin o de otro         |
| **Configuración**   | Ninguna. Se adapta al tema, listo para usar                               |
| **Requiere**        | Obsidian **1.13.7 o superior**                                            |

---

## Funciones

### 🧭 Tres posiciones de barra, combinables libremente

- **Cinta（Superior）** —— la barra completa con pestañas, fijada encima del editor. *Activa por defecto.*
- **Flotante** —— una barra compacta que aparece sobre la selección actual, como la barra de selección de Word o Google Docs.
- **Inferior** —— una barra compacta fijada en la parte inferior del editor.

Cada posición se activa de forma independiente, así que puedes usar solo la barra flotante, solo la cinta o las tres a la vez.

### 🅰️ 115 comandos de formato en una distribución conocida

Negrita, cursiva, subrayado, tachado, código en línea, fórmula en línea, resaltar（con color）, color de fuente, **fuente**, **tamaño de fuente**, borrar formato, cambiar mayúsculas y minúsculas, títulos 1–6, viñetas / numeración / lista de tareas, cita, sangría, línea horizontal, deshacer / rehacer, buscar y reemplazar, alineación de párrafo —— agrupados exactamente donde un usuario de Word los espera.

### 💬 Selector de recuadros —— los 12 tipos de Obsidian

Un solo botón **Recuadro** abre un desplegable con `note`、`abstract`、`info`、`tip`、`success`、`question`、`warning`、`failure`、`danger`、`bug`、`example` y `quote`. Se acabó buscar cómo se escribe `> [!tip]`.

### 😀 Selector de emoji, kaomoji y símbolos sin conexión（unos 2.150）

Un panel **Emoji y símbolos** con búsqueda y tres fuentes ——emoji, kaomoji y símbolos tipográficos—— incluidas con el plugin. Inserta en el cursor o sobre la selección como un único paso de deshacer, mantiene un grupo de *uso frecuente* por fuente y sigue abierto para insertar varios caracteres seguidos.

### 📊 Editor de tablas Markdown

Inserta y elimina filas y columnas, muévelas, alinea las columnas a la izquierda / centro / derecha, ordena filas, reformatea（embellece）las tablas —— más **Pegar como tabla**, que convierte el texto del portapapeles separado por tabulaciones o comas（recién salido de Excel, Numbers o Google Sheets）en una tabla Markdown alineada.

### 📌 Ancla cualquier comando —— incluidos los de otros plugins

La pestaña **Anclado** convierte la barra en tu propio lanzador: elige cualquier comando de la paleta de comandos（del núcleo de Obsidian, de otro plugin de la comunidad o de este）, escoge un icono y arrastra para reordenar. Si el plugin de origen está desactivado, el botón simplemente se atenúa; tu anclado se conserva.

### 👁️ Herramientas de lectura, enfoque y esquema

**Mostrar espacios**（puntos para los espacios, flechas para las tabulaciones, marcas naranjas para los espacios duros / ideográficos / EN y EM）, **Mostrar números de línea**, **Ancho de línea legible**, **Panel de navegación**（el esquema de Obsidian）, **Acercar / Alejar / 100 %**, **Dividir a la derecha / Dividir hacia abajo**, **Contraer / Expandir（todo）**, **Modo de enfoque**（contrae ambas barras laterales）, **Modo zen**（pantalla completa real）y **Modo máquina de escribir**（la línea del cursor se fija en el centro, resaltada y el resto atenuado）.

### 📑 Índice en un clic

**Índice** escribe el esquema de tu nota después del párrafo donde está el cursor: un título en negrita `**Índice**` y, debajo, un enlace anidado `- [[#Título|Título]]` por cada título. Los títulos dentro de un bloque de código o citados dentro de un recuadro se ignoran. Es una instantánea, no un campo dinámico: vuelve a generarlo después de editar y borra el anterior.

### 🧹 Utilidades de líneas y listas

**Combinar líneas**, **Dividir líneas**（por el signo de puntuación más frecuente en la selección）, **Invertir líneas** ——ninguna de las tres cruza una línea en blanco ni un bloque de código—— más **Ordenar lista**（nivel por nivel, conservando hijos y cuerpo, y renumerando los elementos ordenados）y **Ordenar títulos**（reordena el esquema y se lleva consigo el cuerpo de cada sección）.

### 🎨 Configuración cero, se adapta al tema

Distribución fija y cuidada que hereda tu tema activo de Obsidian en modo claro y oscuro. Lo único que tienes que organizar tú es la pestaña Anclado.

---

## Referencia completa de comandos

105 de los 115 comandos están registrados en la **paleta de comandos**, así que puedes asignarles tus propios atajos de teclado. （Los contenedores desplegables y el panel de emoji y símbolos solo existen en la barra.）

### Inicio

- **Portapapeles** —— Pegar, Cortar, Copiar, Pegar como texto sin formato
- **Fuente** —— Fuente, Tamaño de fuente, Negrita, Cursiva, Subrayado, Tachado, Subíndice, Superíndice, Código en línea, Fórmula en línea, Resaltar, Color de resaltado, Color de fuente, Borrar formato, Cambiar mayúsculas y minúsculas
- **Párrafo** —— Viñetas / Numeración / Lista de tareas, Cita, Reducir / Aumentar sangría, Volver a numerar la lista, Ordenar párrafos, Subir una línea / Bajar una línea, Alinear a la izquierda / Centrar / Alinear a la derecha / Justificar, Línea horizontal
- **Estilos** —— Título 1–6, Quitar título
- **Edición** —— Deshacer, Rehacer, Buscar y reemplazar

### Insertar

Vínculo interno, Vínculo externo, Incrustar, Etiqueta, Referencia de bloque, **Recuadro ▼**（Nota, Resumen, Información, Sugerencia, Éxito, Pregunta, Advertencia, Fallo, Peligro, Error, Ejemplo, Cita）, Bloque de código, Bloque de fórmula, Tabla, Convertir texto en tabla, Comentario, Adjuntar archivo, **Emoji y símbolos**, Fecha y hora, **Índice**, Nota al pie.

### Vista

- **Mostrar** —— Mostrar espacios, Mostrar números de línea, Ancho de línea legible, Panel de navegación（el esquema de Obsidian）
- **Zoom** —— Acercar, Alejar, 100 %
- **Ventana** —— Dividir a la derecha, Dividir hacia abajo
- **Esquema** —— Contraer, Expandir, Contraer todo, Expandir todo
- **Inmersión** —— Modo de enfoque, Modo zen, Modo máquina de escribir

### Tabla

Disponible siempre que el cursor esté dentro de una tabla: Eliminar filas o columnas, Insertar filas arriba / abajo, Insertar columnas a la izquierda / derecha, Mover fila hacia arriba / abajo, Mover columna hacia la izquierda / derecha, Dar formato a las tablas, Alinear columna a la izquierda / Centrar columna / Alinear columna a la derecha, Ordenar filas, **Convertir en texto**.
**Convertir en texto** escribe la tabla como líneas separadas por tabulaciones ——exactamente lo inverso de **Convertir texto en tabla**（Insertar · Bloques）, que convierte texto separado por tabulaciones o comas en una tabla Markdown alineada. **Pegar como tabla** hace lo mismo con el portapapeles y funciona en cualquier lugar.

### Utilidades

**Combinar líneas** une una serie de líneas en una sola; **Dividir líneas** las parte por el signo de puntuación más frecuente en la selección; **Invertir líneas** da la vuelta al orden de cada serie. Ninguna de las tres cruza una línea en blanco ni un bloque de código.
**Ordenar lista** ordena una lista nivel por nivel ——cada elemento conserva su cuerpo y sus hijos, y los elementos ordenados salen renumerados——. **Ordenar títulos** reordena cada nivel del esquema de la nota y se lleva consigo el cuerpo de cada sección.
**Pegar URI como vínculo** envuelve el texto seleccionado con la URI del portapapeles. **Puntuación inteligente** y **Espaciado CJK** normalizan el texto seleccionado, mientras **Limpiar** agrupa en un menú las acciones habituales de limpieza de Markdown.

### Anclado

Tus propios comandos, con tus propios iconos. Consulta [Primeros pasos](#primeros-pasos).

### Panel de emoji y símbolos

| Fuente  | Entradas（aprox.） | Grupos de ejemplo                                     |
| ------- | ----------------- | ----------------------------------------------------- |
| Emoji   | ~1.900            | Caras y personas, Animales y naturaleza, Comida y bebida, Objetos, Banderas |
| Kaomoji | ~70               | Emoción, Animales, Comportamiento, Personas, Festivos  |
| Símbolos | ~200             | Flechas, Matemáticos, Tipográficos, Monedas, Cerrados, Dingbats |

Todos los datos viajan dentro del plugin, así que el selector funciona totalmente sin conexión.

---

## Instalación

Requiere Obsidian **1.13.7 o posterior**.

**Desde la comunidad de plugins（recomendado）**
Configuración → **Plugins de la comunidad** → **Explorar** → busca **“Awesome Format Bar”** → **Instalar** → **Habilitar**.

**Con BRAT（versiones beta）**
Instala [BRAT](https://github.com/TfTHacker/obsidian42-brat), ejecuta *BRAT: Add a beta plugin* y pega la URL de este repositorio.

**Manualmente**
Descarga `main.js`, `manifest.json` y `styles.css` de una versión publicada y colócalos en `<biblioteca>/.obsidian/plugins/awesome-format-bar/`; luego habilita el plugin en Configuración → Plugins de la comunidad.

## Primeros pasos

1. Abre **Configuración → Awesome Format Bar** y activa las posiciones que quieras: **Superior**, **Flotante**, **Inferior**.
2. La **cinta（Superior）** tiene seis pestañas; la última, **Anclado**, guarda los comandos que ancles tú. Mientras está vacía muestra un aviso que te devuelve a Configuración.
3. Las **barras compactas**（Flotante / Inferior）llevan un subconjunto fijo de comandos; lo que no cabe se recoge en el menú de desbordamiento `⋯`.
4. Ancla comandos en **Configuración → Anclado**: agregar（elige un comando y luego un icono）, cambiar el icono, arrastrar para reordenar o eliminar. Los comandos anclados se comportan exactamente igual que en la paleta de comandos.
5. ¿Prefieres el teclado? Desactiva **los tres interruptores de posición** y la barra desaparece por completo de la interfaz ——el plugin no añade nada a tu pantalla——, mientras los **105 comandos registrados en la paleta** siguen funcionando y puedes asignarles tus propios atajos en **Configuración → Atajos de teclado**. Dicho de otro modo: puedes usarlo como un paquete puro de comandos y atajos sin pulsar un solo botón.

## Ajustes

| Sección              | Contenido                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Barra de herramientas** | Interruptores independientes para Superior / Flotante / Inferior                               |
| **Anclado**          | Tus comandos anclados —— agregar, cambiar icono, reordenar, eliminar                                |
| **Tabla**            | Entrar pasa a la fila siguiente; Tab / Shift+Tab cambian entre celdas y Tab en el borde derecho añade una columna; rellenar celdas con espacios; ordenar al hacer clic en el encabezado en el modo de lectura（nunca modifica el archivo） |

## Compatibilidad

- Obsidian **1.13.7 o superior**
- Funciona con el editor Markdown y se adapta a tu tema activo tanto en modo claro como oscuro.
- Sin acceso a la red, sin cuentas, sin telemetría: todo se ejecuta en local.
- La versión publicada son exactamente tres archivos: `main.js`, `manifest.json` y `styles.css`.

---

## Preguntas frecuentes

**¿Esto convierte Obsidian en un editor WYSIWYG o de texto enriquecido?**
No ——y ahí está la gracia——. Es una **barra de herramientas** sobre el propio editor de Obsidian. Tus archivos siguen siendo Markdown plano.

**¿Tengo que aprender sintaxis Markdown para usar Obsidian ahora?**
No. Negrita, títulos, listas, vínculos, tablas, recuadros, bloques de código y fórmulas son botones.

**¿Qué se escribe exactamente en mis notas?**
Markdown estándar y Markdown con sabor a Obsidian. Solo donde Markdown no tiene sintaxis ——subrayado, superíndice, subíndice, alineación de párrafo, colores de texto y de resaltado, fuente y tamaño de fuente—— el plugin emite pequeñas etiquetas HTML en línea estándar, que Obsidian renderiza de forma nativa.

**¿Puedo seguir usando mis atajos de teclado?**
Sí. 105 de los 115 comandos aparecen en la paleta de comandos y se pueden asociar a cualquier atajo.

**Soy de teclado ——¿puedo ocultar la barra por completo?**
Sí, y no pierdes nada por hacerlo. Desactiva las tres posiciones（**Superior / Flotante / Inferior**）en **Configuración → Awesome Format Bar** y el plugin no deja rastro en la pantalla: ni cinta, ni barra flotante, ni barra inferior. Los **105 comandos registrados en la paleta** siguen funcionando todos, desde la paleta de comandos o desde un atajo que asignes en **Configuración → Atajos de teclado** ——incluidos comandos para los que Obsidian no tiene atajo propio, como el color de fuente, el color de resaltado, cambiar mayúsculas y minúsculas, los recuadros, ordenar tablas y las utilidades de líneas——. Piénsalo como una capa opcional solo de teclado que puedes activar cuando el ratón empiece a sentirse lento.

**¿Puedo añadir botones para comandos de otros plugins?**
Sí ——para eso está la pestaña **Anclado**——. Ancla cualquier comando de la paleta y elige un icono. Si el plugin propietario está desactivado, el botón se atenúa y el anclado se conserva.

**¿El selector de emoji necesita conexión a internet?**
No. Los unos 2.150 emoji, kaomoji y símbolos se incluyen con el plugin.

**¿Ordenar una tabla en el modo de lectura modifica mi archivo?**
No. Ordenar al hacer clic en el encabezado en el modo de lectura es solo visual y nunca modifica la nota.

**¿Puedo ocultar la barra cuando quiera una pantalla limpia?**
Sí: desactiva cualquier posición en los ajustes, o las tres para ocultarla del todo（mira la pregunta del teclado para ver qué sigue funcionando）.

**¿Es configurable?**
Deliberadamente mínimo: la distribución es fija y se adapta al tema, así que siempre se ve nativa. La pestaña Anclado es tuya para organizarla.

---

## Desarrollo

```shell
npm install        # instala las dependencias
npm run dev        # compila en modo vigilancia
npm run build      # comprobación de tipos + pruebas + compilación de producción
npm run test       # ejecuta las pruebas unitarias
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run deploy -- /path/to/vault   # copia main.js, manifest.json y styles.css en una biblioteca
```

La versión publicada son exactamente tres archivos: `main.js`, `manifest.json` y `styles.css`.

## Publicación

```shell
npm version patch                    # incrementa package.json, manifest.json y versions.json; confirma y etiqueta
git push origin main --follow-tags   # envía la confirmación y la etiqueta
```

`npm version` exige un árbol de trabajo limpio. La etiqueta no lleva el prefijo `v` ——debe ser igual al `version` de `manifest.json`, o el flujo de publicación la rechazará——.

Al enviar la etiqueta se ejecuta `.github/workflows/release.yml`, que compila el plugin y abre una versión **borrador** con `main.js`, `manifest.json` y `styles.css` adjuntos. Publica el borrador para que la versión esté disponible.

---

## Palabras clave

Plugin de barra de herramientas para Obsidian · barra de formato para Obsidian · barra de formato · barra de herramientas Markdown · botones de formato Markdown · cinta tipo Word para Obsidian · barra de herramientas de texto enriquecido · barra de edición estilo WYSIWYG · barra del editor · barra flotante de selección · color de texto y resaltado en Obsidian · subrayado / superíndice / subíndice en Markdown · alineación del texto · selector de recuadros · selector de emoji · kaomoji · selector de símbolos · editor de tablas Markdown · ordenar tabla · pegar como tabla · generador de índices · anclar comandos · Obsidian para principiantes · edición Markdown sin sintaxis

**Otros idiomas / Other languages:**
Obsidian 工具栏插件、格式栏、富文本工具栏、Markdown 快捷按钮、表情符号选择器、表格编辑 ·  
Obsidian 工具列外掛、格式列 ·  
Obsidian ツールバー・書式設定バー・絵文字ピッカー ·  
Obsidian 툴바 · 서식 도구 모음 ·  
Obsidian Symbolleiste / Formatierungsleiste ·  
Barre d'outils / barre de mise en forme pour Obsidian ·  
Barra de herramientas / barra de formato para Obsidian  
Панель инструментов / панель форматирования для Obsidian
