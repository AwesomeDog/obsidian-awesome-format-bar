# Awesome Format Bar —— une barre de mise en forme Markdown façon Word pour Obsidian

> Gras, italique, souligné, surlignage, police, titres, listes, tableaux, encadrés et emoji —— **un clic sur un bouton suffit, plus besoin de taper la syntaxe Markdown**.  
> **Pas d'IA. Pas de réseau. Pas de télémétrie. Pas de compte.**

[![Privacy](https://img.shields.io/badge/privacy-no%20AI%20%C2%B7%20no%20network%20%C2%B7%20no%20telemetry-brightgreen)](#compatibility)
[![Last commit](https://img.shields.io/github/last-commit/AwesomeDog/obsidian-awesome-format-bar?label=last%20commit)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/commits/main)
[![Obsidian](https://img.shields.io/badge/Obsidian-1.13.7%2B-7C3AED)](https://obsidian.md)
[![GitHub release](https://img.shields.io/github/v/release/AwesomeDog/obsidian-awesome-format-bar)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/releases/latest)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&query=%24%5B%22awesome-format-bar%22%5D.downloads&label=downloads&color=573E7A)](https://obsidian.md/plugins?id=awesome-format-bar)
[![Commands](https://img.shields.io/badge/commands-100+-informational)](#full-command-reference)
[![i18n](https://img.shields.io/badge/languages-9-success)]()
[![Stars](https://img.shields.io/github/stars/AwesomeDog/obsidian-awesome-format-bar?style=social)](https://github.com/AwesomeDog/obsidian-awesome-format-bar/stargazers)

[English](../../README.md) · **Français** (cette page) —— Cette page est une traduction du README anglais, **la version anglaise fait foi**.

🌍 L'interface est disponible en neuf langues : **English、简体中文、繁體中文、日本語、한국어、Deutsch、Français、Español、Русский**（elle suit automatiquement la langue d'Obsidian）.

**Awesome Format Bar** est un **plugin de barre de mise en forme（ruban）pour [Obsidian](https://obsidian.md)**. Il superpose à vos notes une **barre d'outils** familière, façon Word, pour que la mise en forme courante soit à un clic —— tandis que votre coffre reste 100 % texte brut.

Tout ce que la barre écrit est du **Markdown standard**, du **Markdown saveur Obsidian**, ou —— là où le Markdown n'a simplement pas de syntaxe（souligné, exposant, indice, alignement du texte, couleur du texte, police, taille de police）—— un peu de **HTML en ligne** qu'Obsidian affiche nativement.

*Vous cherchez un **plugin de barre d'outils pour Obsidian**, une **barre de format**, une **barre d'outils d'éditeur**, une **barre d'édition façon texte enrichi / WYSIWYG**, des **boutons de mise en forme Markdown**, un **sélecteur d'emoji**, un **éditeur de tableaux**, ou un **ruban façon Microsoft Word pour Obsidian** ? C'est ce plugin.*

<p align="center">
  <img src="../img/light.png" alt="Awesome Format Bar for Obsidian —— barre de mise en forme Markdown façon Word, avec Gras, Italique, Souligné, Surligner, Couleur de police, Titres, Listes et Tableaux（thème clair）">
</p>

---

## Sommaire

- [Pourquoi une barre de mise en forme dans Obsidian](#pourquoi-une-barre-de-mise-en-forme-dans-obsidian)
- [En un coup d'œil](#en-un-coup-dœil)
- [Fonctionnalités](#fonctionnalités)
- [Liste complète des commandes](#liste-complète-des-commandes)
- [Installation](#installation)
- [Premiers pas](#premiers-pas)
- [Paramètres](#paramètres)
- [Compatibilité](#compatibilité)
- [Questions fréquentes](#questions-fréquentes)
- [Développement](#développement)
- [Publication](#publication)
- [Mots-clés](#mots-clés)

---

## Pourquoi une barre de mise en forme dans Obsidian

Obsidian est rapide **à condition** de déjà parler Markdown. Pour tous les autres —— étudiants, auteurs venus de Word ou Google Docs, équipes qui forment de nouveaux preneurs de notes —— la syntaxe est un mur.

- **Aucune syntaxe à mémoriser.** Sélectionnez du texte, cliquez sur **Gras**. C'est tout.
- **Les termes Word que vous connaissez déjà.** Onglets Accueil / Insertion / Affichage / Tableau, « Effacer la mise en forme », « Modifier la casse », « Volet de navigation ».
- **Découvrez ce qu'Obsidian sait faire.** Encadrés, références de bloc, incorporations, blocs de formule et étiquettes ont tous un bouton —— des fonctions que bien des utilisateurs ne trouvent jamais dans la syntaxe.
- **Faites ce que Markdown ne peut pas.** Souligné, exposant, indice, alignement des paragraphes, couleurs du texte et du surlignage, police et taille de police, écrits en HTML en ligne propre.
- **Du texte brut pour toujours.** Pas de format propriétaire, pas de base de données, pas d'enfermement —— vos notes restent de simples fichiers `.md`.
- **Hors ligne et privé.** Aucun appel réseau, aucun compte, aucune télémétrie. La bibliothèque d'environ 2 150 emoji est livrée dans le plugin.
- **Aussi pensé pour le clavier.** Désactivez les trois positions de la barre et l'interface disparaît complètement —— les 105 commandes enregistrées dans la palette restent disponibles et peuvent être associées à vos propres raccourcis.

## En un coup d'œil

|                        |                                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| **Positions**          | Ruban en haut, barre flottante au-dessus de la sélection, barre en bas —— à combiner librement |
| **Commandes**          | **115** intégrées, dont **105** dans la palette de commandes pour des raccourcis personnalisés |
| **Onglets**            | Accueil · Insertion · Affichage · Tableau · Utilitaires · **Épinglé**      |
| **Encadrés**           | Les 12 types d'encadrés Obsidian dans une seule liste déroulante            |
| **Emoji et symboles**  | Environ 2 150 emoji, kaomoji et symboles, entièrement hors ligne            |
| **Édition de tableau** | Insérer / supprimer / déplacer lignes et colonnes, aligner, trier, remettre en forme, coller en tant que tableau |
| **Boutons personnalisés** | Épinglez **n'importe quelle** commande —— du cœur, de ce plugin ou d'un autre plugin |
| **Configuration**      | Aucune. Suit le thème, prêt à l'emploi                                      |
| **Requis**             | Obsidian **1.13.7 et plus**                                                |

---

## Fonctionnalités

### 🧭 Trois positions de barre, à combiner librement

- **Ruban（Haut）** —— la barre complète à onglets, épinglée au-dessus de l'éditeur. *Activée par défaut.*
- **Flottante** —— une barre compacte qui suit votre sélection, comme la barre de sélection de Word ou Google Docs. **La barre flottante ne recouvre jamais ce que vous êtes en train de modifier.**
- **Bas** —— une barre compacte épinglée en bas de l'éditeur.

Chaque position s'active indépendamment : vous pouvez n'utiliser que la barre flottante, que le ruban, ou les trois.

### 🅰️ 115 commandes de mise en forme dans une disposition familière

Gras, Italique, Souligné, Barré, Code en ligne, Formule en ligne, Surligner（avec couleur）, Couleur de police, **Police**, **Taille de police**, Effacer la mise en forme, Modifier la casse, Titre 1 à 6, listes à puces / numérotées / de tâches, Citation, retraits, Ligne horizontale, Annuler / Rétablir, Rechercher et remplacer, alignement des paragraphes —— regroupés exactement là où un utilisateur de Word les attend.

### 💬 Sélecteur d'encadrés —— les 12 types d'encadrés Obsidian

Un seul bouton **Encadré** ouvre une liste déroulante avec `note`、`abstract`、`info`、`tip`、`success`、`question`、`warning`、`failure`、`danger`、`bug`、`example` et `quote`. Fini les recherches sur la syntaxe `> [!tip]`.

### 😀 Sélecteur d'emoji, de kaomoji et de symboles hors ligne（environ 2 150 entrées）

Un panneau **Emoji et symboles** recherchable, avec trois sources —— emoji, kaomoji et symboles typographiques —— fournies avec le plugin. L'insertion se fait au curseur ou sur la sélection en une seule étape d'annulation, chaque source conserve son propre groupe « fréquemment utilisés », et le panneau reste ouvert pour insérer plusieurs caractères à la suite.

### 📊 Éditeur de tableaux Markdown

Insérer et supprimer des lignes ou des colonnes, déplacer lignes et colonnes, aligner les colonnes à gauche / au centre / à droite, trier les lignes, remettre en forme（pretty-print）les tableaux —— plus **Coller en tant que tableau**, qui transforme un texte du presse-papiers séparé par des tabulations ou des virgules（tout droit sorti d'Excel, Numbers ou Google Sheets）en un tableau Markdown aligné.

### 📌 Épinglez n'importe quelle commande —— y compris celles d'autres plugins

L'onglet **Épinglé** transforme la barre en votre propre lanceur : choisissez n'importe quelle commande de la palette（cœur d'Obsidian, autre plugin communautaire, ou ce plugin）, choisissez une icône, glissez pour réorganiser. Si le plugin d'origine est désactivé, le bouton se contente de griser —— votre épingle est conservée.

### 👁️ Outils de lecture, de concentration et de plan

**Afficher les espaces**（des points pour les espaces, des flèches pour les tabulations, des marqueurs orange pour les espaces insécables / idéographiques / demi-cadratin et cadratin）、**Afficher les numéros de ligne**、**Largeur de ligne lisible**、**Volet de navigation**（le plan d'Obsidian）、**Zoom avant / arrière**、**Fractionner vers la droite / vers le bas**、**Réduire / Développer（tout）**、**Mode focus**（replier les deux barres latérales）, **Mode zen**（plein écran véritable）et **Mode machine à écrire**（la ligne du curseur reste au milieu, mise en évidence, le reste estompé）.

### 📑 Une table des matières en un clic

**Table des matières** écrit le plan de votre note après le paragraphe où se trouve le curseur : un titre `**Table des matières**` en gras, puis un lien `- [[#Titre|Titre]]` imbriqué par titre. Les titres situés dans un bloc de code ou cités dans un encadré sont ignorés. C'est un instantané, pas un champ dynamique —— relancez la commande après modification et supprimez l'ancienne.

### 🧹 Utilitaires de lignes et de listes

**Fusionner les lignes**、**Diviser les lignes**（au signe de ponctuation le plus fréquent dans la sélection）、**Inverser les lignes** —— aucun des trois ne franchit une ligne vide ou un bloc de code —— plus **Trier la liste**（niveau par niveau, enfants et corps conservés, éléments numérotés renumérotés）et **Trier les titres**（réordonne le plan et emporte le corps de chaque section avec lui）.

### 🎨 Zéro configuration, sensible au thème

Une disposition fixe et sobre qui hérite de votre thème Obsidian actif, en mode clair comme en mode sombre. La seule chose à organiser, c'est votre onglet Épinglé.

---

## Liste complète des commandes

105 des 115 commandes sont enregistrées dans la **palette de commandes**, vous pouvez donc leur attribuer vos propres raccourcis clavier.（Les conteneurs déroulants et le panneau Emoji et symboles n'existent que dans la barre d'outils.）

### Accueil

- **Presse-papiers** —— Coller, Couper, Copier, Coller en texte brut
- **Police** —— Police, Taille de police, Gras, Italique, Souligné, Barré, Indice, Exposant, Code en ligne, Formule en ligne, Surligner, Couleur de surlignage, Couleur de police, Effacer la mise en forme, Modifier la casse
- **Paragraphe** —— Liste à puces / Liste numérotée / Liste de tâches, Citation, Diminuer / Augmenter le retrait, Renuméroter la liste, Trier les paragraphes, Monter / Descendre d'une ligne, Aligner à gauche / Centrer / Aligner à droite / Justifier, Ligne horizontale
- **Styles** —— Titre 1 à 6, Supprimer le titre
- **Édition** —— Annuler, Rétablir, Rechercher et remplacer

### Insertion

Lien interne, Lien externe, Incorporer, Étiquette, Référence de bloc, **Encadré ▼**（Note, Résumé, Info, Astuce, Succès, Question, Avertissement, Échec, Danger, Bogue, Exemple, Citation）, Bloc de code, Bloc de formule, Tableau, Convertir le texte en tableau, Commentaire, Joindre un fichier, **Emoji et symboles**, Date et heure, **Table des matières**, Note de bas de page.

### Affichage

- **Afficher** —— Afficher les espaces, Afficher les numéros de ligne, Largeur de ligne lisible, Volet de navigation（le plan d'Obsidian）
- **Zoom** —— Zoom avant, Zoom arrière, 100 %
- **Fenêtre** —— Fractionner vers la droite, Fractionner vers le bas
- **Plan** —— Réduire, Développer, Tout réduire, Tout développer
- **Immersion** —— Mode focus, Mode zen, Mode machine à écrire

### Tableau

Disponible dès que le curseur se trouve dans un tableau : Supprimer des lignes ou des colonnes, Insérer des lignes au-dessus / en dessous, Insérer des colonnes à gauche / à droite, Déplacer la ligne vers le haut / vers le bas, Déplacer la colonne vers la gauche / vers la droite, Mettre en forme les tableaux, Aligner la colonne à gauche / Centrer la colonne / Aligner la colonne à droite, Trier les lignes, **Convertir en texte**.
**Convertir en texte** écrit le tableau sous forme de lignes séparées par des tabulations —— l'exact inverse de **Convertir le texte en tableau**（Insertion · Blocs）, qui transforme un texte séparé par des tabulations ou des virgules en tableau Markdown aligné. **Coller en tant que tableau** fait la même chose avec le presse-papiers et fonctionne partout.

### Utilitaires

**Fusionner les lignes** rassemble une série de lignes en une seule ; **Diviser les lignes** les coupe au signe de ponctuation le plus fréquent dans la sélection ; **Inverser les lignes** inverse l'ordre de chaque série. Aucun des trois ne franchit une ligne vide ou un bloc de code.
**Trier la liste** trie une liste niveau par niveau —— chaque élément conserve son propre corps et ses propres enfants, et les éléments numérotés ressortent renumérotés. **Trier les titres** réordonne chaque niveau du plan de la note et emporte le corps de chaque section avec lui.
**Coller l’URI comme lien** entoure le texte sélectionné avec l’URI du presse-papiers. **Ponctuation intelligente** et **Espacement CJK** normalisent le texte sélectionné, tandis que **Nettoyer** regroupe les actions courantes de nettoyage Markdown dans un même menu.

### Épinglé

Vos propres commandes, avec vos propres icônes. Voir [Premiers pas](#premiers-pas).

### Panneau Emoji et symboles

| Source  | Entrées（environ） | Exemples de groupes                                    |
| ------- | ----------------- | ------------------------------------------------------ |
| Emoji   | ~1 900            | Smileys & People, Animals & Nature, Food & Drink, Objects, Flags |
| Kaomoji | ~70               | Emotion, Animal, Behavior, People, Holiday             |
| Symboles | ~200             | Arrows, Math, Typographic, Currency, Enclosed, Dingbats |

Toutes les données sont fournies avec le plugin : le sélecteur fonctionne donc entièrement hors ligne.

---

## Installation

Requiert Obsidian **1.13.7 ou version ultérieure**.

**Depuis les plugins communautaires（recommandé）**
Paramètres → **Plugins communautaires** → **Parcourir** → recherchez **« Awesome Format Bar »** → **Installer** → **Activer**.

**Avec BRAT（versions bêta）**
Installez [BRAT](https://github.com/TfTHacker/obsidian42-brat), lancez *BRAT: Add a beta plugin*, et collez l'URL de ce dépôt.

**Manuellement**
Téléchargez `main.js`、`manifest.json` et `styles.css` depuis une version publiée dans `<coffre>/.obsidian/plugins/awesome-format-bar/`, puis activez le plugin dans Paramètres → Plugins communautaires.

## Premiers pas

1. Ouvrez **Paramètres → Awesome Format Bar** et activez les positions souhaitées : **Haut**、**Flottante**、**Bas**.
2. Le **ruban（Haut）** comporte six onglets ; le dernier, **Épinglé**, contient les commandes que vous épinglez vous-même. Tant qu'il est vide, il affiche un rappel renvoyant vers les paramètres.
3. Les **barres compactes**（Flottante / Bas）n'emportent qu'un sous-ensemble fixe de commandes ; ce qui ne tient pas se replie dans le menu `⋯`.
4. Épinglez des commandes sous **Paramètres → Épinglé** : ajouter（choisir une commande, puis une icône）, changer l'icône, glisser pour réorganiser, ou supprimer. Les commandes épinglées se comportent exactement comme leurs équivalents de la palette.
5. Vous préférez le clavier ? Désactivez **les trois positions** et la barre disparaît entièrement de l'interface —— le plugin n'ajoute alors plus rien à votre écran, tandis que les **105 commandes enregistrées dans la palette** continuent de fonctionner et peuvent être associées à vos propres raccourcis dans **Paramètres → Raccourcis**. Autrement dit : vous pouvez l'utiliser comme un simple lot de commandes et de raccourcis, sans jamais cliquer sur un bouton.

## Paramètres

| Section          | Contenu                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| **Barre d'outils** | Interrupteurs indépendants pour Haut / Flottante / Bas                                                    |
| **Épinglé**      | Vos commandes épinglées —— ajouter, changer l'icône, réorganiser, supprimer                                |
| **Tableau**      | Entrée passe à la ligne suivante ; Tab / Shift+Tab passent d'une cellule à l'autre et Tab au bord droit ajoute une colonne ; Remplir les cellules avec des espaces ; Trier au clic sur l'en-tête en mode lecture（ne modifie jamais le fichier） |

## Compatibilité

- Obsidian **1.13.7 et plus**
- Fonctionne avec l'éditeur Markdown et s'adapte à votre thème actif, en mode clair comme en mode sombre.
- Pas d'IA, aucun accès réseau, aucun compte, aucune télémétrie —— tout s'exécute localement.
- La version publiée ne contient que trois fichiers : `main.js`、`manifest.json`、`styles.css`.

---

## Questions fréquentes

**Est-ce que cela transforme Obsidian en éditeur WYSIWYG ou en éditeur de texte enrichi ?**
Non —— et c'est justement le but. C'est une **barre d'outils** posée sur l'éditeur d'Obsidian. Vos fichiers restent du Markdown brut.

**Dois-je maintenant apprendre la syntaxe Markdown pour utiliser Obsidian ?**
Non. Gras, titres, listes, liens, tableaux, encadrés, blocs de code et formules sont tous des boutons.

**Qu'est-ce qui est exactement écrit dans mes notes ?**
Du Markdown standard et du Markdown saveur Obsidian. Ce n'est que là où le Markdown n'a pas de syntaxe —— souligné, exposant, indice, alignement des paragraphes, couleurs du texte et du surlignage, police et taille de police —— que le plugin émet quelques balises HTML en ligne standard, qu'Obsidian affiche nativement.

**Puis-je continuer à utiliser mes raccourcis clavier ?**
Oui. 105 des 115 commandes apparaissent dans la palette de commandes et peuvent être associées à n'importe quel raccourci.

**Je suis un adepte du clavier —— puis-je masquer complètement la barre d'outils ?**
Oui, et vous ne perdez rien à le faire. Désactivez les trois positions（**Haut / Flottante / Bas**）dans **Paramètres → Awesome Format Bar** et le plugin ne laisse aucune trace à l'écran : ni ruban, ni barre flottante, ni barre en bas. Les **105 commandes enregistrées dans la palette** fonctionnent toutes encore, depuis la palette de commandes ou depuis un raccourci que vous attribuez dans **Paramètres → Raccourcis** —— y compris des commandes pour lesquelles Obsidian n'a aucun raccourci intégré, comme la Couleur de police, la Couleur de surlignage, Modifier la casse, les Encadrés, Trier les lignes et les utilitaires de lignes. Voyez-y une couche clavier facultative, à activer dès que la souris commence à sembler lente.

**Puis-je ajouter des boutons pour les commandes d'autres plugins ?**
Oui —— c'est l'onglet **Épinglé**. Épinglez n'importe quelle commande de la palette et choisissez une icône. Si le plugin propriétaire est désactivé, le bouton se grise et l'épingle est conservée.

**Le sélecteur d'emoji a-t-il besoin d'une connexion Internet ?**
Non. Les quelque 2 150 emoji, kaomoji et symboles sont tous fournis avec le plugin.

**Le plugin utilise-t-il l'IA, ou contacte-t-il des serveurs d'une manière ou d'une autre ?**
Non. Aucune fonction d'IA, aucune clé d'API, aucune requête réseau, aucune analyse d'usage et aucune télémétrie nulle part dans le code —— le plugin ne fait que lire et écrire vos fichiers `.md` locaux, et rien d'autre. La bibliothèque d'emoji est fournie avec le plugin : il fonctionne donc même en avion.

**Trier un tableau en mode lecture modifie-t-il mon fichier ?**
Non. Le tri au clic sur l'en-tête en mode lecture est purement visuel et ne modifie jamais la note.

**Puis-je masquer la barre d'outils quand je veux un écran épuré ?**
Oui —— désactivez n'importe quelle position dans les paramètres, ou les trois pour la masquer entièrement（voir la question sur le clavier ci-dessus pour ce qui reste utilisable）.

**Est-ce configurable ?**
Délibérément minimal : la disposition est fixe et suit le thème, pour paraître toujours native. L'onglet Épinglé, lui, vous appartient.

---

## Développement

```shell
npm install        # installer les dépendances
npm run dev        # construire en mode surveillance
npm run build      # vérification des types + tests + build de production
npm run test       # exécuter les tests unitaires
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run deploy -- /path/to/vault   # copier main.js, manifest.json, styles.css dans un coffre
```

La version publiée ne contient que trois fichiers : `main.js`、`manifest.json` et `styles.css`.

## Publication

```shell
npm version patch                    # incrémente package.json, manifest.json, versions.json ; commit et tag
git push origin main --follow-tags   # pousse le commit et le tag
```

`npm version` exige un arbre de travail propre. Le tag ne porte pas de préfixe `v` —— il doit être égal au `version` de `manifest.json`, sinon le workflow de publication le rejette.

Pousser le tag déclenche `.github/workflows/release.yml`, qui construit le plugin et ouvre une version **brouillon** avec `main.js`、`manifest.json` et `styles.css` en pièces jointes. Publiez le brouillon pour rendre la version disponible.

---

## Mots-clés

Plugin de barre d'outils Obsidian · barre de mise en forme Obsidian · barre de format Obsidian · barre d'outils Markdown · boutons de mise en forme Markdown · ruban façon Word pour Obsidian · barre d'outils de texte enrichi · barre d'édition WYSIWYG · barre d'outils d'éditeur · barre de sélection flottante · couleur du texte et surlignage dans Obsidian · souligné / exposant / indice en Markdown · alignement du texte · sélecteur d'encadrés · sélecteur d'emoji · kaomoji · sélecteur de symboles · éditeur de tableaux Markdown · trier un tableau · coller en tant que tableau · générateur de table des matières · épingler des commandes · Obsidian pour débutants · édition Markdown sans syntaxe

**Autres langues / Other languages:**
Obsidian 工具栏插件、格式栏、富文本工具栏、Markdown 快捷按钮、表情符号选择器、表格编辑 ·  
Obsidian 工具列外掛、格式列 ·  
Obsidian ツールバー・書式設定バー・絵文字ピッカー ·  
Obsidian 툴바 · 서식 도구 모음 ·  
Obsidian Symbolleiste / Formatierungsleiste ·  
Barre d'outils / barre de mise en forme pour Obsidian ·  
Barra de herramientas / barra de formato para Obsidian  
Панель инструментов / панель форматирования для Obsidian
