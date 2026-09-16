# Awesome Format Bar —— una barra de formato Markdown al estilo de Word para Obsidian

> Negrita, cursiva, subrayado, resaltado, fuente, títulos, listas, tablas, recuadros y emoji —— **con solo hacer clic en botones, sin escribir sintaxis Markdown**.  
> **Sin IA. Sin red. Sin telemetría. Sin cuentas.**

[![Privacy](https://img.shields.io/badge/privacy-no%20AI%20%C2%B7%20no%20network%20%C2%B7%20no%20telemetry-brightgreen)](#compatibility)
[![Last commit](https://img.shields.io/github/last-commit/AwesomeDog/obsidian-awesome-format-bar?label=last%20commit)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/commits/main)
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
- **Tu propio lanzador, si lo quieres.** La pestaña **Anclado** guarda cualquier comando que elijas ——del núcleo, de este plugin o de otro——, así que la barra se adapta a ti sin convertirse en un proyecto de configuración.
- **También para el teclado.** Desactiva las tres posiciones de la barra y la interfaz desaparece por completo: los 126 comandos registrados en la paleta siguen disponibles y puedes asignarles tus propios atajos.

---

## De un vistazo

|                     |                                                                          |
| ------------------- | ------------------------------------------------------------------------ |
| **Posiciones**      | Cinta superior, barra flotante sobre la selección, barra inferior fija —— combinables libremente |
| **Comandos**        | **138** integrados, **126** disponibles en la paleta de comandos para atajos propios |
| **Pestañas**        | Inicio · Insertar · Vista · Tabla · Utilidades · **Anclado**               |
| **Recuadros**       | Los 12 tipos de recuadro de Obsidian en un solo desplegable               |
| **Emoji y símbolos** | Unos 2.150 emoji, kaomoji y símbolos, totalmente sin conexión            |
| **Edición de tablas** | Insertar / eliminar / mover filas y columnas, alinear, ordenar, transponer, reformatear, convertir en texto, pegar como tabla, copiar como CSV |
| **Edición de imágenes** | alinear, tamaño, título |
| **Botones propios** | Pestaña **Anclado** —— ancla **cualquier** comando（del núcleo, de este plugin o de otro）con tus propios iconos y grupos |
| **Configuración**   | Ninguna. Se adapta al tema, listo para usar                               |
| **Requiere**        | Obsidian **1.13.7 o superior**                                            |

---

## Funciones

### 🧭 Tres posiciones de barra, combinables libremente

- **Cinta（Superior）** —— la barra completa con pestañas, fijada encima del editor. *Activa por defecto.*
- **Flotante** —— una barra compacta que aparece sobre la selección actual, como la barra de selección de Word o Google Docs. **La barra Flotante nunca tapa lo que estás editando.**
- **Inferior** —— una barra compacta fijada en la parte inferior del editor.

Cada posición se activa de forma independiente, así que puedes usar solo la barra flotante, solo la cinta o las tres a la vez.

### 🅰️ 138 comandos de formato en una distribución conocida

Negrita, cursiva, subrayado, tachado, código en línea, fórmula en línea, resaltar（con color）, color de fuente, **fuente**, **tamaño de fuente**, borrar formato, cambiar mayúsculas y minúsculas, títulos 1–6, viñetas / numeración / lista de tareas, cita, sangría, línea horizontal, deshacer / rehacer, buscar y reemplazar, alineación de párrafo —— agrupados exactamente donde un usuario de Word los espera.

Las imágenes tienen su propio grupo en **Insertar**: **Tamaño de imagen ▼** fija un ancho de 100–600 px ——o devuelve el tamaño propio del archivo——, y **Título** escribe una línea de título debajo de la imagen y la selecciona, lista para escribir encima.

### 💬 Selector de recuadros —— los 12 tipos de Obsidian

Un solo botón **Recuadro** abre un desplegable con `note`、`abstract`、`info`、`tip`、`success`、`question`、`warning`、`failure`、`danger`、`bug`、`example` y `quote`. Se acabó buscar cómo se escribe `> [!tip]`.

### 😀 Selector de emoji, kaomoji y símbolos sin conexión（unos 2.150）

Un panel **Emoji y símbolos** con búsqueda y tres fuentes ——emoji, kaomoji y símbolos tipográficos—— incluidas con el plugin. Inserta en el cursor o sobre la selección como un único paso de deshacer, mantiene un grupo de *uso frecuente* por fuente y sigue abierto para insertar varios caracteres seguidos.

### 📊 Editor de tablas Markdown

Inserta y elimina filas y columnas, muévelas, alinea las columnas a la izquierda / centro / derecha, ordena las filas de A a Z o de Z a A, transpone tablas, reformatea（embellece）la tabla actual o todas las tablas de la nota y convierte una tabla de nuevo en texto delimitado —— más **Pegar como tabla**, que convierte el texto del portapapeles separado por tabulaciones o comas（recién salido de Excel, Numbers o Google Sheets）en una tabla Markdown alineada, y **Copiar tabla como CSV** para el camino de vuelta a la hoja de cálculo.

Coloca el cursor dentro de una tabla y la cinta cambia por sí sola a la pestaña **Tabla**; si eliges otra pestaña, se queda donde la pusiste. En el **modo de origen**, Entrar pasa a la fila siguiente（añadiendo una al final）y Tab / Shift+Tab recorren las celdas, añadiendo una columna más allá del borde derecho.

### 📌 Ancla cualquier comando —— incluidos los de otros plugins

**Anclado es la única parte de la barra que organizas tú.** Convierte la barra en tu propio lanzador: elige cualquier comando de la paleta de comandos（del núcleo de Obsidian, de otro plugin de la comunidad o de este）, escoge un icono, asígnale un grupo y arrastra para reordenar. Si el plugin de origen está desactivado, el botón simplemente se atenúa; tu anclado se conserva.

Las cinco pestañas integradas cubren lo que la mayoría de la gente usa a menudo. El comando ——o los dos comandos—— sin el que *tú* no puedes vivir suele quedar fuera de ese conjunto, así que, en vez de obligarte a reconstruir cinco pestañas para llegar a él, la barra te da una sexta que es enteramente tuya y que ninguna actualización sobrescribe.

### 👁️ Herramientas de lectura, enfoque y esquema

**Live Preview/Origen**（alterna el panel entre Markdown renderizado y sin formato）, **Mostrar espacios**（puntos para los espacios, flechas para las tabulaciones, marcas naranjas para los espacios duros / ideográficos / EN y EM）, **Mostrar números de línea**, **Ancho de línea legible**, **Panel de navegación**（el esquema de Obsidian）, **Acercar / Alejar / 100 %**, **Dividir a la derecha / Dividir hacia abajo**, **Contraer / Expandir（todo）**, **Modo de enfoque**（contrae ambas barras laterales）, **Modo zen**（pantalla completa real）y **Modo máquina de escribir**（la línea del cursor se fija en el centro, resaltada y el resto atenuado）.

### 📑 Índice en un clic

**Índice** escribe el esquema de tu nota después del párrafo donde está el cursor: un título en negrita `**Índice**` y, debajo, un enlace anidado `- [[#Título|Título]]` por cada título. Los títulos dentro de un bloque de código o citados dentro de un recuadro se ignoran. Es una instantánea, no un campo dinámico: vuelve a generarlo después de editar y borra el anterior.

### 🧹 Utilidades de líneas y listas

**Combinar líneas**, **Dividir líneas**（por el signo de puntuación más frecuente en la selección）, **Invertir líneas** ——ninguna de las tres cruza una línea en blanco ni un bloque de código——, y **Duplicar**（una copia de la línea del cursor debajo de ella, o de la selección justo después ——el *Duplicate Selection* de VS Code——）. Más **Ordenar lista**（nivel por nivel, conservando hijos y cuerpo, y renumerando los elementos ordenados）y **Ordenar títulos**（reordena el esquema y se lleva consigo el cuerpo de cada sección）.

**Limpiar** reúne en un menú los arreglos que, si no, se hacen a mano: **Eliminar espacios finales**, **Contraer líneas en blanco**, **Convertir URL desnudas**, **Normalizar énfasis y negrita** y **Normalizar estilo de viñetas**.

### 🎨 Configuración cero, se adapta al tema

La distribución integrada es fija y hereda tu tema activo de Obsidian en modo claro y oscuro, así que se ve nativa desde la instalación y sigue viéndose así. Lo único que organizas tú es tu pestaña **Anclado**.

Es una compensación deliberada, no una función que falta. Una barra que te deja reconstruir cada botón tiene que arrastrar también un editor de arrastrar y soltar, un explorador de iconos, un formato de importación y exportación y una página de ajustes donde quepa todo eso ——y esa maquinaria es justo de donde salen los fallos de las barras de herramientas: botones que no se reordenan, distribuciones que una actualización reinicia, paneles de ajustes que se cuelgan——. Una distribución fija no tiene nada de eso. Obtienes una barra que funciona desde el primer momento y sigue funcionando, y la salida para los comandos que de verdad son tuyos es **Anclado**.

---

## Referencia completa de comandos

126 de los 138 comandos están registrados en la **paleta de comandos**, así que puedes asignarles tus propios atajos de teclado. （Los contenedores desplegables y el panel de emoji y símbolos solo existen en la barra.）

### Inicio

- **Portapapeles** —— Pegar, Cortar, Copiar, Pegar como texto sin formato
- **Fuente** —— Fuente, Tamaño de fuente, Negrita, Cursiva, Subrayado, Tachado, Subíndice, Superíndice, Código en línea, Fórmula en línea, Resaltar, Color de resaltado, Color de fuente, Borrar formato, Cambiar mayúsculas y minúsculas
- **Párrafo** —— Viñetas / Numeración / Lista de tareas, Cita, Reducir / Aumentar sangría, Volver a numerar la lista, Ordenar párrafos, Subir elemento de lista / Bajar elemento de lista, Subir una línea / Bajar una línea, Alinear a la izquierda / Centrar / Alinear a la derecha / Justificar, Línea horizontal
- **Estilos** —— Título 1–6, Quitar título
- **Edición** —— Deshacer, Rehacer, Buscar y reemplazar

### Insertar

- **Vínculos** —— Vínculo interno, Vínculo externo, Incrustar, Etiqueta, Referencia de bloque
- **Bloques** —— Recuadro ▼（Nota, Resumen, Información, Sugerencia, Éxito, Pregunta, Advertencia, Fallo, Peligro, Error, Ejemplo, Cita）, Bloque de código, Bloque de fórmula, Tabla, Convertir texto en tabla, Comentario
- **Imagen** —— Tamaño de imagen ▼（100 px, 200 px, 300 px, 400 px, 600 px, Tamaño original）, Título
- **Multimedia y símbolos** —— Adjuntar archivo, Emoji y símbolos, Fecha y hora
- **Referencia** —— Índice, Nota al pie

### Vista

- **Vistas** —— Live Preview/Origen（alterna el panel entre la vista previa en directo y el Markdown sin formato）
- **Inmersión** —— Modo de enfoque, Modo zen, Modo máquina de escribir
- **Mostrar** —— Mostrar espacios, Mostrar números de línea, Ancho de línea legible, Panel de navegación（el esquema de Obsidian）
- **Zoom** —— Acercar, Alejar, 100 %
- **Ventana** —— Dividir a la derecha, Dividir hacia abajo
- **Esquema** —— Contraer, Expandir, Contraer todo, Expandir todo

### Tabla

Disponible siempre que el cursor esté dentro de una tabla:

- **Filas y columnas** —— Eliminar filas o columnas ▼（Eliminar filas, Eliminar columnas）, Insertar filas arriba / abajo, Insertar columnas a la izquierda / derecha, Mover fila hacia arriba / abajo, Mover columna hacia la izquierda / derecha
- **Formato** —— Dar formato a las tablas ▼（Dar formato a esta tabla, Dar formato a todas las tablas）
- **Alineación** —— Alinear columna a la izquierda / Centrar columna / Alinear columna a la derecha
- **Datos** —— Ordenar filas ▼（Ordenar de A a Z, Ordenar de Z a A）, Transponer tabla, Convertir tabla en texto
- **Portapapeles** —— Pegar como tabla, Copiar tabla como CSV

### Utilidades

- **Líneas** —— Combinar líneas, Dividir líneas, Invertir líneas, Duplicar. Combinar líneas une una serie de líneas en una sola; Dividir líneas las parte por el signo de puntuación más frecuente en la selección; Invertir líneas da la vuelta al orden de cada serie; Duplicar copia la línea del cursor debajo de ella, o la selección justo después. Ninguna de las cuatro cruza una línea en blanco ni un bloque de código.
- **Ordenar** —— Ordenar lista, Ordenar títulos. Ordenar lista ordena una lista nivel por nivel ——cada elemento conserva su cuerpo y sus hijos, y los elementos ordenados salen renumerados——. Ordenar títulos reordena cada nivel del esquema de la nota y se lleva consigo el cuerpo de cada sección.
- **Vínculos** —— Pegar URI como vínculo, que envuelve el texto seleccionado con la URI que haya en el portapapeles.
- **Normalizar** —— Puntuación inteligente, Espaciado CJK, Limpiar ▼（Eliminar espacios finales, Contraer líneas en blanco, Convertir URL desnudas, Normalizar énfasis y negrita, Normalizar estilo de viñetas）.

### Anclado

Tus propios comandos, con tus propios iconos. Consulta [Primeros pasos](#primeros-pasos).

### Panel de emoji y símbolos

| Fuente  | Entradas（aprox.） | Grupos de ejemplo                                     |
| ------- | ----------------- | ----------------------------------------------------- |
| Emoji   | ~1.870            | Caras y personas, Animales y naturaleza, Comida y bebida, Objetos, Banderas |
| Kaomoji | ~70               | Emoción, Animales, Comportamiento, Personas, Festivos  |
| Símbolos | ~200             | Flechas, Matemáticos, Tipográficos, Monedas, Cerrados, Dingbats |

Todos los datos viajan dentro del plugin, así que el selector funciona totalmente sin conexión.

---

## Instalación

**Desde la comunidad de plugins（recomendado）**  
Configuración → **Plugins de la comunidad** → **Explorar** → busca **“Awesome Format Bar”** → **Instalar** → **Habilitar**.

---

## Primeros pasos

1. Abre **Configuración → Awesome Format Bar** y activa las posiciones que quieras: **Superior**, **Flotante**, **Inferior**.
2. La **cinta（Superior）** tiene seis pestañas; la última, **Anclado**, guarda los comandos que ancles tú. Mientras está vacía muestra un aviso para añadir; usa el botón de edición para gestionar los comandos y los grupos.
3. Las **barras compactas**（Flotante / Inferior）llevan un subconjunto fijo de comandos; los botones que no caben en el ancho disponible se recogen en el menú de desbordamiento `⋯`, que también enumera todos los demás comandos agrupados por pestaña, y los que tengas anclados.
4. Abre el botón de edición de **Anclado** para añadir comandos, elegir iconos, crear un grupo nuevo o cambiar el nombre del grupo, arrastrar para reordenar, mover comandos o eliminarlos. Configuración conserva una entrada alternativa que abre ese mismo gestor. Los comandos anclados se comportan exactamente igual que sus equivalentes en la paleta de comandos.
5. ¿Prefieres el teclado? Desactiva **los tres interruptores de posición** y la barra desaparece por completo de la interfaz ——el plugin no añade nada a tu pantalla——, mientras los **126 comandos registrados en la paleta** siguen funcionando y puedes asignarles tus propios atajos en **Configuración → Atajos de teclado**. Dicho de otro modo: puedes usarlo como un paquete puro de comandos y atajos sin pulsar un solo botón.

---

## Ajustes

| Sección              | Contenido                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Barra de herramientas** | Interruptores independientes para Superior / Flotante / Inferior                               |
| **Anclado**          | Tus comandos anclados —— agregar, cambiar icono, reordenar, eliminar                                |
| **Tabla**            | Entrar pasa a la fila siguiente; Tab / Shift+Tab cambian entre celdas y Tab en el borde derecho añade una columna; rellenar celdas con espacios; ordenar al hacer clic en el encabezado en el modo de lectura（nunca modifica el archivo） |

---

## Compatibilidad

- Obsidian **1.13.7 o superior**
- Funciona con el editor Markdown y se adapta a tu tema activo tanto en modo claro como oscuro.
- Sin IA, sin acceso a la red, sin cuentas, sin telemetría: todo se ejecuta en local.
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
Sí. 126 de los 138 comandos aparecen en la paleta de comandos y se pueden asociar a cualquier atajo.

**Soy de teclado ——¿puedo ocultar la barra por completo?**  
Sí, y no pierdes nada por hacerlo. Desactiva las tres posiciones（**Superior / Flotante / Inferior**）en **Configuración → Awesome Format Bar** y el plugin no deja rastro en la pantalla: ni cinta, ni barra flotante, ni barra inferior. Los **126 comandos registrados en la paleta** siguen funcionando todos, desde la paleta de comandos o desde un atajo que asignes en **Configuración → Atajos de teclado** ——incluidos comandos para los que Obsidian no tiene atajo propio, como el color de fuente, el color de resaltado, cambiar mayúsculas y minúsculas, los recuadros, ordenar tablas y las utilidades de líneas——. Piénsalo como una capa opcional solo de teclado que puedes activar cuando el ratón empiece a sentirse lento.

**¿Puedo añadir botones para comandos de otros plugins?**  
Sí ——para eso está la pestaña **Anclado**——. Ancla cualquier comando de la paleta y elige un icono. Si el plugin propietario está desactivado, el botón se atenúa y el anclado se conserva.

**¿El selector de emoji necesita conexión a internet?**  
No. Los unos 2.150 emoji, kaomoji y símbolos se incluyen con el plugin.

**¿El plugin usa IA o se conecta a algún servidor?**  
No. No hay ninguna función de IA, ni clave de API, ni petición de red, ni analítica ni telemetría en ninguna parte del código ——el plugin lee y escribe tus archivos `.md` locales y nada más——. La biblioteca de emoji va incluida, así que también funciona en un avión.

**¿Ordenar una tabla en el modo de lectura modifica mi archivo?**  
No. Ordenar al hacer clic en el encabezado en el modo de lectura es solo visual y nunca modifica la nota.

**¿Cómo centro una imagen o cambio su tamaño?**  
Coloca el cursor en la propia línea de la imagen. **Centrar**（Inicio · Párrafo）la centra ——una imagen sola en una línea *es* un párrafo, así que no hace falta ningún comando aparte——, y **Tamaño de imagen ▼**（Insertar · Imagen）fija su ancho en 100–600 px, o **Tamaño original** para devolverle el tamaño propio del archivo. **Título** escribe una línea de título debajo y la selecciona, lista para escribir encima. Todo se escribe con la sintaxis propia de Obsidian（un segmento `|300` después del nombre del archivo）, así que la nota se lee igual sin el plugin.

**¿Puedo ocultar la barra cuando quiera una pantalla limpia?**  
Sí: desactiva cualquier posición en los ajustes, o las tres para ocultarla del todo（mira la pregunta del teclado para ver qué sigue funcionando）.

**¿Es configurable?**  
Deliberadamente mínimo ——y ahí está la gracia——. La distribución integrada es fija y se adapta al tema, así que siempre se ve nativa, nunca necesita que la reorganices y una actualización nunca la reinicia. Todo lo que de verdad querrías cambiar vive en un solo lugar: la pestaña **Anclado**, donde añades cualquier comando, eliges su icono, lo agrupas y lo arrastras hasta ponerlo en orden. El razonamiento está en *Funciones → Configuración cero, se adapta al tema*.

---

## Desarrollo

```shell
npm install        # instala las dependencias
npm run build      # comprobación de tipos + pruebas + compilación de producción
npm run deploy -- /path/to/vault   # copia main.js, manifest.json y styles.css en una biblioteca
```

La versión publicada son exactamente tres archivos: `main.js`, `manifest.json` y `styles.css`.

---

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

- Obsidian 工具栏插件、格式栏、富文本工具栏、Markdown 快捷按钮、表情符号选择器、表格编辑
- Obsidian 工具列外掛、格式列
- Obsidian ツールバー・書式設定バー・絵文字ピッカー
- Obsidian 툴바 · 서식 도구 모음
- Obsidian Symbolleiste / Formatierungsleiste
- Barre d'outils / barre de mise en forme pour Obsidian
- Barra de herramientas / barra de formato para Obsidian
- Панель инструментов / панель форматирования для Obsidian
