# Centralizované Datalisty

Tento systém umožňuje spravovat všechny datalisty na jednom místě.

## 📁 Struktura

- **`datalists.html`** - Centrální soubor se všemi datalisty
- **`datalists-loader.js`** - JavaScript pro automatické načtení datalistů

## 🚀 Použití

### 1. Přidat do HTML stránky

Na konec souboru (před `</body>`) přidej:

```html
<!-- Load centralized datalists -->
<script src="/client/js/datalists-loader.js"></script>
```

### 2. V HTML použij datalist

```html
<input list="list-sizes" placeholder="-">
<!-- nebo -->
<input list="list-alignment" placeholder="-">
```

## 📋 Dostupné datalisty

### Univerzální (nové ID)
- `list-sizes` - Velikosti (Tiny, Small, Medium, Large, Huge, Gargantuan)
- `list-alignment` - Alignmenty (Lawful Good, Chaotic Evil, atd.)

### Specifické
- `list-monsters-rating` - Challenge Rating (0, 1/8, 1/4, 1/2, 1-30)
- `list-die` - Typ kostek (d4, d6, d8, d10, d12, d20)
- `list-non-caster` - Class features

### Legacy ID (pro zpětnou kompatibilitu)
- `list-monsters-sizes` / `list-pets-sizes` - Velikosti
- `list-monsters-aligment` / `list-pets-aligment` - Alignmenty

## ✏️ Přidání nového datalistu

1. Otevři `client/pages/datalists.html`
2. Přidej nový `<datalist>`:

```html
<datalist id="list-muj-novy">
    <option value="Možnost 1"></option>
    <option value="Možnost 2"></option>
</datalist>
```

3. Datalist se automaticky načte do všech stránek, které mají `datalists-loader.js`

## 💡 Výhody

- ✅ **Jeden zdroj pravdy** - všechny datalisty na jednom místě
- ✅ **Snadná údržba** - změna na jednom místě se projeví všude
- ✅ **Žádné duplicity** - nemusíš kopírovat kód
- ✅ **Automatické načítání** - stačí přidat jeden script tag

## 🔍 Jak to funguje

1. `datalists-loader.js` se spustí při načtení stránky
2. Načte obsah `datalists.html` pomocí Fetch API
3. Vytvoří skrytý container `<div id="datalists-container">`
4. Vloží všechny datalisty do tohoto containeru
5. Datalisty jsou pak dostupné pro všechny inputy s atributem `list`

