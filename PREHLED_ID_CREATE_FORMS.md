# Přehled ID u inputů ve formulářích create/

## ⚠️ Problémy nalezené:
1. **create-faith.html** - Duplicitní ID: `faith-description` se používá 2x (řádky 46 a 56)
2. Většina inputů nemá ID - pouze textarea a checkboxy mají ID

---

## 📋 Detailní přehled podle souboru:

### 1. **create-background.html**
**Inputy s ID:**
- `background-description` (textarea, ř. 46)
- `background-feat-description` (textarea, ř. 80)

**Inputy BEZ ID:**
- Background Name (input text)
- Background Skills (multiselect input)
- Background Tools (input text)
- Background Languages (multiselect input)
- Feature Name (input text)

---

### 2. **create-class.html**
**Inputy s ID:**
- `none-caster-checkbox` (checkbox, ř. 40)
- `pact-caster-checkbox` (checkbox, ř. 44)
- `full-caster-checkbox` (checkbox, ř. 49)
- `third-caster-checkbox` (checkbox, ř. 53)
- `half-caster-checkbox` (checkbox, ř. 58)
- `class-description` (textarea, ř. 69)

**Inputy BEZ ID:**
- Všechny `.num-input` v tabulkách (Proficiency Bonus, spell slots, atd.) - **ŽÁDNÉ ID**
- Inputy v tabulkách table-1 a table-2

---

### 3. **create-faith.html** ⚠️
**Inputy s ID:**
- `faith-description` (textarea, ř. 46) - **PRVNÍ VÝSKYT**
- `faith-description` (textarea, ř. 56) - **DRUHÝ VÝSKYT - DUPLICITA!**

**Inputy BEZ ID:**
- Faith Name (input text)
- Deity/Patron (input text s datalist)
- Deity/Patron Description (textarea - ale má stejné ID jako Faith Description!)

---

### 4. **create-feat.html**
**Inputy s ID:**
- `stats-checkbox` (checkbox, ř. 50)
- `feat-description` (textarea, ř. 46)

**Inputy BEZ ID:**
- Feat Name (input text)
- Chose stats (multiselect input)

---

### 5. **create-item.html**
**Inputy s ID:**
- `item-magic-checkbox` (checkbox, ř. 77)
- `item-description` (textarea, ř. 51)

**Inputy BEZ ID:**
- Item type (input text s datalist)
- Item name (input text)
- Weight (input text)
- Cost (input text)
- Rarity (input text s datalist)
- Armor AC (input text) - podmíněné zobrazení
- Weapon type (input text s datalist) - podmíněné zobrazení
- Dise trove (input text) - podmíněné zobrazení
- Die type (input text s datalist) - podmíněné zobrazení
- Range (input text) - podmíněné zobrazení

---

### 6. **create-monster.html**
**Inputy s ID:**
- `mythic-checkbox` (checkbox, ř. 208)
- `legendary-checkbox` (checkbox, ř. 218)
- `lair-checkbox` (checkbox, ř. 228)
- `traits` (textarea, ř. 184)
- `actions` (textarea, ř. 189)
- `bonus-actions` (textarea, ř. 194)
- `reactions` (textarea, ř. 199)
- `characteristics` (textarea, ř. 204)
- `mythic-actions` (textarea, ř. 214)
- `legendary-actions` (textarea, ř. 224)
- `lair` (textarea, ř. 234)
- `lair-actions` (textarea, ř. 239)

**Inputy BEZ ID:**
- Name (input text)
- Type (input text)
- Sub-type (input text)
- Habit (input text)
- Size (input text s datalist)
- Alignment (input text s datalist)
- Rating/CR (input text s datalist)
- STR, DEX, CON, INT, WIS, CHA (všechny inputy)
- Armor (input text)
- Armor type (input text)
- Initiative bonus (input text)
- Passive perception (input text)
- Average HP (input text)
- Die cout HP (input text)
- Die type (input text s datalist)
- HP Modifier (input text)
- Saving throw (input text)
- Resistance (input text)
- Immunities (input text)
- Vulnerabilities (input text)
- Condition immunities (input text)
- File upload (input file)

---

### 7. **create-pet.html**
**Inputy s ID:**
- `mythic-checkbox` (checkbox, ř. 175)
- `legendary-checkbox` (checkbox, ř. 185)
- `traits` (textarea, ř. 156)
- `actions` (textarea, ř. 161)
- `bonus-actions` (textarea, ř. 166)
- `reactions` (textarea, ř. 171)
- `mythic-actions` (textarea, ř. 181)
- `legendary-actions` (textarea, ř. 191)

**Inputy BEZ ID:**
- Name (input text)
- Type (input text)
- Sub-type (input text)
- Size (input text s datalist)
- Alignment (input text s datalist)
- STR, DEX, CON, INT, WIS, CHA (všechny inputy)
- Armor (input text)
- Initiative bonus (input text)
- Passive perception (input text)
- Average HP (input text)
- HP Modifier (input text)
- Saving throw (input text)
- Resistance (input text)
- Immunities (input text)
- Vulnerabilities (input text)
- Condition immunities (input text)
- Gear (input text)
- Language (input text)
- File upload (input file)

---

### 8. **create-rase.html** (race)
**Inputy s ID:**
- `race-description` (textarea, ř. 47)
- `race-traits` (textarea, ř. 85)

**Inputy BEZ ID:**
- Race Name (input text)
- Vision (input text s datalist)
- Type (input text)
- Speed (input text)
- Language (input text s datalist)
- Size (input text s datalist)
- Resistances (multiselect input)
- File upload (input file)

---

### 9. **create-spell.html**
**Inputy s ID:**
- `spell-description` (textarea, ř. 96)
- `spell-higher-levels` (textarea, ř. 101)

**Inputy BEZ ID:**
- Spell Name (input text)
- Level (input text)
- School (input text)
- Classes Can Use (multiselect input)
- Casting Time (input text)
- Range (input text)
- Area/Radius (input text)
- Duration (input text)
- Components (input text)
- File upload (input file)

---

### 10. **create-subclass.html**
**Inputy s ID:**
- `subclass-description` (textarea, ř. 46)

**Inputy BEZ ID:**
- Subclass name (input text s datalist)
- Všechny multiselect inputy v tabulce (features pro levely 1-20)
- File upload (input file)

---

## 📊 Shrnutí statistik:

**Celkem inputů s ID:** ~30
**Celkem inputů bez ID:** ~150+

**Typy inputů s ID:**
- ✅ Všechny textarea (TinyMCE) mají ID
- ✅ Všechny checkboxy mají ID
- ❌ Téměř žádné text inputy nemají ID
- ❌ Žádné multiselect inputy nemají ID
- ❌ Žádné file upload inputy nemají ID
- ❌ Žádné num-input v tabulkách nemají ID

---

## 🔧 Doporučení:

1. **Opravit duplicitní ID** v create-faith.html
2. **Přidat ID ke všem inputům** pro:
   - Snadnější manipulaci v JavaScriptu
   - Validaci formulářů
   - Ukládání dat
   - Automatické naplnění formulářů

3. **Konzistentní naming convention:**
   - Formát: `{entity}-{field-name}`
   - Např.: `item-name`, `monster-type`, `spell-level`

4. **ID pro tabulkové inputy:**
   - Formát: `{entity}-{field}-level-{number}`
   - Např.: `class-proficiency-level-1`, `spell-slot-1st-level-5`

---

*Generováno automaticky z analýzy všech create formulářů*

