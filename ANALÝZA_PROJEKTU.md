# Kompletní Analýza Projektu HeroVault - D&D Portal

## 📋 Přehled projektu

**Název:** HeroVault - D&D Character Manager  
**Typ:** Frontend webová aplikace pro správu postav a obsahu Dungeons & Dragons  
**Stav:** Ve vývoji - serverová část byla odstraněna, aplikace funguje jako frontend-only

---

## 🏗️ Architektura projektu

### Struktura složek

```
dnd-portal/
├── client/              # Frontend aplikace
│   ├── css/            # Styly (14+ souborů CSS)
│   ├── js/             # JavaScript logika (7 souborů)
│   ├── pages/          # HTML stránky
│   │   ├── create/     # Formuláře pro vytváření obsahu
│   │   └── *.html      # Hlavní stránky
│   ├── componenty.html # Dokumentace komponent
│   └── index.html      # Hlavní stránka
├── server/             # PRÁZDNÉ - server byl odstraněn
└── uploads/            # Složka pro nahrávané soubory
```

---

## 🛠️ Technologický stack

### Frontend technologie

1. **HTML5** - Semantické značky, datalisty
2. **CSS3** - Custom properties (CSS variables), Flexbox, Grid
3. **Vanilla JavaScript (ES6+)** - Bez frameworku, čistý JS
4. **TinyMCE 6** - Rich text editor pro popisy
5. **Font Awesome 6.0.0** - Ikony
6. **Google Fonts:**
   - Cinzel (serif, pro nadpisy)
   - Roboto (sans-serif, pro text)
   - Bahiana (dekorativní)

### Externí závislosti

- TinyMCE CDN: `https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js`
- Font Awesome CDN
- Google Fonts API

---

## 📁 Hlavní komponenty aplikace

### 1. **Navigační struktura**

**Hlavní stránky:**
- `index.html` - Domovská stránka s přehledem sekcí
- `charakters.html` - Správa postav
- `collection.html` - Knihovna obsahu
- `creation.html` - Vytváření postav
- `campaigns.html` - Správa kampaní
- `create.html` - Menu pro vytváření obsahu
- `browse.html` - Procházení a vyhledávání
- `dm-board.html` - Deska pro DM (Dungeon Master)

### 2. **Formuláře pro vytváření obsahu** (`pages/create/`)

- `create-monster.html` - Vytváření nestvůr
- `create-class.html` - Vytváření tříd
- `create-spell.html` - Vytváření kouzel
- `create-item.html` - Vytváření předmětů
- `create-rase.html` - Vytváření ras (chyba: "rase" místo "race")
- `create-background.html` - Vytváření pozadí
- `create-feat.html` - Vytváření featů
- `create-subclass.html` - Vytváření podtříd
- `create-pet.html` - Vytváření mazlíčků
- `create-faith.html` - Vytváření víry/náboženství

### 3. **JavaScript moduly** (`js/`)

#### `app.js` - Hlavní aplikace
- **Třída:** `HeroVault`
- **Funkce:**
  - Správa navigace mezi stránkami
  - Event listeners pro karty
  - Keyboard navigation
  - Loading states
  - Modal windows
  - Profile management
  - Particle effects integration
- **Status:** Funkční, ale navigace zobrazuje pouze modaly (není dokončená)

#### `create-item.js` - Logika pro vytváření předmětů
- Dynamické zobrazování polí podle typu předmětu
- Podmíněné zobrazení sekcí (Armor AC, Weapon details, Range)
- Normalizace vstupů (trim, lowercase)

#### `dm-board.js` - DM deska
- **Storage:** localStorage (`dmBoardState`)
- **Funkce:**
  - Správa složek (folders)
  - Drag & drop pro přeskupování
  - Karty (notes) v rámci složek
  - 7 výchozích složek: Items, Players, World, Notes, Beasts, NPC, Initiative
- **State management:** Kompletní, funkční

#### `datalists-loader.js` - Dynamické načítání datalistů
- Asynchronní načítání `datalists.html`
- Parsing HTML pomocí DOMParser
- Automatické přidávání datalistů do DOM

#### `multiselect.js` - Multi-select komponenta
- Tag-based selection
- Keyboard support (Enter, Comma, Backspace)
- Integrace s datalisty
- Dynamické přidávání/odstraňování tagů

#### `filter.js` - Filtrovací systém
- Třída: `FilterSystem`
- Modal pro filtry
- Kategorické filtry (implementace částečná)

#### `tinymce-config.js` - Konfigurace TinyMCE
- Dark theme
- Minimalistický toolbar
- Selektory pro různé textarea elementy

#### `particles.js` - Partikulární efekty
- (Není přečten, ale je referencován)

---

## 🎨 Design a styling

### Design systém

**Barevná paleta (CSS variables):**
- `--primary-gold: #d4af37` - Hlavní zlatá barva
- `--secondary-gold: #b8941f` - Sekundární zlatá
- `--dark-bg: #0a0a0a` - Tmavé pozadí
- `--card-bg: #1a1a1a` - Pozadí karet
- `--text-light: #ffffff` - Světlý text
- `--text-muted: #cccccc` - Matný text

**Typografie:**
- Nadpisy: Cinzel (serif, dekorativní)
- Text: Roboto (sans-serif, čitelný)

**Styl:**
- Dark theme s gradient pozadím
- Zlaté akcenty (D&D téma)
- Glassmorphism efekty
- Card-based layout
- Responsive design (částečně)

### CSS soubory

14 specializovaných CSS souborů:
- `style.css` - Základní styly
- `Index.css` - Hlavní stránka
- `create-*.css` - Styly pro jednotlivé formuláře
- `browse.css`, `campaigns.css`, `charakters.css`, atd.

---

## 💾 Datové modely

### Datalisty (`datalists.html`)

Predefinované seznamy hodnot:
- Alignments (zarovnání)
- Classes (typ kouzlení)
- Skills (dovednosti)
- Languages (jazyky)
- Stats (statistiky)
- Item types, Rarity, Weapon types
- Resistances, Vision types
- Monster ratings (CR 0-30)
- Die types (d4-d20)

### Storage mechanismy

1. **localStorage** (používáno v `dm-board.js`)
   - Klíč: `dmBoardState`
   - Formát: JSON
   - Obsahuje: Složky, karty, pořadí, aktivní složku

2. **Žádné backendové API**
   - Všechny formuláře momentálně neukládají data
   - Chybí integrace se serverem

---

## ⚠️ Zjištěné problémy a nedostatky

### Kritické problémy

1. **Chybí backend**
   - Serverová složka byla odstraněna (podle git status)
   - Formuláře nemají endpointy pro ukládání
   - Žádné API volání v kódu

2. **Data se neukládají**
   - Vytvořené postavy, předměty, atd. se neukládají
   - Pouze DM Board ukládá do localStorage

3. **Chybějící funkčnost**
   - Navigace zobrazuje pouze modaly s "Coming soon"
   - Většina stránek pravděpodobně nemá implementovanou logiku

### Střední problémy

4. **Chyby v pojmenování**
   - `create-rase.html` místo `create-race.html` (čeština v anglickém kódu)

5. **Nekonzistentní navigace**
   - Některé odkazy vedou na HTML soubory
   - Jiné používají JavaScript navigaci (nefunkční)

6. **Chybí error handling**
   - Většina async operací nemá proper error handling
   - localStorage může selhat (kontroluje se pouze v dm-board.js)

7. **Žádné validace formulářů**
   - Chybí validace vstupů
   - Formuláře se mohou odeslat s prázdnými/neplatnými daty

### Drobné problémy

8. **CSS organizace**
   - Mnoho CSS souborů, potenciálně duplicitní styly
   - Žádná metodologie (BEM, OOCSS, atd.)

9. **JavaScript organizace**
   - Chybí modulární struktura
   - Některé funkce jsou globální
   - Žádný build process

10. **Žádná dokumentace**
    - Chybí README
    - Chybí komentáře v kódu (částečně)

---

## ✅ Silné stránky projektu

1. **Pěkný design**
   - Konzistentní dark theme
   - Dobře navržená UI/UX
   - Responsive prvky

2. **Komponentová architektura**
   - Opakovatelné komponenty (input, multiselect)
   - Komponenty dokumentovány v `componenty.html`

3. **Moderní JavaScript**
   - ES6+ syntax
   - Async/await
   - Třídy a moduly

4. **Funkční DM Board**
   - Kompletní implementace s localStorage
   - Drag & drop
   - Organizace do složek

5. **Bohaté formuláře**
   - Podrobné formuláře pro všechny typy obsahu
   - Datalisty pro konzistentní vstupy
   - TinyMCE pro rich text

---

## 🎯 Funkční oblasti

### ✅ Implementováno

- ✅ UI/UX design
- ✅ Navigační struktura
- ✅ Formuláře pro vytváření obsahu
- ✅ DM Board s localStorage
- ✅ Multi-select komponenta
- ✅ TinyMCE integrace
- ✅ Dynamické načítání datalistů

### ❌ Neimplementováno / Nefunkční

- ❌ Ukládání dat (backend)
- ❌ Načítání dat (API)
- ❌ Správa postav (funkční logika)
- ❌ Správa kampaní
- ❌ Procházení a vyhledávání (UI existuje, logika chybí)
- ❌ Autentizace uživatelů
- ❌ Sdílení obsahu
- ❌ Export/import dat

---

## 📊 Statistiky projektu

- **HTML stránek:** ~20+
- **CSS souborů:** 14
- **JavaScript souborů:** 7
- **Řádků kódu:** ~3000-4000 (odhad)
- **Závislosti:** 3 externí (TinyMCE, Font Awesome, Google Fonts)

---

## 🔄 Doporučení pro další vývoj

### Krátkodobé (1-2 týdny)

1. **Implementovat backend**
   - REST API (Node.js/Express nebo jiný stack)
   - Databáze (SQLite/PostgreSQL/MongoDB)
   - Autentizace (JWT)
   - CRUD operace pro všechny entity

2. **Připojit frontend k API**
   - Fetch/Axios pro API volání
   - Error handling
   - Loading states
   - Success notifications

3. **Dokončit funkční logiku**
   - Validace formulářů
   - Ukládání vytvořeného obsahu
   - Zobrazení uložených dat

### Střednědobé (1 měsíc)

4. **Refaktorování**
   - Modularizace JavaScriptu
   - CSS metodologie (BEM)
   - Build process (Webpack/Vite)
   - TypeScript (volitelně)

5. **Testování**
   - Unit testy (Jest/Vitest)
   - E2E testy (Cypress/Playwright)
   - Validace formulářů

6. **Dokumentace**
   - README s instrukcemi
   - API dokumentace
   - Komentáře v kódu

### Dlouhodobé (2-3 měsíce)

7. **Pokročilé funkce**
   - Export/import postav (JSON/PDF)
   - Sdílení obsahu mezi uživateli
   - Offline mode (Service Workers)
   - Progressive Web App (PWA)

8. **Optimalizace**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching strategie

9. **Bezpečnost**
   - XSS ochrana
   - CSRF tokens
   - Input sanitization
   - Rate limiting

---

## 🛠️ Technické detaily

### Formulářové komponenty

**Text Input:**
```html
<div class="text-input">
    <div>Label</div>
    <input list="list-id" placeholder="...">
</div>
```

**Multi-select:**
```html
<div class="multiselect-container">
    <div>Label</div>
    <div class="selected-tags">
        <input type="text" class="multiselect-input">
    </div>
</div>
```

**Textarea (TinyMCE):**
```html
<div class="description">
    <div>Label</div>
    <textarea id="text"></textarea>
</div>
```

### State management

- **Globální state:** Chybí (pouze lokální v jednotlivých skriptech)
- **localStorage:** Pouze DM Board
- **Session storage:** Nepoužívá se

### Event handling

- Event listeners přidávány při DOMContentLoaded
- Některé funkce jsou globální (např. `editProfile()`)
- Chybí event delegation na vyšších úrovních

---

## 📝 Závěr

**HeroVault** je ambiciózní projekt pro správu D&D obsahu s pěkným designem a solidním základem. Projekt má funkční UI/UX, ale chybí mu backendová implementace a propojení mezi frontendem a datovým úložištěm. 

**Hlavní výzvy:**
1. Implementace backendu a databáze
2. Připojení formulářů k API
3. Dokončení funkční logiky pro všechny sekce

**Potenciál:**
- Projekt má dobrý základ pro pokračování
- Design je profesionální a konzistentní
- Architektura je rozumná (i když potřebuje refaktoring)

**Doporučení:**
Začít s implementací základního backendu a API, poté postupně propojit jednotlivé sekce aplikace.

---

*Analýza provedena: 2025*  
*Verze projektu: Vývojová verze (bez backendu)*

