# Awesome Format Bar —— eine Word-ähnliche Markdown-Formatleiste für Obsidian

> Fett, Kursiv, Unterstreichen, Hervorhebung, Schriftart, Überschriften, Listen, Tabellen, Callouts und Emoji — **Schaltflächen anklicken, statt Markdown-Syntax zu tippen**.

[![Obsidian](https://img.shields.io/badge/Obsidian-1.13.7%2B-7C3AED)](https://obsidian.md)
[![GitHub release](https://img.shields.io/github/v/release/AwesomeDog/obsidian-awesome-format-bar)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/releases/latest)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&query=%24%5B%22awesome-format-bar%22%5D.downloads&label=downloads&color=573E7A)](https://obsidian.md/plugins?id=awesome-format-bar)
[![Commands](https://img.shields.io/badge/commands-100+-informational)](#full-command-reference)
[![i18n](https://img.shields.io/badge/languages-8-success)]()
[![Stars](https://img.shields.io/github/stars/AwesomeDog/obsidian-awesome-format-bar?style=social)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/stargazers)

[English](../../README.md) · **Deutsch** (diese Seite) —— Diese Seite ist eine Übersetzung der englischen README, **maßgeblich ist die englische Fassung**.

🌍 Die Oberfläche unterstützt **English、简体中文、繁體中文、日本語、한국어、Deutsch、Français、Español** — acht Sprachen, die sich automatisch nach der Spracheinstellung von Obsidian richten.

**Awesome Format Bar** ist ein **Formatleisten-Plugin (Menüband) für [Obsidian](https://obsidian.md)**. Es legt eine vertraute, Word-ähnliche **Editor-Symbolleiste** über Ihre Notizen, sodass alltägliche Formatierung einen Klick entfernt ist — während Ihr Tresor zu 100 % reiner Text bleibt.

Alles, was die Leiste schreibt, ist **Standard-Markdown**, **Obsidian-Markdown** oder — wo Markdown schlicht keine Syntax hat (Unterstreichen, Hochstellen, Tiefstellen, Absatzausrichtung, Schriftfarbe, Schriftart, Schriftgröße) — eine kleine Menge **Inline-HTML**, das Obsidian nativ darstellt.

*Sie suchen ein Obsidian-**Symbolleisten-Plugin**, eine **Formatleiste**, eine **Editor-Symbolleiste**, eine **Rich-Text- beziehungsweise WYSIWYG-artige Bearbeitungsleiste**, **Markdown-Formatierungsschaltflächen**, eine **Emoji-Auswahl**, einen **Tabelleneditor** oder ein **Word-ähnliches Menüband für Obsidian**? Dann sind Sie hier richtig.*

<p align="center">
  <img src="../img/light.png" alt="Awesome Format Bar für Obsidian —— Word-ähnliche Markdown-Formatleiste mit Fett, Kursiv, Unterstreichen, Hervorhebung, Schriftfarbe, Überschriften, Listen und Tabellen（helles Theme）">
</p>

---

## Inhaltsverzeichnis

- [Warum eine Formatleiste in Obsidian](#warum-eine-formatleiste-in-obsidian)
- [Auf einen Blick](#auf-einen-blick)
- [Funktionen](#funktionen)
- [Vollständige Befehlsübersicht](#vollständige-befehlsübersicht)
- [Installation](#installation)
- [Erste Schritte](#erste-schritte)
- [Einstellungen](#einstellungen)
- [Kompatibilität](#kompatibilität)
- [Häufige Fragen](#häufige-fragen)
- [Entwicklung](#entwicklung)
- [Veröffentlichung](#veröffentlichung)
- [Schlüsselwörter](#schlüsselwörter)

---

## Warum eine Formatleiste in Obsidian

Obsidian ist schnell — **wenn** Sie bereits Markdown beherrschen. Für alle anderen — Schüler und Studierende, Autoren, die von Word oder Google Docs kommen, Teams, die neue Notizenschreiber einarbeiten — ist die Syntax eine Mauer.

- **Keine Syntax zum Auswendiglernen.** Text markieren, auf **Fett** klicken. Fertig.
- **Word-Begriffe, die Sie schon kennen.** Registerkarten Start / Einfügen / Ansicht / Tabelle, „Formatierung löschen", „Groß-/Kleinschreibung ändern", „Navigationsbereich".
- **Entdecken, was Obsidian kann.** Callouts, Blockverweise, Einbettungen, Formelblöcke und Tags bekommen je eine Schaltfläche — Funktionen, die viele Nutzer in der Syntax nie finden.
- **Tun, was Markdown nicht kann.** Unterstreichen, Hochstellen, Tiefstellen, Absatzausrichtung, Text- und Hervorhebungsfarbe sowie Schriftart und Schriftgröße, geschrieben als sauberes Inline-HTML.
- **Für immer reiner Text.** Kein proprietäres Format, keine Datenbank, keine Bindung — Ihre Notizen bleiben schlicht `.md`-Dateien.
- **Offline und privat.** Keine Netzwerkaufrufe, keine Konten, keine Telemetrie. Die rund 2.150 Einträge der Emoji-Bibliothek werden mit dem Plugin ausgeliefert.
- **Auch tastaturfreundlich.** Schalten Sie alle drei Leistenpositionen aus und die Oberfläche verschwindet vollständig — alle 105 in der Befehlspalette registrierten Befehle bleiben verfügbar und lassen sich an eigene Tastenkürzel binden.

## Auf einen Blick

|                     |                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Leistenpositionen** | Menüband oben, mitlaufende Leiste über der Auswahl, feste Leiste unten — frei kombinierbar        |
| **Befehle**         | **115** integrierte, davon **105** in der Befehlspalette für eigene Tastenkürzel                   |
| **Registerkarten**  | Start · Einfügen · Ansicht · Tabelle · Hilfsprogramme · **Angeheftet**                              |
| **Callouts**        | Alle 12 Obsidian-Callout-Typen in einem Aufklappmenü                                               |
| **Emoji und Symbole** | Rund 2.150 Emoji, Kaomoji und Symbole, vollständig offline                                       |
| **Tabellenbearbeitung** | Zeilen und Spalten einfügen, löschen und verschieben, ausrichten, sortieren, neu formatieren, als Tabelle einfügen |
| **Eigene Schaltflächen** | Heften Sie **beliebige** Befehle an — Kernbefehle, die dieses Plugins oder die eines anderen    |
| **Einrichtung nötig** | Keine. Themenangepasst, ohne Konfiguration                                                       |
| **Voraussetzung**   | Obsidian **1.13.7+**                                                                                |

---

## Funktionen

### 🧭 Drei Leistenpositionen, frei kombinierbar

- **Menüband (Oben)** — die vollständige, in Registerkarten unterteilte Symbolleiste, fest über dem Editor. *Standard.*
- **Mitlaufend** — eine kompakte Leiste, die über der aktuellen Auswahl schwebt, wie die Auswahl-Symbolleiste in Word oder Google Docs.
- **Unten** — eine kompakte Leiste, die am unteren Rand des Editors fixiert ist.

Jede Position wird unabhängig ein- und ausgeschaltet, Sie können also nur die mitlaufende Leiste, nur das Menüband oder alle drei nutzen.

### 🅰️ 115 Formatierungsbefehle in vertrauter Anordnung

Fett, Kursiv, Unterstreichen, Durchstreichen, Inline-Code, Inline-Formel, Text hervorheben (mit Farbe), Schriftfarbe, **Schriftart**, **Schriftgröße**, Formatierung löschen, Groß-/Kleinschreibung ändern, Überschriften 1–6, Aufzählung / Nummerierung / Aufgabenliste, Zitat, Einzüge, horizontale Linien, Rückgängig / Wiederholen, Suchen und Ersetzen, Absatzausrichtung — gruppiert genau dort, wo ein Word-Nutzer sie erwartet.

### 💬 Callout-Auswahl mit allen 12 Obsidian-Typen

Eine einzige Schaltfläche **Hinweis (Callout)** öffnet ein Aufklappmenü mit `note`, `abstract`, `info`, `tip`, `success`, `question`, `warning`, `failure`, `danger`, `bug`, `example` und `quote`. Nie wieder die Syntax `> [!tip]` nachschlagen.

### 😀 Offline-Auswahl für Emoji, Kaomoji und Symbole mit rund 2.150 Einträgen

Ein durchsuchbares Panel **Emoji und Symbole** mit drei Quellen — Emoji, Kaomoji und typografische Symbole — wird mit dem Plugin mitgeliefert. Es fügt an der Cursorposition ein oder ersetzt die Auswahl in einem einzigen Undo-Schritt, führt pro Quelle eine Gruppe *Häufig verwendet* und bleibt geöffnet, damit Sie mehrere Zeichen hintereinander einfügen können.

### 📊 Markdown-Tabelleneditor

Zeilen und Spalten einfügen und löschen, Zeilen und Spalten verschieben, Spalten links, zentriert oder rechts ausrichten, Zeilen sortieren, Tabellen neu formatieren (Pretty-Print) — und zusätzlich **Als Tabelle einfügen**, das tabulator- oder kommagetrennten Text aus der Zwischenablage (direkt aus Excel, Numbers oder Google Sheets) in eine ausgerichtete Markdown-Tabelle verwandelt.

### 📌 Beliebige Befehle anheften, auch aus anderen Plugins

Die Registerkarte **Angeheftet** macht die Leiste zu Ihrem eigenen Starter: Wählen Sie einen beliebigen Befehl aus der Befehlspalette (Obsidian-Kern, ein anderes Community-Plugin oder dieses Plugin), bestimmen Sie ein Symbol und ordnen Sie per Ziehen um. Ist das Quell-Plugin deaktiviert, wird die Schaltfläche lediglich ausgegraut — Ihre Anheftung bleibt erhalten.

### 👁️ Lese-, Fokus- und Gliederungswerkzeuge

**Leerzeichen anzeigen** (Punkte für Leerzeichen, Pfeile für Tabulatoren, orange Markierungen für geschütztes Leerzeichen, ideografisches Leerzeichen sowie EN- und EM-Leerzeichen), **Zeilennummern anzeigen**, **Lesbare Zeilenbreite**, **Navigationsbereich** (die Gliederung von Obsidian), **Vergrößern / Verkleinern / 100 %**, **Nach rechts teilen / Nach unten teilen**, **Reduzieren / Erweitern (Alle)**, **Fokusmodus** (beide Seitenleisten einklappen) und **Zen-Modus** (echter Vollbildmodus).

### 📑 Inhaltsverzeichnis mit einem Klick

**Inhaltsverzeichnis** schreibt die Gliederung Ihrer Notiz hinter den Absatz, in dem sich der Cursor befindet: ein fetter Titel `**Inhaltsverzeichnis**`, darunter pro Überschrift ein verschachtelter Link `- [[#Überschrift|Überschrift]]`. Überschriften innerhalb eines Codeblocks oder in ein Callout zitierte Überschriften werden ignoriert. Es ist eine Momentaufnahme, kein lebendes Feld — führen Sie den Befehl nach dem Bearbeiten erneut aus und löschen Sie das alte Verzeichnis.

### 🧹 Zeilen- und Listenwerkzeuge

**Zeilen zusammenführen**, **Zeilen teilen** (am Satzzeichen, das in der Auswahl am häufigsten vorkommt) und **Zeilen umkehren** — keiner der drei überschreitet eine Leerzeile oder einen Codeblock — sowie **Liste sortieren** (Ebene für Ebene, Unterpunkte und Textkörper bleiben erhalten, nummerierte Einträge werden neu nummeriert) und **Überschriften sortieren** (ordnet die Gliederung neu und nimmt den Textkörper jedes Abschnitts mit).

### 🎨 Keine Konfiguration, themenangepasst

Festes, zurückhaltendes Layout, das im hellen wie im dunklen Modus das aktive Obsidian-Theme erbt. Das Einzige, was Sie selbst einrichten, ist die Registerkarte **Angeheftet**.

---

## Vollständige Befehlsübersicht

105 der 115 Befehle sind in der **Befehlspalette** registriert, sodass Sie ihnen eigene Tastenkürzel zuweisen können. (Aufklapp-Container und das Emoji- und Symbolpanel gibt es nur in der Leiste.)

### Start

- **Zwischenablage** — Einfügen, Ausschneiden, Kopieren, Als Nur-Text einfügen
- **Schriftart** — Schriftart, Schriftgröße, Fett, Kursiv, Unterstreichen, Durchstreichen, Tiefstellen, Hochstellen, Inline-Code, Inline-Formel, Text hervorheben, Hervorhebungsfarbe, Schriftfarbe, Formatierung löschen, Groß-/Kleinschreibung ändern
- **Absatz** — Aufzählung / Nummerierung / Aufgabenliste, Zitat, Einzug verkleinern / Einzug vergrößern, Liste neu nummerieren, Absätze sortieren, Eine Zeile nach oben / Eine Zeile nach unten, Linksbündig / Zentriert / Rechtsbündig / Blocksatz, Horizontale Linie
- **Formatvorlagen** — Überschrift 1–6, Überschrift entfernen
- **Bearbeiten** — Rückgängig, Wiederholen, Suchen und Ersetzen

### Einfügen

Interner Link, Externer Link, Einbetten, Tag, Blockverweis, **Hinweis (Callout) ▼** (Notiz-Callout, Zusammenfassung-Callout, Info-Callout, Tipp-Callout, Erfolg-Callout, Frage-Callout, Warnung-Callout, Fehlschlag-Callout, Gefahr-Callout, Fehler-Callout, Beispiel-Callout, Zitat-Callout), Codeblock, Formelblock, Tabelle, Text in Tabelle umwandeln, Kommentar, Datei anfügen, **Emoji und Symbole**, Datum und Uhrzeit, **Inhaltsverzeichnis**, Fußnote.

### Ansicht

- **Anzeigen** — Leerzeichen anzeigen, Zeilennummern anzeigen, Lesbare Zeilenbreite, Navigationsbereich (die Gliederung von Obsidian)
- **Zoom** — Vergrößern, Verkleinern, 100 %
- **Fenster** — Nach rechts teilen, Nach unten teilen
- **Gliederung** — Reduzieren, Erweitern, Alle reduzieren, Alle erweitern
- **Immersiv** — Fokusmodus, Zen-Modus

### Tabelle

Verfügbar, sobald sich der Cursor in einer Tabelle befindet: Zeilen oder Spalten löschen, Zeilen oben / unten einfügen, Spalten links / rechts einfügen, Zeile nach oben / unten verschieben, Spalte nach links / rechts verschieben, Tabellen formatieren, Spalte linksbündig / zentriert / rechtsbündig ausrichten, Zeilen sortieren, **In Text umwandeln**.
**In Text umwandeln** schreibt die Tabelle als tabulatorgetrennte Zeilen — genau die Umkehrung von **Text in Tabelle umwandeln** (Einfügen · Blöcke), das tabulator- oder kommagetrennten Text in eine ausgerichtete Markdown-Tabelle verwandelt. **Als Tabelle einfügen** tut dasselbe mit der Zwischenablage und funktioniert überall.

### Hilfsprogramme

**Zeilen zusammenführen** fasst eine Folge von Zeilen zu einer zusammen; **Zeilen teilen** bricht sie am Satzzeichen um, das in der Auswahl am häufigsten vorkommt; **Zeilen umkehren** dreht die Reihenfolge jeder Folge um. Keiner der drei überschreitet eine Leerzeile oder einen Codeblock.
**Liste sortieren** sortiert eine Liste Ebene für Ebene — ein Eintrag behält seinen eigenen Textkörper und seine eigenen Unterpunkte, und nummerierte Einträge kommen neu nummeriert heraus. **Überschriften sortieren** ordnet jede Ebene der Notizgliederung neu und nimmt den Textkörper jedes Abschnitts dabei mit.

### Angeheftet

Ihre eigenen Befehle mit Ihren eigenen Symbolen. Siehe [Erste Schritte](#erste-schritte).

### Emoji- und Symbolpanel

| Quelle  | Einträge (ca.) | Beispielgruppen                                              |
| ------- | -------------- | ------------------------------------------------------------ |
| Emoji   | ~1.900         | Smileys und Menschen, Tiere und Natur, Essen und Trinken, Objekte, Flaggen |
| Kaomoji | ~70            | Emotion, Tier, Verhalten, Menschen, Feiertag                 |
| Symbole | ~200           | Pfeile, Mathematik, Typografie, Währung, eingekreiste Zeichen, Dingbats |

Alle Daten werden mit dem Plugin ausgeliefert, die Auswahl funktioniert also vollständig offline.

---

## Installation

Voraussetzung ist Obsidian **1.13.7 oder höher**.

**Aus den Community-Plugins (empfohlen)**
Einstellungen → **Community-Plugins** → **Durchsuchen** → nach **„Awesome Format Bar"** suchen → **Installieren** → **Aktivieren**.

**Mit BRAT (Beta-Versionen)**
Installieren Sie [BRAT](https://github.com/TfTHacker/obsidian42-brat), führen Sie *BRAT: Add a beta plugin* aus und fügen Sie die URL dieses Repositories ein.

**Manuell**
Laden Sie `main.js`, `manifest.json` und `styles.css` aus einem Release in `<Tresor>/.obsidian/plugins/awesome-format-bar/` und aktivieren Sie das Plugin anschließend unter Einstellungen → Community-Plugins.

## Erste Schritte

1. Öffnen Sie **Einstellungen → Awesome Format Bar** und schalten Sie die gewünschten Positionen ein: **Oben**, **Mitlaufend**, **Unten**.
2. Das **Menüband (Oben)** hat sechs Registerkarten; die letzte, **Angeheftet**, enthält die Befehle, die Sie selbst anheften. Solange sie leer ist, zeigt sie einen Hinweis, der zurück zu den Einstellungen verweist.
3. Die **kompakten Leisten** (Mitlaufend / Unten) tragen eine feste Auswahl an Befehlen; was nicht hineinpasst, wandert in das Überlaufmenü `⋯`.
4. Heften Sie Befehle unter **Einstellungen → Angeheftet** an: hinzufügen (Befehl wählen, dann Symbol), Symbol ändern, per Ziehen umordnen oder löschen. Angeheftete Befehle verhalten sich genau wie ihre Gegenstücke in der Befehlspalette.
5. Lieber Tastatur? Schalten Sie **alle drei Positionsschalter aus** und die Leiste verschwindet vollständig aus der Oberfläche — das Plugin fügt Ihrem Bildschirm nichts hinzu, während alle **105 in der Palette registrierten Befehle** weiter funktionieren und unter **Einstellungen → Tastenkürzel** an eigene Hotkeys gebunden werden können. Anders gesagt: Sie können es als reines Befehls- und Hotkey-Paket nutzen und nie eine Schaltfläche anklicken.

## Einstellungen

| Bereich         | Inhalt                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| **Symbolleiste** | Unabhängige Schalter für Oben / Mitlaufend / Unten                                                          |
| **Angeheftet**  | Ihre angehefteten Befehle — hinzufügen, Symbol ändern, umordnen, löschen                                    |
| **Tabelle**     | Eingabetaste wechselt zur nächsten Zeile; Zellen mit Leerzeichen auffüllen; in der Leseansicht beim Klicken auf die Kopfzeile sortieren (ändert die Datei niemals) |

## Kompatibilität

- Obsidian **1.13.7+**
- Funktioniert mit dem Markdown-Editor und passt sich im hellen wie im dunklen Modus an das aktive Theme an.
- Kein Netzwerkzugriff, keine Konten, keine Telemetrie — alles läuft lokal.
- Das Release besteht aus genau drei Dateien: `main.js`, `manifest.json`, `styles.css`.

---

## Häufige Fragen

**Macht das aus Obsidian einen WYSIWYG- oder Rich-Text-Editor?**
Nein — und genau das ist der Punkt. Es ist eine **Symbolleiste** über dem eigenen Editor von Obsidian. Ihre Dateien bleiben reines Markdown.

**Muss ich jetzt Markdown-Syntax lernen, um Obsidian zu nutzen?**
Nein. Fett, Überschriften, Listen, Links, Tabellen, Callouts, Codeblöcke und Formeln sind alles Schaltflächen.

**Was genau wird in meine Notizen geschrieben?**
Standard-Markdown und Obsidian-Markdown. Nur dort, wo Markdown keine Syntax hat — Unterstreichen, Hochstellen, Tiefstellen, Absatzausrichtung, Text- und Hervorhebungsfarbe, Schriftart und Schriftgröße — schreibt das Plugin wenige, standardkonforme Inline-HTML-Tags, die Obsidian nativ darstellt.

**Kann ich meine Tastenkürzel weiter verwenden?**
Ja. 105 der 115 Befehle erscheinen in der Befehlspalette und lassen sich an ein beliebiges Tastenkürzel binden.

**Ich arbeite lieber mit der Tastatur — kann ich die Leiste komplett ausblenden?**
Ja, und Sie verlieren dabei nichts. Schalten Sie in **Einstellungen → Awesome Format Bar** alle drei Positionen (**Oben / Mitlaufend / Unten**) aus und das Plugin hinterlässt auf dem Bildschirm keine Spur: kein Menüband, keine schwebende Leiste, keine Leiste unten. Alle **105 in der Palette registrierten Befehle** funktionieren weiterhin — über die Befehlspalette oder über ein Tastenkürzel, das Sie unter **Einstellungen → Tastenkürzel** festlegen — darunter auch Befehle, für die Obsidian kein eingebautes Kürzel hat, etwa Schriftfarbe, Hervorhebungsfarbe, Groß-/Kleinschreibung ändern, Callouts, Tabellensortierung und die Zeilenwerkzeuge. Betrachten Sie es als eine optionale Nur-Tastatur-Ebene, die Sie zuschalten können, wann immer die Maus sich zu langsam anfühlt.

**Kann ich Schaltflächen für Befehle anderer Plugins hinzufügen?**
Ja — dafür ist die Registerkarte **Angeheftet** da. Heften Sie einen beliebigen Befehl aus der Palette an und wählen Sie ein Symbol. Ist das bereitstellende Plugin deaktiviert, wird die Schaltfläche ausgegraut und die Anheftung bleibt erhalten.

**Braucht die Emoji-Auswahl eine Internetverbindung?**
Nein. Alle rund 2.150 Emoji, Kaomoji und Symbole sind im Plugin enthalten.

**Ändert das Sortieren einer Tabelle in der Leseansicht meine Datei?**
Nein. Die Sortierung per Klick auf die Kopfzeile in der Leseansicht betrifft nur die Anzeige und ändert die Notiz niemals.

**Kann ich die Leiste ausblenden, wenn ich einen aufgeräumten Bildschirm möchte?**
Ja — schalten Sie eine beliebige Position in den Einstellungen aus oder alle drei, um sie ganz zu verbergen (was dann noch funktioniert, steht in der Frage zur Tastatur weiter oben).

**Ist es konfigurierbar?**
Bewusst minimal: Das Layout ist fest und themenangepasst, damit es immer nativ wirkt. Die Registerkarte **Angeheftet** gehört Ihnen.

---

## Entwicklung

```shell
npm install        # Abhängigkeiten installieren
npm run dev        # im Watch-Modus bauen
npm run build      # Typprüfung + Tests + Produktions-Build
npm run test       # Unit-Tests ausführen
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run deploy -- /path/to/vault   # main.js, manifest.json und styles.css in einen Tresor kopieren
```

Das Release besteht aus genau drei Dateien: `main.js`, `manifest.json` und `styles.css`.

## Veröffentlichung

```shell
npm version patch                    # package.json, manifest.json und versions.json erhöhen; committen und taggen
git push origin main --follow-tags   # Commit und Tag pushen
```

`npm version` erfordert einen sauberen Arbeitsbaum. Das Tag trägt kein `v`-Präfix — es muss mit der `version` in `manifest.json` übereinstimmen, sonst weist der Release-Workflow es zurück.

Wird das Tag gepusht, läuft `.github/workflows/release.yml`: Es baut das Plugin und erstellt einen **Entwurf**-Release mit `main.js`, `manifest.json` und `styles.css` im Anhang. Veröffentlichen Sie den Entwurf, um die Version verfügbar zu machen.

---

## Schlüsselwörter

Obsidian-Symbolleisten-Plugin · Obsidian-Formatierungsleiste · Obsidian-Formatleiste · Markdown-Symbolleiste · Markdown-Formatierungsschaltflächen · Word-ähnliches Menüband für Obsidian · Rich-Text-Symbolleiste · WYSIWYG-artige Bearbeitungsleiste · Editor-Symbolleiste · schwebende Auswahl-Symbolleiste · Textfarbe und Hervorhebung in Obsidian · Unterstreichen, Hochstellen und Tiefstellen in Markdown · Textausrichtung · Callout-Auswahl · Emoji-Auswahl · Kaomoji · Symbolauswahl · Markdown-Tabelleneditor · Tabelle sortieren · als Tabelle einfügen · Inhaltsverzeichnis-Generator · Befehle anheften · einsteigerfreundliches Obsidian · Markdown ohne Syntax bearbeiten

**Andere Sprachen / Other languages:**
Obsidian 工具栏插件、格式栏、富文本工具栏、Markdown 快捷按钮、表情符号选择器、表格编辑 ·  
Obsidian 工具列外掛、格式列 ·  
Obsidian ツールバー・書式設定バー・絵文字ピッカー ·  
Obsidian 툴바 · 서식 도구 모음 ·  
Obsidian Symbolleiste / Formatierungsleiste ·  
Barre d'outils / barre de mise en forme pour Obsidian ·  
Barra de herramientas / barra de formato para Obsidian
