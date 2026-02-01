// client/js/equipment-panel.js (ESM)
// Equipment step: render "Add Items" list from user's Collection (user_saved_items -> homebrew)
// + include user's own homebrew items, allow adding to inventory + total weight.

const DRAFT_KEY = "hv_character_draft";

function notify(message, type = "success") {
  if (window.HeroVault?.showNotification) {
    window.HeroVault.showNotification(message, type);
    return;
  }
  console.info(message);
}

function normalize(s) {
  return String(s ?? "").trim();
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  return parsed && typeof parsed === "object" ? parsed : {};
}

function saveDraft(patch) {
  const cur = loadDraft();
  const next = { ...cur, ...(patch || {}) };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  window.HVCharacterDraft = { ...(window.HVCharacterDraft || {}), ...next };
  return next;
}

function toNumberOrNull(v) {
  const n = Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
}

function inferCategory(item) {
  const itemType = normalize(item?.data?.info?.itemType).toLowerCase();
  const weaponType = normalize(item?.data?.weapon?.weaponType).toLowerCase();

  if (itemType.includes("armor")) return "armor";
  if (itemType.includes("weapon") || weaponType) return "weapon";
  if (itemType.includes("potion")) return "potion";
  if (itemType.includes("scroll")) return "scroll";
  if (itemType.includes("tool")) return "tool";
  return "all";
}

function getDisplayType(item) {
  return normalize(item?.data?.info?.itemType) || "Item";
}

function getWeight(item) {
  // create-item.js stores weight under data.info.weight (number|null)
  const w = item?.data?.info?.weight;
  const n = toNumberOrNull(w);
  return n ?? 0;
}

function uniqById(items) {
  const m = new Map();
  for (const it of items) {
    if (!it?.id) continue;
    m.set(String(it.id), it);
  }
  return Array.from(m.values());
}

function renderResults({ resultsEl, items }) {
  if (!resultsEl) return;
  resultsEl.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "item-result-placeholder";
    empty.textContent = "No items in your collection yet.";
    resultsEl.appendChild(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("div");
    card.className = "item-result-card";
    card.dataset.hvItemId = String(item.id);
    card.dataset.hvCategory = inferCategory(item);
    card.dataset.hvName = normalize(item.name).toLowerCase();
    card.dataset.hvType = getDisplayType(item).toLowerCase();

    const info = document.createElement("div");
    info.className = "item-info";
    const nameEl = document.createElement("div");
    nameEl.className = "item-name";
    nameEl.textContent = normalize(item.name) || "Unnamed Item";
    const typeEl = document.createElement("div");
    typeEl.className = "item-type";
    typeEl.textContent = getDisplayType(item);
    info.append(nameEl, typeEl);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "add-item-btn";
    addBtn.title = "Add";
    addBtn.innerHTML = `<i class="fas fa-plus"></i>`;

    card.append(info, addBtn);
    resultsEl.appendChild(card);
  }
}

function ensureInventoryEmptyState(listEl) {
  if (!listEl) return;
  const hasAny = Array.from(listEl.children).some((c) => !c.classList.contains("empty-state"));
  const empty = listEl.querySelector(".empty-state");
  if (!hasAny) {
    if (!empty) {
      const div = document.createElement("div");
      div.className = "empty-state";
      div.textContent = "No items equipped";
      listEl.appendChild(div);
    }
  } else {
    empty?.remove();
  }
}

function recalcTotalWeight(listEl, totalEl) {
  if (!listEl || !totalEl) return;
  const rows = Array.from(listEl.querySelectorAll(".hv-inv-row"));
  const total = rows.reduce((sum, row) => sum + (toNumberOrNull(row.dataset.hvWeight) ?? 0), 0);
  totalEl.textContent = String(Math.round(total * 100) / 100);
}

function addToInventory({ listEl, totalEl, item }) {
  if (!listEl) return;

  const row = document.createElement("div");
  row.className = "hv-inv-row";
  row.dataset.hvItemId = String(item.id);
  row.dataset.hvWeight = String(getWeight(item));

  const left = document.createElement("div");
  left.className = "hv-inv-left";

  const nm = document.createElement("div");
  nm.className = "hv-inv-name";
  nm.textContent = normalize(item.name) || "Unnamed Item";

  const meta = document.createElement("div");
  meta.className = "hv-inv-meta";
  const w = getWeight(item);
  meta.textContent = `${getDisplayType(item)} · ${w} lb`;

  left.append(nm, meta);

  const rm = document.createElement("button");
  rm.type = "button";
  rm.className = "hv-inv-remove";
  rm.title = "Remove";
  rm.textContent = "×";
  rm.addEventListener("click", () => {
    row.remove();
    ensureInventoryEmptyState(listEl);
    recalcTotalWeight(listEl, totalEl);
    persistInventoryDraft(listEl);
  });

  row.append(left, rm);
  listEl.appendChild(row);

  ensureInventoryEmptyState(listEl);
  recalcTotalWeight(listEl, totalEl);
  persistInventoryDraft(listEl);
}

function persistInventoryDraft(listEl) {
  const rows = Array.from(listEl?.querySelectorAll?.(".hv-inv-row") || []);
  const items = rows.map((r) => ({
    homebrewId: r.dataset.hvItemId || "",
    weight: toNumberOrNull(r.dataset.hvWeight) ?? 0,
    name: r.querySelector(".hv-inv-name")?.textContent || "",
  }));
  saveDraft({ equipmentItems: items });
}

function restoreInventoryFromDraft(listEl, totalEl) {
  const draft = loadDraft();
  const items = Array.isArray(draft.equipmentItems) ? draft.equipmentItems : [];
  if (!items.length) {
    ensureInventoryEmptyState(listEl);
    recalcTotalWeight(listEl, totalEl);
    return;
  }

  // Clear placeholder empty-state but keep existing rows if user already interacted
  const existingRows = listEl.querySelectorAll(".hv-inv-row");
  if (existingRows.length) return;
  listEl.querySelector(".empty-state")?.remove();

  for (const it of items) {
    const row = document.createElement("div");
    row.className = "hv-inv-row";
    row.dataset.hvItemId = String(it?.homebrewId || "");
    row.dataset.hvWeight = String(toNumberOrNull(it?.weight) ?? 0);

    const left = document.createElement("div");
    left.className = "hv-inv-left";
    const nm = document.createElement("div");
    nm.className = "hv-inv-name";
    nm.textContent = normalize(it?.name) || "Item";
    const meta = document.createElement("div");
    meta.className = "hv-inv-meta";
    meta.textContent = `${toNumberOrNull(it?.weight) ?? 0} lb`;
    left.append(nm, meta);

    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "hv-inv-remove";
    rm.title = "Remove";
    rm.textContent = "×";
    rm.addEventListener("click", () => {
      row.remove();
      ensureInventoryEmptyState(listEl);
      recalcTotalWeight(listEl, totalEl);
      persistInventoryDraft(listEl);
    });

    row.append(left, rm);
    listEl.appendChild(row);
  }

  ensureInventoryEmptyState(listEl);
  recalcTotalWeight(listEl, totalEl);
}

function applyFilters(resultsEl, { query, category }) {
  const q = normalize(query).toLowerCase();
  const cat = normalize(category).toLowerCase() || "all";
  const cards = Array.from(resultsEl.querySelectorAll(".item-result-card"));
  cards.forEach((c) => {
    const name = c.dataset.hvName || "";
    const type = c.dataset.hvType || "";
    const ccat = c.dataset.hvCategory || "all";
    const matchQ = !q || `${name} ${type}`.includes(q);
    const matchCat = cat === "all" || ccat === cat;
    c.style.display = matchQ && matchCat ? "" : "none";
  });
}

export async function initEquipmentPanel() {
  const ok = await window.ensureAuthOrPrompt?.();
  if (!ok) return;

  const panel = document.getElementById("panel-equipment");
  if (!panel) return;

  const resultsEl = panel.querySelector(".items-results-list");
  const searchEl = panel.querySelector(".item-search-input");
  const filterBtns = Array.from(panel.querySelectorAll(".filter-btn"));
  const inventoryEl = document.getElementById("inventory-list");
  const totalEl = document.getElementById("total-weight");

  if (!resultsEl) return;

  resultsEl.innerHTML = `<div class="item-result-placeholder">Loading your collection…</div>`;

  const { data: sessionData } = await window.supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return;

  // Load saved items (collection)
  const { data: savedRows, error: savedErr } = await window.supabase
    .from("user_saved_items")
    .select("id, added_at, homebrew:homebrew_id (id, user_id, type, status, name, data, updated_at)")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  if (savedErr) throw savedErr;

  const savedItems = (Array.isArray(savedRows) ? savedRows : [])
    .map((r) => r?.homebrew)
    .filter((hb) => hb && String(hb.type || "").toLowerCase() === "item");

  // Also include user's own items (even if not saved)
  const { data: ownRows, error: ownErr } = await window.supabase
    .from("homebrew")
    .select("id, user_id, type, status, name, data, updated_at")
    .eq("type", "item")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (ownErr) throw ownErr;

  const merged = uniqById([...(Array.isArray(ownRows) ? ownRows : []), ...savedItems]);
  merged.sort((a, b) => normalize(a?.name).localeCompare(normalize(b?.name), undefined, { sensitivity: "base" }));

  renderResults({ resultsEl, items: merged });

  // Restore inventory from draft
  restoreInventoryFromDraft(inventoryEl, totalEl);

  // Wire Add buttons
  resultsEl.addEventListener("click", (e) => {
    const btn = e.target?.closest?.(".add-item-btn");
    if (!btn) return;
    const card = btn.closest(".item-result-card");
    const id = card?.dataset?.hvItemId;
    if (!id) return;
    const item = merged.find((x) => String(x.id) === String(id));
    if (!item) return;
    addToInventory({ listEl: inventoryEl, totalEl, item });
    notify("Added", "success");
  });

  // Filters
  let activeCategory = "all";
  filterBtns.forEach((b) => {
    b.addEventListener("click", () => {
      filterBtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      activeCategory = b.dataset.filter || "all";
      applyFilters(resultsEl, { query: searchEl?.value, category: activeCategory });
    });
  });

  if (searchEl) {
    searchEl.addEventListener("input", () => {
      applyFilters(resultsEl, { query: searchEl.value, category: activeCategory });
    });
  }

  // Initial filter pass
  applyFilters(resultsEl, { query: searchEl?.value, category: activeCategory });
}



