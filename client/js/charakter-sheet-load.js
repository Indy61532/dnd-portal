// client/js/charakter-sheet-load.js (ESM)
// Loads character data into `charakter-sheet.html` from Supabase table `characters`.

function notify(message, type = "success") {
  if (window.HeroVault?.showNotification) {
    window.HeroVault.showNotification(message, type);
    return;
  }
  console.info(message);
}

function toIntOrNull(v) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function modFromScore(score) {
  return Math.floor((score - 10) / 2);
}

function fmtMod(n) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n}`;
}

function profBonusFromLevel(level) {
  const lvl = Math.max(1, Math.min(20, toIntOrNull(level) ?? 1));
  return 2 + Math.floor((lvl - 1) / 4);
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function getSession() {
  const { data } = await window.supabase.auth.getSession();
  return data?.session || null;
}

async function fetchCharacter({ id, userId }) {
  const { data, error } = await window.supabase
    .from("characters")
    .select("id, user_id, name, level, class_id, race_id, background_id, faith_id, stats, spells, inventory, notes, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

async function fetchHomebrewName(id) {
  if (!id) return null;
  const { data, error } = await window.supabase
    .from("homebrew")
    .select("id, name, type")
    .eq("id", id)
    .single();
  if (error) return null;
  return data?.name || null;
}

async function fetchHomebrew(id) {
  if (!id) return null;
  const { data, error } = await window.supabase
    .from("homebrew")
    .select("id, name, type, data")
    .eq("id", id)
    .single();
  if (error) return null;
  return data || null;
}

async function fetchHomebrewByIds(ids) {
  const unique = Array.from(new Set((ids || []).filter(Boolean).map((x) => String(x))));
  if (!unique.length) return [];
  const { data, error } = await window.supabase
    .from("homebrew")
    .select("id, name, type, data")
    .in("id", unique);
  if (error) return [];
  return Array.isArray(data) ? data : [];
}

function getAbilityScore(stats, keyLower) {
  if (!stats || typeof stats !== "object") return null;
  return (
    toIntOrNull(stats[keyLower]) ??
    toIntOrNull(stats[keyLower.toUpperCase()]) ??
    null
  );
}

function getAbilityMods(stats) {
  const mods = {};
  for (const k of ["str", "dex", "con", "int", "wis", "cha"]) {
    const s = getAbilityScore(stats, k);
    mods[k] = s == null ? 0 : modFromScore(s);
  }
  return mods;
}

function setHeader({ name, raceName, className, level }) {
  const h1 = document.querySelector(".sheet-identity__details h1");
  const p = document.querySelector(".sheet-identity__details p");
  if (h1) h1.textContent = name || "Character";
  if (p) {
    const left = [raceName, className].filter(Boolean).join(" ");
    p.textContent = `${left || "Adventurer"} · Level ${level || 1}`;
  }
}

function setAbilityTiles(stats) {
  const tiles = Array.from(document.querySelectorAll(".sheet-card--abilities .ability-tile"));
  tiles.forEach((tile) => {
    const abbr = tile.querySelector(".ability-tile__label")?.textContent?.trim()?.toLowerCase();
    if (!abbr) return;
    const key = abbr; // "str" | "dex" ...
    const score = getAbilityScore(stats, key);
    const mod = score == null ? null : modFromScore(score);
    const scoreEl = tile.querySelector(".ability-tile__score");
    const modEl = tile.querySelector(".ability-tile__mod");
    if (scoreEl) scoreEl.textContent = score == null ? "-" : String(score);
    if (modEl) modEl.textContent = mod == null ? "" : fmtMod(mod);
  });
}

function abilityKeyFromName(name) {
  const n = String(name || "").trim().toLowerCase();
  if (n.startsWith("str")) return "str";
  if (n.startsWith("dex")) return "dex";
  if (n.startsWith("con")) return "con";
  if (n.startsWith("int")) return "int";
  if (n.startsWith("wis")) return "wis";
  if (n.startsWith("cha")) return "cha";
  return null;
}

function setSavingThrows(stats, profBonus) {
  const mods = getAbilityMods(stats);
  const list = document.querySelector(".sheet-card--saves .sheet-list");
  if (!list) return;
  const rows = Array.from(list.querySelectorAll("li"));
  rows.forEach((li) => {
    const label = li.querySelector("span")?.textContent;
    const key = abilityKeyFromName(label);
    const badge = li.querySelector(".sheet-list__badge");
    if (!key || !badge) return;
    // MVP: no proficiency info yet -> base mod only
    const val = mods[key];
    badge.textContent = fmtMod(val);
  });
}

function setSkills(stats) {
  const mods = getAbilityMods(stats);
  const rows = Array.from(document.querySelectorAll(".sheet-card--skills .skill-row"));
  rows.forEach((row) => {
    const meta = row.querySelector(".skill-row__meta")?.textContent?.trim()?.toLowerCase();
    const valueEl = row.querySelector(".skill-row__value");
    if (!valueEl) return;
    const key = abilityKeyFromName(meta);
    if (!key) return;
    // MVP: no proficiency/exp yet -> base mod only
    valueEl.textContent = fmtMod(mods[key]);
  });
}

function setSenses(stats, raceHomebrew) {
  const mods = getAbilityMods(stats);
  const list = document.querySelector(".sheet-card--senses .sheet-list--compact");
  if (!list) return;

  const li = Array.from(list.querySelectorAll("li"));

  function setSenseRow(prefix, valueText) {
    const row = li.find((x) => (x.textContent || "").toLowerCase().includes(prefix));
    if (!row) return;
    const badge = row.querySelector(".sheet-list__badge");
    if (badge) badge.textContent = valueText;
  }

  // Passive scores (MVP: 10 + ability mod)
  setSenseRow("passive perception", String(10 + (mods.wis || 0)));
  setSenseRow("passive investigation", String(10 + (mods.int || 0)));
  setSenseRow("passive insight", String(10 + (mods.wis || 0)));

  // Darkvision from race if available
  const vision =
    raceHomebrew?.data?.info?.vision ??
    raceHomebrew?.data?.vision ??
    "";
  const v = String(vision || "").trim();

  // Normalize typical values:
  // - "60" -> "60 ft."
  // - "60 ft" / "60 ft." -> "60 ft."
  // - "Darkvision 60 ft." -> "60 ft."
  let darkvisionText = "—";
  if (v) {
    const numMatch = v.match(/(\d{1,3})/);
    if (numMatch) {
      darkvisionText = `${numMatch[1]} ft.`;
    } else {
      // If it's non-numeric (e.g. "Blindsight 10 ft." stored wrongly), show raw.
      darkvisionText = v;
    }
  }
  setSenseRow("darkvision", darkvisionText);
}

function setTrackerValue(labelText, valueText) {
  const trackers = Array.from(document.querySelectorAll(".sheet-trackers .tracker-card"));
  for (const t of trackers) {
    const lab = t.querySelector(".tracker-card__label")?.textContent?.trim();
    if (lab === labelText) {
      const val = t.querySelector(".tracker-card__value");
      if (val) val.textContent = valueText;
      return;
    }
  }
}

function setHpTracker({ current, max, temp = 0 }) {
  const card = getTrackerCard("Hit Points");
  if (!card) return;
  const val = card.querySelector(".tracker-card__value--hp") || card.querySelector(".tracker-card__value");
  const meta = card.querySelector(".tracker-card__meta");
  if (val) val.textContent = `${current} / ${max}`;
  if (meta) meta.textContent = `Temp ${temp}`;
}

function parseHitDieFromClass(classHb) {
  const d = classHb?.data || {};
  const candidates = [
    d?.hitDie,
    d?.hit_die,
    d?.info?.hitDie,
    d?.info?.hit_die,
    d?.info?.hitDice,
    d?.info?.hit_dice,
    d?.info?.hitPointsDie,
    d?.info?.hpDie,
  ]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);

  for (const c of candidates) {
    const m = c.match(/d\s*(\d{1,2})/i) || c.match(/(\d{1,2})/);
    if (m) {
      const n = Number.parseInt(m[1], 10);
      if ([4, 6, 8, 10, 12].includes(n)) return n;
    }
  }
  return 8;
}

function computeMaxHp({ level, conMod, hitDie }) {
  const lvl = Math.max(1, Math.min(20, toIntOrNull(level) ?? 1));
  const die = [4, 6, 8, 10, 12].includes(hitDie) ? hitDie : 8;
  const avg = (die + 1) / 2;
  const perLevel = avg + (conMod || 0);
  return Math.max(1, Math.round(lvl * perLevel));
}

function extractInventoryHomebrewIds(inventory) {
  const items = Array.isArray(inventory) ? inventory : [];
  const ids = [];
  for (const it of items) {
    const id =
      it?.homebrewId ??
      it?.homebrew_id ??
      it?.id ??
      it?.itemId ??
      it?.item_id ??
      null;
    if (id != null && String(id).trim()) ids.push(String(id).trim());
  }
  return ids;
}

function computeArmorClass({ dexMod, homebrewItems }) {
  const dm = dexMod || 0;
  let armorBase = null;
  let hasShield = false;

  for (const hb of homebrewItems || []) {
    if (String(hb?.type || "").toLowerCase() !== "item") continue;
    const data = hb?.data || {};
    const itemType = String(data?.info?.itemType || "").toLowerCase();
    const name = String(hb?.name || "").toLowerCase();

    const acRaw = data?.armor?.ac ?? data?.armor?.AC ?? null;
    const ac = toIntOrNull(acRaw);
    if (ac != null) armorBase = Math.max(armorBase ?? 0, ac);

    if (itemType.includes("shield") || name.includes("shield")) hasShield = true;
  }

  let ac = armorBase != null ? armorBase : (10 + dm);
  if (hasShield) ac += 2;
  return ac;
}

function getTrackerCard(labelText) {
  const trackers = Array.from(document.querySelectorAll(".sheet-trackers .tracker-card"));
  for (const t of trackers) {
    const lab = t.querySelector(".tracker-card__label")?.textContent?.trim();
    if (lab === labelText) return t;
  }
  return null;
}

function getCharacterStateKey(characterId) {
  return `hv_character_state_${String(characterId)}`;
}

function loadCharacterState(characterId) {
  const key = getCharacterStateKey(characterId);
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCharacterState(characterId, patch) {
  const key = getCharacterStateKey(characterId);
  const cur = loadCharacterState(characterId);
  const next = { ...cur, ...(patch || {}) };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

function wireHeroicInspirationToggle(characterId) {
  const card = getTrackerCard("Heroic Inspiration");
  if (!card) return;

  const valueEl = card.querySelector(".tracker-card__value");
  if (!valueEl) return;

  card.classList.add("hv-toggle");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-pressed", "false");

  const state = loadCharacterState(characterId);
  let active = Boolean(state.heroicInspiration);

  function render() {
    valueEl.textContent = active ? "Active" : "Inactive";
    card.classList.toggle("is-active", active);
    card.classList.toggle("tracker-card--highlight", active);
    card.setAttribute("aria-pressed", String(active));
  }

  function toggle() {
    active = !active;
    saveCharacterState(characterId, { heroicInspiration: active });
    render();
  }

  card.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  render();
}

function wireHpControls(characterId, maxHp) {
  const card = getTrackerCard("Hit Points");
  if (!card) return;

  const popover = card.querySelector(".hp-popover");
  const inputAmount = card.querySelector(".hp-popover__input");
  const inputTemp = card.querySelector(".hp-popover__input--temp");
  const btnDamage = card.querySelector(".hp-popover__btn--damage");
  const btnHeal = card.querySelector(".hp-popover__btn--heal");
  
  // Initial state load
  const state = loadCharacterState(characterId);
  let currentHp = state.currentHp !== undefined ? state.currentHp : maxHp;
  let tempHp = state.tempHp !== undefined ? state.tempHp : 0;

  function update() {
    setHpTracker({ current: currentHp, max: maxHp, temp: tempHp });
    if (inputTemp) inputTemp.value = tempHp;
    saveCharacterState(characterId, { currentHp, tempHp });
  }

  // Initial render
  update();

  // Toggle popover
  card.addEventListener("click", (e) => {
      // Don't toggle if clicking inside the popover
      if (e.target.closest(".hp-popover")) return;
      
      const isHidden = popover.hasAttribute("hidden");
      if (isHidden) {
          popover.removeAttribute("hidden");
          card.setAttribute("aria-expanded", "true");
          // Focus input after a tick
          setTimeout(() => inputAmount?.focus(), 50);
      } else {
          popover.setAttribute("hidden", "");
          card.setAttribute("aria-expanded", "false");
      }
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
      if (!card.contains(e.target)) {
          popover.setAttribute("hidden", "");
          card.setAttribute("aria-expanded", "false");
      }
  });

  // Damage logic
  if (btnDamage) {
    btnDamage.addEventListener("click", (e) => {
      e.stopPropagation();
      const amount = parseInt(inputAmount.value, 10);
      if (isNaN(amount) || amount <= 0) return;

      // Damage logic: first temp HP, then current HP
      let damage = amount;
      if (tempHp > 0) {
          const absorb = Math.min(tempHp, damage);
          tempHp -= absorb;
          damage -= absorb;
      }
      currentHp = Math.max(0, currentHp - damage);
      
      inputAmount.value = ""; // clear input
      update();
    });
  }

  // Heal logic
  if (btnHeal) {
    btnHeal.addEventListener("click", (e) => {
      e.stopPropagation();
      const amount = parseInt(inputAmount.value, 10);
      if (isNaN(amount) || amount <= 0) return;
      
      currentHp = Math.min(maxHp, currentHp + amount);
      inputAmount.value = ""; // clear input
      update();
    });
  }
  
  // Temp HP direct edit
  if (inputTemp) {
      inputTemp.addEventListener("change", (e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= 0) {
              tempHp = n;
              update();
          }
      });
  }
}

function setInventoryTab(inventory) {
  const panel = document.querySelector('[data-tab-panel="inventory"]');
  if (!panel) return;

  const list = panel.querySelector(".sheet-actions");
  if (!list) return;

  list.innerHTML = "";

  const items = Array.isArray(inventory) ? inventory : [];
  if (!items.length) {
    // caller will hide this whole tab if empty
    return false;
  }

  for (const it of items) {
    const name = String(it?.name || it?.itemName || "Item").trim();
    const weight = it?.weight != null ? it.weight : "";
    const metaWeight = weight !== "" ? `Weight: ${weight} lb.` : "";
    const type = String(it?.type || it?.itemType || "Item").trim();

    const article = document.createElement("article");
    article.className = "sheet-action";
    article.innerHTML = `
      <div class="sheet-action__head">
        <h4>${name}</h4>
        <div class="sheet-action__meta">
          <span>${type}</span>
          <span>${metaWeight}</span>
        </div>
      </div>
    `.trim();
    list.appendChild(article);
  }
  return true;
}

function setNotesTab(notes) {
  const panel = document.querySelector('[data-tab-panel="notes"]');
  if (!panel) return;
  const p = panel.querySelector("p");
  if (!p) return;
  const text = String(notes || "").trim();
  if (!text) return false;
  p.textContent = text;
  return true;
}

function extractStrings(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x ?? "").trim()).filter(Boolean);
  const s = String(v).trim();
  if (!s) return [];
  // split comma/semicolon lists
  if (s.includes(",") || s.includes(";")) {
    return s
      .split(/[;,]/g)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [s];
}

function setProficiencies({ raceHb, backgroundHb }) {
  const section = document.querySelector(".sheet-card--proficiencies");
  const tagsWrap = section?.querySelector?.(".sheet-tags");
  if (!section || !tagsWrap) return;

  // Always remove hardcoded placeholders
  tagsWrap.innerHTML = "";

  const tags = [];

  // Languages (best effort): race language field(s) + background languages (if fixed)
  const raceLangs = extractStrings(
    raceHb?.data?.info?.language ??
      raceHb?.data?.info?.languages ??
      raceHb?.data?.language ??
      raceHb?.data?.languages
  );

  const bgLangs = extractStrings(
    backgroundHb?.data?.proficiencies?.languages ??
      backgroundHb?.data?.languages ??
      backgroundHb?.data?.info?.languages
  );

  const langs = Array.from(new Set([...raceLangs, ...bgLangs]));
  if (langs.length) tags.push(`Languages: ${langs.join(", ")}`);

  // Tools (only if background defines fixed proficiencies, not options)
  const toolsFixed = extractStrings(backgroundHb?.data?.proficiencies?.tools);
  if (toolsFixed.length) tags.push(`Tools: ${toolsFixed.join(", ")}`);

  // Skills (only if background defines fixed proficiencies, not options)
  const skillsFixed = extractStrings(backgroundHb?.data?.proficiencies?.skills);
  if (skillsFixed.length) tags.push(`Skills: ${skillsFixed.join(", ")}`);

  if (!tags.length) {
    // "pokud nic nemá tak tam nic nebude" -> hide the whole section
    section.style.display = "none";
    return;
  }

  section.style.display = "";
  for (const t of tags) {
    const span = document.createElement("span");
    span.className = "sheet-tag";
    span.textContent = t;
    tagsWrap.appendChild(span);
  }
}

function getTabButton(tabId) {
  return document.querySelector(`.sheet-tab[data-tab="${CSS.escape(tabId)}"]`);
}

function getTabPanel(tabId) {
  return document.querySelector(`[data-tab-panel="${CSS.escape(tabId)}"]`);
}

function hideTab(tabId) {
  const btn = getTabButton(tabId);
  const panel = getTabPanel(tabId);
  if (btn) btn.style.display = "none";
  if (panel) panel.setAttribute("hidden", "");
}

function showTab(tabId) {
  const btn = getTabButton(tabId);
  if (btn) btn.style.display = "";
}

function ensureVisibleActiveTab() {
  const tabs = Array.from(document.querySelectorAll(".sheet-tab")).filter((t) => t.style.display !== "none");
  if (!tabs.length) return;

  const active = tabs.find((t) => t.classList.contains("is-active"));
  if (active) return;

  // Activate first visible tab (match existing tab script behavior)
  const first = tabs[0];
  first.classList.add("is-active");
  first.setAttribute("aria-selected", "true");
  first.setAttribute("tabindex", "0");

  // hide other panels, show first
  const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  panels.forEach((p) => {
    const shouldShow = p.dataset.tabPanel === first.dataset.tab;
    if (shouldShow) p.removeAttribute("hidden");
    else p.setAttribute("hidden", "");
  });
}

function setActionsTab({ level, stats }) {
  const panel = getTabPanel("actions");
  if (!panel) return;
  const list = panel.querySelector(".sheet-actions");
  if (!list) return;

  // Replace placeholder actions with a single base action: Unarmed Strike
  list.innerHTML = "";

  const strScore = getAbilityScore(stats, "str");
  const strMod = strScore == null ? 0 : modFromScore(strScore);
  const pb = profBonusFromLevel(level);
  const toHit = fmtMod(pb + strMod);
  const dmg = `${Math.max(0, 1 + strMod)} bludgeoning`;

  const article = document.createElement("article");
  article.className = "sheet-action";
  article.innerHTML = `
    <div class="sheet-action__head">
      <h4>Unarmed Strike</h4>
      <div class="sheet-action__meta">
        <span>Melee · 5 ft.</span>
        <span>${toHit} to Hit</span>
        <span>${dmg}</span>
      </div>
    </div>
    <p>A basic melee attack made without weapons.</p>
  `.trim();
  list.appendChild(article);
}

function setSpellsTab(spells) {
  const panel = getTabPanel("spells");
  if (!panel) return false;

  // Determine if we have any spell data
  const hasData =
    Array.isArray(spells) ? spells.length > 0 :
    (spells && typeof spells === "object") ? Object.keys(spells).length > 0 :
    false;

  if (!hasData) return false;

  // MVP: render a simple list if possible, otherwise keep the panel but remove placeholder lists.
  const slotsWrap = panel.querySelector(".spell-slots");
  if (slotsWrap) {
    slotsWrap.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "spell-list";

    const items = Array.isArray(spells)
      ? spells
      : Array.isArray(spells?.list)
        ? spells.list
        : Array.isArray(spells?.prepared)
          ? spells.prepared
          : [];

    items.forEach((s) => {
      const li = document.createElement("li");
      li.className = "spell-list__item";
      li.innerHTML = `<span>${String(s || "").trim() || "Spell"}</span>`;
      ul.appendChild(li);
    });

    if (!ul.children.length) {
      slotsWrap.innerHTML = `<div class="sheet-empty">No spells.</div>`;
    } else {
      slotsWrap.appendChild(ul);
    }
  }

  return true;
}

function setFeaturesTab({ classHb, level }) {
  const panel = getTabPanel("features");
  if (!panel) return false;
  const list = panel.querySelector(".sheet-actions");
  if (!list) return false;

  const levels = classHb?.data?.progression?.levels;
  const custom = Array.isArray(classHb?.data?.customFeatures) ? classHb.data.customFeatures : [];
  const lvl = Math.max(1, Math.min(20, toIntOrNull(level) ?? 1));

  if (!Array.isArray(levels)) return false;

  // Collect unique features up to level in order
  const seen = new Set();
  const features = [];
  for (const row of levels) {
    const rowLevel = toIntOrNull(row?.level);
    if (!rowLevel || rowLevel > lvl) continue;
    const arr = Array.isArray(row?.features) ? row.features : [];
    for (const f of arr) {
      const name = String(f || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      features.push({ name, level: rowLevel });
    }
  }

  if (!features.length) return false;

  list.innerHTML = "";
  for (const f of features) {
    const found = custom.find((x) => String(x?.name || "").trim().toLowerCase() === f.name.toLowerCase());
    const desc = String(found?.description || "").trim();
    const descHtml = String(found?.descriptionHtml || "").trim();

    const article = document.createElement("article");
    article.className = "sheet-action";
    article.innerHTML = `
      <div class="sheet-action__head">
        <h4>${f.name}</h4>
        <div class="sheet-action__meta">
          <span>${f.level} level</span>
        </div>
      </div>
      <p></p>
    `.trim();
    const p = article.querySelector("p");
    if (p) {
      if (descHtml) p.innerHTML = descHtml;
      else p.textContent = desc || "No description yet.";
    }
    list.appendChild(article);
  }

  return true;
}

function setBackgroundTab(backgroundHb) {
  const panel = getTabPanel("background");
  if (!panel) return false;
  const desc =
    backgroundHb?.data?.descriptionHtml ||
    backgroundHb?.data?.description ||
    backgroundHb?.data?.info?.descriptionHtml ||
    backgroundHb?.data?.info?.description ||
    "";
  const html = String(desc || "").trim();
  if (!html) return false;

  // Replace placeholder paragraph
  const p = panel.querySelector("p");
  if (p) p.innerHTML = html;
  return true;
}

function setPetsTab(pets) {
  // MVP: hide unless we have some explicit pets data
  const hasData = Array.isArray(pets) ? pets.length > 0 : false;
  if (!hasData) return false;
  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const ok = await window.ensureAuthOrPrompt?.();
    if (!ok) return;

    const id = getParam("id");
    if (!id) {
      notify("Missing character id", "error");
      return;
    }

    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const ch = await fetchCharacter({ id, userId });

    const [raceHb, classHb, backgroundHb] = await Promise.all([
      fetchHomebrew(ch.race_id),
      fetchHomebrew(ch.class_id),
      fetchHomebrew(ch.background_id),
    ]);
    const raceName = raceHb?.name || null;
    const className = classHb?.name || null;

    setHeader({ name: ch.name, raceName, className, level: ch.level });
    setAbilityTiles(ch.stats);

    const pb = profBonusFromLevel(ch.level);
    setTrackerValue("Proficiency Bonus", fmtMod(pb));

    // Speed from race (if present)
    const speedRaw =
      raceHb?.data?.info?.speed ??
      raceHb?.data?.speed ??
      "";
    const speedStr = String(speedRaw || "").trim();
    if (speedStr) {
      const n = Number.parseInt(speedStr, 10);
      const formatted = Number.isFinite(n) ? `${n} ft.` : speedStr;
      setTrackerValue("Speed", formatted);
    } else {
      setTrackerValue("Speed", "-");
    }

    // Derived sections
    setSavingThrows(ch.stats, pb);
    setSkills(ch.stats);
    setSenses(ch.stats, raceHb);

    // HP + AC (best-effort MVP)
    const stats = ch.stats || {};
    const conScore = getAbilityScore(stats, "con");
    const dexScore = getAbilityScore(stats, "dex");
    const conMod = conScore == null ? 0 : modFromScore(conScore);
    const dexMod = dexScore == null ? 0 : modFromScore(dexScore);

    const hitDie = parseHitDieFromClass(classHb);
    const maxHp = computeMaxHp({ level: ch.level, conMod, hitDie });
    wireHpControls(ch.id, maxHp);

    const invIds = extractInventoryHomebrewIds(ch.inventory);
    const invHomebrew = await fetchHomebrewByIds(invIds);
    const ac = computeArmorClass({ dexMod, homebrewItems: invHomebrew });
    setTrackerValue("Armor Class", String(ac));
    setTrackerValue("Initiative", (dexScore == null ? "-" : fmtMod(dexMod)));

    // Tabs: Actions is always present (Unarmed Strike base)
    showTab("actions");
    setActionsTab({ level: ch.level, stats: ch.stats || {} });

    // Spells
    const hasSpells = setSpellsTab(ch.spells);
    if (!hasSpells) hideTab("spells"); else showTab("spells");

    // Inventory
    const hasInventory = setInventoryTab(ch.inventory);
    if (!hasInventory) hideTab("inventory"); else showTab("inventory");

    // Features & Traits (from class progression up to level)
    const hasFeatures = setFeaturesTab({ classHb, level: ch.level });
    if (!hasFeatures) hideTab("features"); else showTab("features");

    // Background
    const hasBackground = setBackgroundTab(backgroundHb);
    if (!hasBackground) hideTab("background"); else showTab("background");

    // Notes
    const hasNotes = setNotesTab(ch.notes);
    if (!hasNotes) hideTab("notes"); else showTab("notes");

    // Pets (not stored yet)
    const hasPets = setPetsTab(ch.pets);
    if (!hasPets) hideTab("pets"); else showTab("pets");

    // Proficiencies (hide whole section if empty)
    setProficiencies({ raceHb, backgroundHb });

    // If current active tab was hidden by our logic, ensure a visible one is active.
    // (Existing tab script already ran, so we force a safe visible tab.)
    const activeBtn = document.querySelector(".sheet-tab.is-active");
    if (activeBtn && activeBtn.style.display === "none") {
      activeBtn.classList.remove("is-active");
    }
    ensureVisibleActiveTab();

    // Interactive toggles (local-only state)
    wireHeroicInspirationToggle(ch.id);
  } catch (e) {
    console.error("Sheet load failed:", e);
    notify("Load failed", "error");
  }
});



