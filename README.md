# Nathan Peterman Cup

Eine Fantasy Football Liga-Statistik-Webanwendung für den Nathan Peterman Cup. Diese Webseite zeigt umfassende Statistiken, Rekorde und historische Daten unserer Fantasy Football Liga.

## 🏈 Features

- **Liga-Übersicht**: Ewige Tabelle und Saison-Informationen
- **Saison-Details**: Playoff-Brackets, Regular Season Standings, wöchentliche Ergebnisse und Draft-Boards
- **Manager-Stats**: Individuelle Statistiken, Rekorde und Head-to-Head Records
- **Spieler-Daten**: Spielersuche mit interaktiven Retro-Trading-Cards
- **Rekorde**: Top Performances und historische Bestmarken

## 📊 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **CSS Framework**: Bootstrap 5.3
- **Datenbank**: Supabase
- **Hosting**: GitHub Pages
- **Weitere Libraries**: jQuery, DataTables

## 📁 Projektstruktur

```
npc/
├── assets/          # Bilder und Favicons
├── components/      # Wiederverwendbare Komponenten (Menü)
├── css/             # Stylesheets
│   ├── styles.css
│   └── saisons.css
├── js/              # JavaScript-Dateien
│   ├── script.js
│   ├── liga.js
│   ├── manager.js
│   ├── saisons.js
│   ├── spieler.js
│   ├── rekorde_manager.js
│   └── rekorde_spieler.js
├── pages/           # HTML-Seiten
│   ├── liga.html
│   ├── manager.html
│   ├── saisons.html
│   ├── spieler.html
│   ├── rekorde_manager.html
│   └── rekorde_spieler.html
├── index.html       # Startseite
└── README.md
```

## 🚀 Installation & Entwicklung

1. Repository klonen:
```bash
git clone https://github.com/mcescher7/npc.git
cd npc
```

2. Lokalen Server starten (z.B. mit Python):
```bash
python -m http.server 8000
```

3. Im Browser öffnen:
```
http://localhost:8000
```

## 🌐 Live-Version

Die Webseite ist live auf GitHub Pages verfügbar:
[https://mcescher7.github.io/npc/](https://mcescher7.github.io/npc/)

## ⚙️ Features im Detail

### Dark Mode
Die Seite unterstützt einen Dark/Light Mode Toggle, der die Präferenz im Browser speichert.

### Responsive Design
Vollständig responsive Layouts für Desktop, Tablet und Mobile.

### Interaktive Elemente
- Klickbare Tabellen für Details
- Filterbare Spieler-Rekorde nach Position
- Draft-Board mit Farbcodierung nach Position
- Animierte Trading Cards mit Flip-Effekt

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei.

## 👥 Mitwirkende

Entwickelt für die Nathan Peterman Cup Fantasy Football Liga.

---

**Live:** [mcescher7.github.io/npc](https://mcescher7.github.io/npc/)
