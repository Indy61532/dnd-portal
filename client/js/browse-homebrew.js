// Browse page: list only public homebrew, with "Add" to user's collection.
// ESM module. Depends on:
// - window.supabase (from supabase-client.js)
// - window.ensureAuthOrPrompt (from auth-ui.js)

function notify(message, type = "success") {
  if (window.HeroVault?.showNotification) {
    window.HeroVault.showNotification(message, type);
    return;
  }
  alert(message);
}

function normalizeType(t) {
  return String(t || "").trim().toLowerCase();
}

function textOrDash(v) {
  const s = (v == null ? "" : String(v)).trim();
  return s || "-";
}

function createSpan(className, text) {
  const el = document.createElement("span");
  el.className = className;
  el.textContent = text ?? "";
  return el;
}

function getCategoryHeaderSelector(type) {
  switch (normalizeType(type)) {
    case "item":
      return ".category-item";
    case "monster":
      return ".category-monster";
    case "class":
      return ".category-class";
    case "spell":
      return ".category-spell";
    case "race":
      return ".category-race";
    case "background":
      return ".category-backgroun"; // typo in HTML/CSS
    case "feat":
      return ".category-feat";
    case "subclass":
      return ".category-sub-class";
    case "pet":
      return ".category-pet";
    case "faith":
      return ".category-faith";
    default:
      return null; // ignore npc/unknown
  }
}

function getOpenHref(type, id) {
  const t = normalizeType(type);
  if (t === "class") return `./create/create-class.html?id=${encodeURIComponent(id)}`;
  if (t === "spell") return `./create/create-spell.html?id=${encodeURIComponent(id)}`;
  if (t === "item") return `./create/create-item.html?id=${encodeURIComponent(id)}`;
  if (t === "monster") return `./create/create-monster.html?id=${encodeURIComponent(id)}`;
  if (t === "race") return `./create/create-rase.html?id=${encodeURIComponent(id)}`;
  if (t === "background") return `./create/create-background.html?id=${encodeURIComponent(id)}`;
  if (t === "feat") return `./create/create-feat.html?id=${encodeURIComponent(id)}`;
  if (t === "subclass") return `./create/create-subclass.html?id=${encodeURIComponent(id)}`;
  if (t === "pet") return `./create/create-pet.html?id=${encodeURIComponent(id)}`;
  if (t === "faith") return `./create/create-faith.html?id=${encodeURIComponent(id)}`;
  return "./create.html";
}

async function addToCollection(homebrewId) {
  const ok = await window.ensureAuthOrPrompt?.();
  if (!ok) return false;

  const { data: sessionData } = await window.supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return false;

  // user_saved_items is expected to have at least: user_id, homebrew_id
  // Use upsert to avoid duplicates if a unique constraint exists.
  const { error } = await window.supabase
    .from("user_saved_items")
    .upsert({ user_id: userId, homebrew_id: homebrewId }, { onConflict: "user_id,homebrew_id", ignoreDuplicates: true });

  if (error) throw error;
  return true;
}

function createActions({ homebrewId, rowEl }) {
  const wrap = document.createElement("div");
  wrap.className = "hv-actions";

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "hv-btn hv-open";
  openBtn.textContent = "Open";
  openBtn.addEventListener("click", () => {
    const type = normalizeType(rowEl?.dataset?.hvType);
    window.location.href = getOpenHref(type, homebrewId);
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "hv-btn hv-add";
  addBtn.title = "Add to collection";
  addBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
  addBtn.addEventListener("click", async () => {
    try {
      // Prevent duplicate add if already in collection
      if (String(rowEl?.dataset?.hvIsSaved || "") === "1") return;

      addBtn.disabled = true;
      addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

      await addToCollection(homebrewId);

      rowEl.dataset.hvIsSaved = "1";

      addBtn.innerHTML = '<i class="fas fa-check"></i> Added';
      notify("Added", "success");
    } catch (err) {
      console.error("Add failed:", err);
      notify("Add failed", "error");
      addBtn.disabled = false;
      addBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
    }
  });

  // If it's the current user's own homebrew, don't show Add
  const isOwner = String(rowEl?.dataset?.hvIsOwner || "") === "1";
  const isSaved = String(rowEl?.dataset?.hvIsSaved || "") === "1";
  if (isOwner) {
    wrap.append(openBtn);
  } else {
    if (isSaved) {
      addBtn.disabled = true;
      addBtn.innerHTML = '<i class="fas fa-check"></i> Added';
      addBtn.title = "Already in your collection";
    }
    wrap.append(openBtn, addBtn);
  }
  return wrap;
}

function buildRow(homebrew) {
  if (!homebrew) return null;

  const type = normalizeType(homebrew.type);
  const data = homebrew.data || {};

  const li = document.createElement("li");
  const headerSel = getCategoryHeaderSelector(type);
  const categoryClass = headerSel ? headerSel.replace(".", "") : "";
  li.className = `item hv-row ${categoryClass}`.trim();
  li.dataset.hvName = String(homebrew.name || "");
  li.dataset.hvType = type;
  li.dataset.hvHomebrewId = String(homebrew.id);
  li.dataset.hvOwnerId = String(homebrew.user_id || "");
  // hvIsOwner is set later (after we know current user id)

  li.appendChild(createSpan("item-name", textOrDash(homebrew.name)));
  li.appendChild(createSpan("item-type", textOrDash(type)));

  if (type === "item") {
    li.appendChild(createSpan("type-item", textOrDash(data?.info?.itemType)));
    li.appendChild(createSpan("weapon-type", textOrDash(data?.weapon?.weaponType)));
    li.appendChild(createSpan("rarity", textOrDash(data?.info?.rarity)));
  } else if (type === "spell") {
    li.appendChild(createSpan("type-spell", textOrDash(data?.info?.school ?? data?.school)));
    li.appendChild(createSpan("range", textOrDash(data?.details?.range)));
    li.appendChild(createSpan("level", textOrDash(data?.info?.level)));
  } else if (type === "monster") {
    li.appendChild(createSpan("type-monster", "-"));
    li.appendChild(createSpan("cr", "-"));
    li.appendChild(createSpan("ac", "-"));
    li.appendChild(createSpan("hp", "-"));
  } else {
    if (type === "feat") li.appendChild(createSpan("tier", "-"));
    else if (type === "subclass") li.appendChild(createSpan("parent-class", "-"));
    else if (type === "faith") {
      li.appendChild(createSpan("domain", "-"));
      li.appendChild(createSpan("alignment", "-"));
    }
  }
  return li;
}

function ensureEmptyMessageIfNeeded() {
  const header = document.querySelector(".main-content-header");
  if (!header) return;

  const existing = document.getElementById("hv-empty-public");
  const rows = document.querySelectorAll(".main-list .hv-row");
  const anyVisible = Array.from(rows).some((r) => !r.hidden && r.style.display !== "none");

  if (!anyVisible) {
    if (!existing) {
      const div = document.createElement("div");
      div.id = "hv-empty-public";
      div.className = "hv-empty";
      div.textContent = "No public content yet";
      header.insertAdjacentElement("afterend", div);
    }
  } else {
    existing?.remove();
  }
}

function wireSearch() {
  const input =
    document.querySelector(".search-input") ||
    document.querySelector(".searchbar-wrap input");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = String(input.value || "").trim().toLowerCase();
    const rows = document.querySelectorAll(".main-list .hv-row");
    rows.forEach((row) => {
      const name = String(row.dataset.hvName || "").toLowerCase();
      const type = String(row.dataset.hvType || "").toLowerCase();
      row.hidden = q ? !(`${name} ${type}`.includes(q)) : false;
    });
    ensureEmptyMessageIfNeeded();
  });
}

async function loadPublicHomebrew() {
  const { data, error } = await window.supabase
    .from("homebrew")
    .select("id, user_id, type, status, name, data, updated_at")
    .eq("status", "public")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function loadSavedHomebrewIds(currentUserId) {
  if (!currentUserId) return new Set();
  try {
    const { data, error } = await window.supabase
      .from("user_saved_items")
      .select("homebrew_id")
      .eq("user_id", currentUserId);
    if (error) throw error;
    const set = new Set();
    (Array.isArray(data) ? data : []).forEach((r) => set.add(String(r.homebrew_id)));
    return set;
  } catch (err) {
    // Don't block browse if this fails (RLS/policy etc.)
    console.error("Failed to load saved items:", err);
    return new Set();
  }
}

function renderHomebrew(items, currentUserId, savedSet) {
  const list = document.querySelector(".main-list");
  if (!list) return;

  list.querySelectorAll(".hv-row").forEach((el) => el.remove());

  // ignore NPC header row (DB doesn't have npc enum here)
  const npcHeader = list.querySelector(".category-nps");
  if (npcHeader) npcHeader.style.display = "none";

  const lastInsertedAfter = new Map(); // headerEl -> last row

  for (const hb of items) {
    const type = normalizeType(hb?.type);
    const headerSel = getCategoryHeaderSelector(type);
    if (!headerSel) continue;

    const headerEl = list.querySelector(headerSel);
    if (!headerEl) continue;

    const row = buildRow(hb);
    if (!row) continue;

    // Mark ownership so actions can hide Add for user's own content
    const isOwner = currentUserId && String(hb.user_id) === String(currentUserId);
    row.dataset.hvIsOwner = isOwner ? "1" : "0";
    row.dataset.hvIsSaved = savedSet?.has(String(hb.id)) ? "1" : "0";

    // Optional: show a subtle note in the name if already in collection
    if (row.dataset.hvIsSaved === "1") {
      const nameEl = row.querySelector(".item-name");
      if (nameEl && !nameEl.querySelector(".hv-pill")) {
        const pill = document.createElement("span");
        pill.className = "hv-pill";
        pill.textContent = "In collection";
        nameEl.appendChild(pill);
      }
    }

    // Actions depend on hvIsOwner/hvIsSaved, so append AFTER datasets are set
    row.appendChild(createActions({ homebrewId: hb.id, rowEl: row }));

    const anchor = lastInsertedAfter.get(headerEl) || headerEl;
    anchor.insertAdjacentElement("afterend", row);
    lastInsertedAfter.set(headerEl, row);
  }

  ensureEmptyMessageIfNeeded();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    wireSearch();
    const { data: sessionData } = await window.supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id || null;
    const savedSet = await loadSavedHomebrewIds(currentUserId);
    const items = await loadPublicHomebrew();
    renderHomebrew(items, currentUserId, savedSet);
  } catch (err) {
    console.error(err);
    notify("Load failed", "error");
  }
});


