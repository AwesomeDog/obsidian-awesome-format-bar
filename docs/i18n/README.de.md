# Awesome Format Bar —— eine Word-ähnliche Markdown-Formatleiste für Obsidian

> Fett, Kursiv, Unterstreichen, Hervorhebung, Schriftart, Überschriften, Listen, Tabellen, Callouts und Emoji — **Schaltflächen anklicken, statt Markdown-Syntax zu tippen**.  
> **Keine KI. Kein Netzwerk. Keine Telemetrie. Keine Konten.**

[![Privacy](https://img.shields.io/badge/privacy-no%20AI%20%C2%B7%20no%20network%20%C2%B7%20no%20telemetry-brightgreen)](#compatibility)
[![Last commit](https://img.shields.io/github/last-commit/AwesomeDog/obsidian-awesome-format-bar?label=last%20commit)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/commits/main)
[![Obsidian](https://img.shields.io/badge/Obsidian-1.13.7%2B-7C3AED)](https://obsidian.md)
[![GitHub release](https://img.shields.io/github/v/release/AwesomeDog/obsidian-awesome-format-bar)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/releases/latest)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&query=%24%5B%22awesome-format-bar%22%5D.downloads&label=downloads&color=573E7A)](https://obsidian.md/plugins?id=awesome-format-bar)
[![Commands](https://img.shields.io/badge/commands-100+-informational)](#full-command-reference)
[![i18n](https://img.shields.io/badge/languages-9-success)]()
[![Stars](https://img.shields.io/github/stars/AwesomeDog/obsidian-awesome-format-bar?style=social)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/stargazers)

[English](../../README.md) · **Deutsch** (diese Seite) —— Diese Seite ist eine Übersetzung der englischen README, **maßgeblich ist die englische Fassung**.

🌍 Die Oberfläche unterstützt **English、简体中文、繁體中文、日本語、한국어、Deutsch、Français、Español、Русский** — neun Sprachen, die sich automatisch nach der Spracheinstellung von Obsidian richten.

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
- **Ihr eigener Starter, wenn Sie einen wollen.** Die Registerkarte **Angeheftet** nimmt jeden Befehl auf, den Sie auswählen — einen aus dem Kern, aus diesem Plugin oder aus einem anderen —, damit sich die Leiste nach Ihnen richtet, ohne zu einem Konfigurationsprojekt zu werden.
- **Auch tastaturfreundlich.** Schalten Sie alle drei Leistenpositionen aus und die Oberfläche verschwindet vollständig — alle 126 in der Befehlspalette registrierten Befehle bleiben verfügbar und lassen sich an eigene Tastenkürzel binden.

---

## Auf einen Blick

|                     |                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Leistenpositionen** | Menüband oben, mitlaufende Leiste über der Auswahl, feste Leiste unten — frei kombinierbar        |
| **Befehle**         | **138** integrierte, davon **126** in der Befehlspalette für eigene Tastenkürzel                   |
| **Registerkarten**  | Start · Einfügen · Ansicht · Tabelle · Hilfsprogramme · **Angeheftet**                              |
| **Callouts**        | Alle 12 Obsidian-Callout-Typen in einem Aufklappmenü                                               |
| **Emoji und Symbole** | Rund 2.150 Emoji, Kaomoji und Symbole, vollständig offline                                       |
| **Tabellenbearbeitung** | Zeilen und Spalten einfügen, löschen und verschieben, ausrichten, sortieren, transponieren, neu formatieren, in Text umwandeln, als Tabelle einfügen, als CSV kopieren |
| **Bildbearbeitung** | ausrichten, Größe, Beschriftung |
| **Eigene Schaltflächen** | Registerkarte **Angeheftet** — heften Sie **beliebige** Befehle an (Kernbefehle, die dieses Plugins oder die eines anderen), mit eigenen Symbolen und Gruppen |
| **Einrichtung nötig** | Keine. Themenangepasst, ohne Konfiguration                                                       |
| **Voraussetzung**   | Obsidian **1.13.7+**                                                                                |

---

## Funktionen

### 🧭 Drei Leistenpositionen, frei kombinierbar

- **Menüband (Oben)** — die vollständige, in Registerkarten unterteilte Symbolleiste, fest über dem Editor. *Standard.*
- **Mitlaufend** — eine kompakte Leiste, die über der aktuellen Auswahl schwebt, wie die Auswahl-Symbolleiste in Word oder Google Docs. **Die mitlaufende Leiste verdeckt nie, was Sie gerade bearbeiten.**
- **Unten** — eine kompakte Leiste, die am unteren Rand des Editors fixiert ist.

Jede Position wird unabhängig ein- und ausgeschaltet, Sie können also nur die mitlaufende Leiste, nur das Menüband oder alle drei nutzen.

### 🅰️ 138 Formatierungsbefehle in vertrauter Anordnung

Fett, Kursiv, Unterstreichen, Durchstreichen, Inline-Code, Inline-Formel, Text hervorheben (mit Farbe), Schriftfarbe, **Schriftart**, **Schriftgröße**, Formatierung löschen, Groß-/Kleinschreibung ändern, Überschriften 1–6, Aufzählung / Nummerierung / Aufgabenliste, Zitat, Einzüge, horizontale Linien, Rückgängig / Wiederholen, Suchen und Ersetzen, Absatzausrichtung — gruppiert genau dort, wo ein Word-Nutzer sie erwartet.

Bilder bekommen auf **Einfügen** ihre eigene Gruppe: **Bildgröße ▼** legt eine Breite von 100–600 px fest — oder stellt die eigene Größe der Datei wieder her — und **Beschriftung** schreibt eine Beschriftungszeile unter das Bild und markiert sie, bereit zum Überschreiben.

### 💬 Callout-Auswahl mit allen 12 Obsidian-Typen

Eine einzige Schaltfläche **Hinweis (Callout)** öffnet ein Aufklappmenü mit `note`, `abstract`, `info`, `tip`, `success`, `question`, `warning`, `failure`, `danger`, `bug`, `example` und `quote`. Nie wieder die Syntax `> [!tip]` nachschlagen.

### 😀 Offline-Auswahl für Emoji, Kaomoji und Symbole mit rund 2.150 Einträgen

Ein durchsuchbares Panel **Emoji und Symbole** mit drei Quellen — Emoji, Kaomoji und typografische Symbole — wird mit dem Plugin mitgeliefert. Es fügt an der Cursorposition ein oder ersetzt die Auswahl in einem einzigen Undo-Schritt, führt pro Quelle eine Gruppe *Häufig verwendet* und bleibt geöffnet, damit Sie mehrere Zeichen hintereinander einfügen können.

### 📊 Markdown-Tabelleneditor

Zeilen und Spalten einfügen und löschen, Zeilen und Spalten verschieben, Spalten links, zentriert oder rechts ausrichten, Zeilen aufsteigend oder absteigend sortieren, Tabellen transponieren, die aktuelle Tabelle oder alle Tabellen der Notiz neu formatieren (Pretty-Print) und eine Tabelle zurück in getrennten Text umwandeln — und zusätzlich **Als Tabelle einfügen**, das tabulator- oder kommagetrennten Text aus der Zwischenablage (direkt aus Excel, Numbers oder Google Sheets) in eine ausgerichtete Markdown-Tabelle verwandelt, sowie **Tabelle als CSV kopieren** für den Weg zurück in eine Tabellenkalkulation.

Setzen Sie den Cursor in eine Tabelle, wechselt das Menüband von selbst zur Registerkarte **Tabelle**; wählen Sie eine andere Registerkarte, bleibt sie dort, wohin Sie sie gelegt haben. Im **Quellmodus** wechselt die Eingabetaste in die Zeile darunter (am Ende wird eine neue angefügt), und Tab / Shift+Tab wandern durch die Zellen, wobei hinter dem rechten Rand eine Spalte ergänzt wird.

### 📌 Beliebige Befehle anheften, auch aus anderen Plugins

**Angeheftet ist der einzige Teil der Leiste, den Sie selbst anordnen.** Sie macht die Leiste zu Ihrem eigenen Starter: Wählen Sie einen beliebigen Befehl aus der Befehlspalette (Obsidian-Kern, ein anderes Community-Plugin oder dieses Plugin), bestimmen Sie ein Symbol, weisen Sie ihm eine Gruppe zu und ordnen Sie per Ziehen um. Ist das Quell-Plugin deaktiviert, wird die Schaltfläche lediglich ausgegraut — Ihre Anheftung bleibt erhalten.

Die fünf integrierten Registerkarten decken ab, was die meisten häufig brauchen. Die ein oder zwei Befehle, auf die *Sie* nicht verzichten können, fallen meist aus dieser Menge heraus — statt Sie fünf Registerkarten neu aufbauen zu lassen, nur um sie zu erreichen, gibt Ihnen die Leiste eine sechste, die ganz Ihnen gehört und die bei einem Update niemals überschrieben wird.

### 👁️ Lese-, Fokus- und Gliederungswerkzeuge

**Live Preview/Quellmodus** (schaltet das Fenster zwischen gerenderter Ansicht und rohem Markdown um), **Leerzeichen anzeigen** (Punkte für Leerzeichen, Pfeile für Tabulatoren, orange Markierungen für geschütztes Leerzeichen, ideografisches Leerzeichen sowie EN- und EM-Leerzeichen), **Zeilennummern anzeigen**, **Lesbare Zeilenbreite**, **Navigationsbereich** (die Gliederung von Obsidian), **Vergrößern / Verkleinern / 100 %**, **Nach rechts teilen / Nach unten teilen**, **Reduzieren / Erweitern (Alle)**, **Fokusmodus** (beide Seitenleisten einklappen), **Zen-Modus** (echter Vollbildmodus) und **Schreibmaschinen-Modus** (Cursorzeile in der Mitte fixiert, hervorgehoben, der Rest gedimmt).

### 📑 Inhaltsverzeichnis mit einem Klick

**Inhaltsverzeichnis** schreibt die Gliederung Ihrer Notiz hinter den Absatz, in dem sich der Cursor befindet: ein fetter Titel `**Inhaltsverzeichnis**`, darunter pro Überschrift ein verschachtelter Link `- [[#Überschrift|Überschrift]]`. Überschriften innerhalb eines Codeblocks oder in ein Callout zitierte Überschriften werden ignoriert. Es ist eine Momentaufnahme, kein lebendes Feld — führen Sie den Befehl nach dem Bearbeiten erneut aus und löschen Sie das alte Verzeichnis.

### 🧹 Zeilen- und Listenwerkzeuge

**Zeilen zusammenführen**, **Zeilen teilen** (am Satzzeichen, das in der Auswahl am häufigsten vorkommt) und **Zeilen umkehren** — keiner der drei überschreitet eine Leerzeile oder einen Codeblock — sowie **Duplizieren** (eine Kopie der Zeile unter dem Cursor bzw. direkt hinter der Auswahl — VS Codes *Auswahl duplizieren*). Dazu **Liste sortieren** (Ebene für Ebene, Unterpunkte und Textkörper bleiben erhalten, nummerierte Einträge werden neu nummeriert) und **Überschriften sortieren** (ordnet die Gliederung neu und nimmt den Textkörper jedes Abschnitts mit).

**Bereinigen** fasst die Aufräumarbeiten, die man sonst von Hand erledigt, in einem Menü zusammen: **Nachgestellte Leerzeichen entfernen**, **Leere Zeilen zusammenfassen**, **Nackte URLs umwandeln**, **Hervorhebung und Fettdruck normieren** und **Aufzählungszeichen normieren**.

### 🎨 Keine Konfiguration, themenangepasst

Das integrierte Layout ist fest und erbt im hellen wie im dunklen Modus das aktive Obsidian-Theme — es wirkt direkt nach der Installation nativ und bleibt so. Das Einzige, was Sie selbst anordnen, ist Ihre Registerkarte **Angeheftet**.

Das ist eine bewusste Entscheidung, kein fehlendes Feature. Eine Leiste, die Ihnen erlaubt, jede Schaltfläche neu zu bauen, muss zusätzlich einen Ziehen-und-Ablegen-Editor, einen Symbolbrowser, ein Import-/Exportformat und eine Einstellungsseite mitschleppen, die das alles aufnimmt — und genau aus diesem Räderwerk stammen die Fehler von Symbolleisten: Schaltflächen, die sich nicht umordnen lassen, Layouts, die ein Update zurücksetzt, Einstellungsbereiche, die hängen bleiben. Ein festes Layout hat davon nichts. Sie bekommen eine Leiste, die sofort funktioniert und weiter funktioniert, und der Ausweg für die Befehle, die wirklich Ihre sind, heißt **Angeheftet**.

---

## Vollständige Befehlsübersicht

126 der 138 Befehle sind in der **Befehlspalette** registriert, sodass Sie ihnen eigene Tastenkürzel zuweisen können. (Aufklapp-Container und das Emoji- und Symbolpanel gibt es nur in der Leiste.)

### Start

- **Zwischenablage** — Einfügen, Ausschneiden, Kopieren, Als Nur-Text einfügen
- **Schriftart** — Schriftart, Schriftgröße, Fett, Kursiv, Unterstreichen, Durchstreichen, Tiefstellen, Hochstellen, Inline-Code, Inline-Formel, Text hervorheben, Hervorhebungsfarbe, Schriftfarbe, Formatierung löschen, Groß-/Kleinschreibung ändern
- **Absatz** — Aufzählung / Nummerierung / Aufgabenliste, Zitat, Einzug verkleinern / Einzug vergrößern, Liste neu nummerieren, Absätze sortieren, Listenelement nach oben / nach unten verschieben, Eine Zeile nach oben / Eine Zeile nach unten, Linksbündig / Zentriert / Rechtsbündig / Blocksatz, Horizontale Linie
- **Formatvorlagen** — Überschrift 1–6, Überschrift entfernen
- **Bearbeiten** — Rückgängig, Wiederholen, Suchen und Ersetzen

### Einfügen

- **Links** — Interner Link, Externer Link, Einbetten, Tag, Blockverweis
- **Blöcke** — Hinweis ▼ (Notiz-Callout, Zusammenfassung-Callout, Info-Callout, Tipp-Callout, Erfolg-Callout, Frage-Callout, Warnung-Callout, Fehlschlag-Callout, Gefahr-Callout, Fehler-Callout, Beispiel-Callout, Zitat-Callout), Codeblock, Formelblock, Tabelle, Text in Tabelle umwandeln, Kommentar
- **Bild** — Bildgröße ▼ (100 px, 200 px, 300 px, 400 px, 600 px, Ursprüngliche Größe), Beschriftung
- **Medien und Symbole** — Datei anfügen, Emoji und Symbole, Datum und Uhrzeit
- **Referenz** — Inhaltsverzeichnis, Fußnote

### Ansicht

- **Ansichten** — Live Preview/Quellmodus (das Fenster zwischen Live-Vorschau und rohem Markdown umschalten)
- **Immersiv** — Fokusmodus, Zen-Modus, Schreibmaschinen-Modus
- **Anzeigen** — Leerzeichen anzeigen, Zeilennummern anzeigen, Lesbare Zeilenbreite, Navigationsbereich (die Gliederung von Obsidian)
- **Zoom** — Vergrößern, Verkleinern, 100 %
- **Fenster** — Nach rechts teilen, Nach unten teilen
- **Gliederung** — Reduzieren, Erweitern, Alle reduzieren, Alle erweitern

### Tabelle

Verfügbar, sobald sich der Cursor in einer Tabelle befindet:

- **Zeilen und Spalten** — Zeilen oder Spalten löschen ▼ (Zeilen löschen, Spalten löschen), Zeilen oben / unten einfügen, Spalten links / rechts einfügen, Zeile nach oben / unten verschieben, Spalte nach links / rechts verschieben
- **Format** — Tabellen formatieren ▼ (Diese Tabelle formatieren, Alle Tabellen formatieren)
- **Ausrichtung** — Spalte linksbündig / zentriert / rechtsbündig ausrichten
- **Daten** — Zeilen sortieren ▼ (Aufsteigend sortieren, Absteigend sortieren), Tabelle transponieren, Tabelle in Text umwandeln
- **Zwischenablage** — Als Tabelle einfügen, Tabelle als CSV kopieren

### Hilfsprogramme

- **Zeilen** — Zeilen zusammenführen, Zeilen teilen, Zeilen umkehren, Duplizieren. Zeilen zusammenführen fasst eine Folge von Zeilen zu einer zusammen; Zeilen teilen bricht sie am Satzzeichen um, das in der Auswahl am häufigsten vorkommt; Zeilen umkehren dreht die Reihenfolge jeder Folge um; Duplizieren kopiert die Zeile des Cursors darunter bzw. die Auswahl direkt dahinter. Keiner der vier überschreitet eine Leerzeile oder einen Codeblock.
- **Sortieren** — Liste sortieren, Überschriften sortieren. Liste sortieren sortiert eine Liste Ebene für Ebene — ein Eintrag behält seinen eigenen Textkörper und seine eigenen Unterpunkte, und nummerierte Einträge kommen neu nummeriert heraus. Überschriften sortieren ordnet jede Ebene der Notizgliederung neu und nimmt den Textkörper jedes Abschnitts dabei mit.
- **Links** — URI als Link einfügen, das den ausgewählten Text mit der URI aus der Zwischenablage umschließt.
- **Normalisieren** — Intelligente Zeichensetzung, CJK-Abstände, Bereinigen ▼ (Nachgestellte Leerzeichen entfernen, Leere Zeilen zusammenfassen, Nackte URLs umwandeln, Hervorhebung und Fettdruck normieren, Aufzählungszeichen normieren).

### Angeheftet

Ihre eigenen Befehle mit Ihren eigenen Symbolen. Siehe [Erste Schritte](#erste-schritte).

### Emoji- und Symbolpanel

| Quelle  | Einträge (ca.) | Beispielgruppen                                              |
| ------- | -------------- | ------------------------------------------------------------ |
| Emoji   | ~1.870         | Smileys und Menschen, Tiere und Natur, Essen und Trinken, Objekte, Flaggen |
| Kaomoji | ~70            | Emotion, Tier, Verhalten, Menschen, Feiertag                 |
| Symbole | ~200           | Pfeile, Mathematik, Typografie, Währung, eingekreiste Zeichen, Dingbats |

Alle Daten werden mit dem Plugin ausgeliefert, die Auswahl funktioniert also vollständig offline.

---

## Installation

**Aus den Community-Plugins (empfohlen)**  
Einstellungen → **Community-Plugins** → **Durchsuchen** → nach **„Awesome Format Bar"** suchen → **Installieren** → **Aktivieren**.

---

## Erste Schritte

1. Öffnen Sie **Einstellungen → Awesome Format Bar** und schalten Sie die gewünschten Positionen ein: **Oben**, **Mitlaufend**, **Unten**.
2. Das **Menüband (Oben)** hat sechs Registerkarten; die letzte, **Angeheftet**, enthält die Befehle, die Sie selbst anheften. Solange sie leer ist, zeigt sie einen Hinweis zum Hinzufügen; nutzen Sie die Bearbeiten-Schaltfläche, um Befehle und Gruppen zu verwalten.
3. Die **kompakten Leisten** (Mitlaufend / Unten) tragen eine feste Auswahl an Befehlen; Schaltflächen, die nicht in die verfügbare Breite passen, wandern in das Überlaufmenü `⋯`, das außerdem jeden weiteren nach Registerkarte gruppierten Befehl sowie Ihre angehefteten auflistet.
4. Öffnen Sie die Bearbeiten-Schaltfläche von **Angeheftet**, um Befehle hinzuzufügen, Symbole zu wählen, neue Gruppen zu erstellen oder Gruppen umzubenennen, per Ziehen umzuordnen, Befehle in andere Gruppen zu verschieben oder sie zu löschen. Die Einstellungen halten zusätzlich einen Eintrag bereit, der denselben Manager öffnet. Angeheftete Befehle verhalten sich genau wie ihre Gegenstücke in der Befehlspalette.
5. Lieber Tastatur? Schalten Sie **alle drei Positionsschalter aus** und die Leiste verschwindet vollständig aus der Oberfläche — das Plugin fügt Ihrem Bildschirm nichts hinzu, während alle **126 in der Palette registrierten Befehle** weiter funktionieren und unter **Einstellungen → Tastenkürzel** an eigene Hotkeys gebunden werden können. Anders gesagt: Sie können es als reines Befehls- und Hotkey-Paket nutzen und nie eine Schaltfläche anklicken.

---

## Einstellungen

| Bereich         | Inhalt                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| **Symbolleiste** | Unabhängige Schalter für Oben / Mitlaufend / Unten                                                          |
| **Angeheftet**  | Ihre angehefteten Befehle — hinzufügen, Symbol ändern, umordnen, löschen                                    |
| **Tabelle**     | Eingabetaste wechselt zur nächsten Zeile; Tab / Shift+Tab wechseln zwischen Zellen, und Tab am rechten Rand fügt eine Spalte hinzu; Zellen mit Leerzeichen auffüllen; in der Leseansicht beim Klicken auf die Kopfzeile sortieren (ändert die Datei niemals) |

---

## Kompatibilität

- Obsidian **1.13.7+**
- Funktioniert mit dem Markdown-Editor und passt sich im hellen wie im dunklen Modus an das aktive Theme an.
- Keine KI, kein Netzwerkzugriff, keine Konten, keine Telemetrie — alles läuft lokal.
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
Ja. 126 der 138 Befehle erscheinen in der Befehlspalette und lassen sich an ein beliebiges Tastenkürzel binden.

**Ich arbeite lieber mit der Tastatur — kann ich die Leiste komplett ausblenden?**  
Ja, und Sie verlieren dabei nichts. Schalten Sie in **Einstellungen → Awesome Format Bar** alle drei Positionen (**Oben / Mitlaufend / Unten**) aus und das Plugin hinterlässt auf dem Bildschirm keine Spur: kein Menüband, keine schwebende Leiste, keine Leiste unten. Alle **126 in der Palette registrierten Befehle** funktionieren weiterhin — über die Befehlspalette oder über ein Tastenkürzel, das Sie unter **Einstellungen → Tastenkürzel** festlegen — darunter auch Befehle, für die Obsidian kein eingebautes Kürzel hat, etwa Schriftfarbe, Hervorhebungsfarbe, Groß-/Kleinschreibung ändern, Callouts, Tabellensortierung und die Zeilenwerkzeuge. Betrachten Sie es als eine optionale Nur-Tastatur-Ebene, die Sie zuschalten können, wann immer die Maus sich zu langsam anfühlt.

**Kann ich Schaltflächen für Befehle anderer Plugins hinzufügen?**  
Ja — dafür ist die Registerkarte **Angeheftet** da. Heften Sie einen beliebigen Befehl aus der Palette an und wählen Sie ein Symbol. Ist das bereitstellende Plugin deaktiviert, wird die Schaltfläche ausgegraut und die Anheftung bleibt erhalten.

**Braucht die Emoji-Auswahl eine Internetverbindung?**  
Nein. Alle rund 2.150 Emoji, Kaomoji und Symbole sind im Plugin enthalten.

**Nutzt das Plugin KI oder telefoniert es in irgendeiner Weise nach Hause?**  
Nein. Im gesamten Code gibt es keine KI-Funktion, keinen API-Schlüssel, keine Netzwerkanfrage, keine Nutzungsanalyse und keine Telemetrie — das Plugin liest und schreibt Ihre lokalen `.md`-Dateien und sonst nichts. Die Emoji-Bibliothek ist im Plugin enthalten und funktioniert daher auch im Flugzeug.

**Ändert das Sortieren einer Tabelle in der Leseansicht meine Datei?**  
Nein. Die Sortierung per Klick auf die Kopfzeile in der Leseansicht betrifft nur die Anzeige und ändert die Notiz niemals.

**Wie zentriere ich ein Bild oder ändere seine Größe?**  
Setzen Sie den Cursor in die Zeile des Bildes. **Zentriert** (Start · Absatz) zentriert es — ein Bild, das allein in einer Zeile steht, *ist* ein Absatz, also ist kein eigener Befehl nötig — und **Bildgröße ▼** (Einfügen · Bild) legt seine Breite auf 100–600 px fest, **Ursprüngliche Größe** gibt der Datei ihre eigene Größe zurück. **Beschriftung** schreibt darunter eine Beschriftungszeile und markiert sie, bereit zum Überschreiben. Alles wird als einfache Obsidian-Syntax geschrieben (ein Abschnitt `|300` hinter dem Dateinamen), die Notiz liest sich also auch ohne Plugin genauso.

**Kann ich die Leiste ausblenden, wenn ich einen aufgeräumten Bildschirm möchte?**  
Ja — schalten Sie eine beliebige Position in den Einstellungen aus oder alle drei, um sie ganz zu verbergen (was dann noch funktioniert, steht in der Frage zur Tastatur weiter oben).

**Ist es konfigurierbar?**  
Bewusst minimal — und genau das ist der Punkt. Das integrierte Layout ist fest und themenangepasst, damit es immer nativ wirkt, nie neu geordnet werden muss und sich bei einem Update nicht selbst zurücksetzt. Alles, was Sie tatsächlich ändern wollen, liegt an einem Ort: der Registerkarte **Angeheftet**, wo Sie einen beliebigen Befehl hinzufügen, sein Symbol wählen, ihn gruppieren und per Ziehen in die richtige Reihenfolge bringen. Die Begründung steht unter *Funktionen → Keine Konfiguration, themenangepasst*.

---

## Entwicklung

```shell
npm install        # Abhängigkeiten installieren
npm run build      # Typprüfung + Tests + Produktions-Build
npm run deploy -- /path/to/vault   # main.js, manifest.json und styles.css in einen Tresor kopieren
```

Das Release besteht aus genau drei Dateien: `main.js`, `manifest.json` und `styles.css`.

---

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

- Obsidian 工具栏插件、格式栏、富文本工具栏、Markdown 快捷按钮、表情符号选择器、表格编辑
- Obsidian 工具列外掛、格式列
- Obsidian ツールバー・書式設定バー・絵文字ピッカー
- Obsidian 툴바 · 서식 도구 모음
- Obsidian Symbolleiste / Formatierungsleiste
- Barre d'outils / barre de mise en forme pour Obsidian
- Barra de herramientas / barra de formato para Obsidian
- Панель инструментов / панель форматирования для Obsidian
