// client/js/charakters-list.js (ESM)
// Render user's characters on `client/pages/charakters.html`

function notify(message, type = "success") {
  if (window.HeroVault?.showNotification) {
    window.HeroVault.showNotification(message, type);
    return;
  }
  console.info(message);
}

function text(v, fallback = "-") {
  const s = String(v ?? "").trim();
  return s || fallback;
}

function statVal(stats, key) {
  if (!stats || typeof stats !== "object") return null;
  const v = stats[key];
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

async function getSession() {
  const { data } = await window.supabase.auth.getSession();
  return data?.session || null;
}

async function fetchCharacters(userId) {
  const { data, error } = await window.supabase
    .from("characters")
    .select(
      "id, user_id, name, level, class_id, subclass_id, race_id, background_id, faith_id, stats, spells, inventory, notes, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function fetchHomebrewNames(ids) {
  const unique = Array.from(new Set(ids.filter(Boolean).map((x) => String(x))));
  if (!unique.length) return new Map();

  const { data, error } = await window.supabase
    .from("homebrew")
    .select("id, name, type")
    .in("id", unique);

  if (error) throw error;
  const map = new Map();
  (Array.isArray(data) ? data : []).forEach((r) => {
    map.set(String(r.id), { name: r.name, type: r.type });
  });
  return map;
}

function createCard({ ch, homebrewMap, userId }) {
  const card = document.createElement("div");
  card.className = "charakter-cart character-card";
  card.dataset.hvCharacterId = String(ch.id);

  // Click anywhere on the card opens the character sheet
  card.addEventListener("click", () => {
    window.location.href = `./charakter-sheet.html?id=${encodeURIComponent(String(ch.id))}`;
  });

  const raceName = homebrewMap.get(String(ch.race_id || ""))?.name || "-";
  const className = homebrewMap.get(String(ch.class_id || ""))?.name || "-";

  const stats = ch.stats || {};
  const str = statVal(stats, "str") ?? statVal(stats, "STR");
  const dex = statVal(stats, "dex") ?? statVal(stats, "DEX");
  const con = statVal(stats, "con") ?? statVal(stats, "CON");
  const int = statVal(stats, "int") ?? statVal(stats, "INT");
  const wis = statVal(stats, "wis") ?? statVal(stats, "WIS");
  const cha = statVal(stats, "cha") ?? statVal(stats, "CHA");

  function statBox(label, value) {
    return `
      <div class="stat-box">
        <div class="stat-abbr">${label}</div>
        <div class="stat-num">${value == null ? "-" : value}</div>
      </div>
    `.trim();
  }

  card.innerHTML = `
    <div class="charakter-card-top">
      <div class="charakter-img-big">
        <img class="charakter-img" src="" alt="">
      </div>
      <div class="charakter-name-block">
        <span class="charakter-name">${text(ch.name, "NAME")}</span>
      </div>
    </div>
    <div class="charakter-info-row">
      <div class="charakter-info-box">
        <span class="charakter-label">LEVEL</span>
        <span class="charakter-value">${text(ch.level ?? 1, "1")}</span>
      </div>
      <div class="charakter-info-box">
        <span class="charakter-label">race</span>
        <span class="charakter-value">${text(raceName)}</span>
      </div>
      <div class="charakter-info-box">
        <span class="charakter-label">CLASS</span>
        <span class="charakter-value">${text(className)}</span>
      </div>
    </div>
    <div class="charakter-gold-divider"></div>
    <div class="charakter-stats-grid">
      ${statBox("CON", con)}
      ${statBox("STR", str)}
      ${statBox("DEX", dex)}
      ${statBox("CHA", cha)}
      ${statBox("INT", int)}
      ${statBox("WIS", wis)}
    </div>
    <div class="charakter-actions-bar">
      <button class="charakter-action edit" type="button">Edit</button>
      <button class="charakter-action delete" type="button">Delete</button>
      <button class="charakter-action copy" type="button">Copy</button>
    </div>
  `.trim();

  // Edit (goes to builder; sheet open is handled by clicking the card)
  card.querySelector(".charakter-action.edit")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    window.location.href = `./create/create_character.html?id=${encodeURIComponent(String(ch.id))}`;
  });

  // Delete
  card.querySelector(".charakter-action.delete")?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    if (!confirm("Delete this character?")) return;
    try {
      const { error } = await window.supabase
        .from("characters")
        .delete()
        .eq("id", ch.id)
        .eq("user_id", userId);
      if (error) throw error;
      card.remove();
      notify("Deleted", "success");
    } catch (e) {
      console.error(e);
      notify("Delete failed", "error");
    }
  });

  // Copy
  card.querySelector(".charakter-action.copy")?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    try {
      const payload = {
        user_id: userId,
        name: `${text(ch.name)} (Copy)`,
        level: Number(ch.level || 1),
        class_id: ch.class_id || null,
        subclass_id: ch.subclass_id || null,
        race_id: ch.race_id || null,
        background_id: ch.background_id || null,
        faith_id: ch.faith_id || null,
        stats: ch.stats || {},
        spells: ch.spells || {},
        inventory: Array.isArray(ch.inventory) ? ch.inventory : [],
        notes: ch.notes || null,
      };
      const { data, error } = await window.supabase
        .from("characters")
        .insert(payload)
        .select(
          "id, user_id, name, level, class_id, subclass_id, race_id, background_id, faith_id, stats, spells, inventory, notes, created_at"
        )
        .single();
      if (error) throw error;
      notify("Copied", "success");
      // open the copy
      window.location.href = `./charakter-sheet.html?id=${encodeURIComponent(String(data.id))}`;
    } catch (e) {
      console.error(e);
      notify("Copy failed", "error");
    }
  });

  return card;
}

function renderEmpty(boardEl) {
  boardEl.innerHTML = `
    <div class="item-result-placeholder" style="grid-column: 1 / -1;">
      No characters yet. Click “new character”.
    </div>
  `.trim();
}

document.addEventListener("DOMContentLoaded", async () => {
  const board = document.querySelector(".charakters-board");
  if (!board) return;

  const ok = await window.ensureAuthOrPrompt?.();
  if (!ok) return;

  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const chars = await fetchCharacters(userId);
    if (!chars.length) {
      renderEmpty(board);
      return;
    }

    const ids = [];
    chars.forEach((c) => {
      if (c.class_id) ids.push(c.class_id);
      if (c.race_id) ids.push(c.race_id);
    });
    const homebrewMap = await fetchHomebrewNames(ids);

    board.innerHTML = "";
    chars.forEach((ch) => {
      board.appendChild(createCard({ ch, homebrewMap, userId }));
    });
  } catch (e) {
    console.error("Load characters failed:", e);
    notify("Load failed", "error");
  }
});



