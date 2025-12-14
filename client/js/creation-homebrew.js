// Creation page: show "My Homebrew" grouped by type.
// ESM module. Depends on:
// - window.supabase (from supabase-client.js)
// - window.ensureAuthOrPrompt (from auth-ui.js)

const TYPE_CONFIG = {
  item: { label: "Item", createHref: "./create/create-item.html" },
  monster: { label: "Monster", createHref: "./create/create-monster.html" },
  class: { label: "Class", createHref: "./create/create-class.html" },
  spell: { label: "Spell", createHref: "./create/create-spell.html" },
  race: { label: "Race", createHref: "./create/create-rase.html" }, // file name in repo
  background: { label: "Background", createHref: "./create/create-background.html" },
  feat: { label: "Feat", createHref: "./create/create-feat.html" },
  subclass: { label: "Sub-Class", createHref: "./create/create-subclass.html" },
  pet: { label: "Pet", createHref: "./create/create-pet.html" },
  faith: { label: "Faith", createHref: "./create/create-faith.html" },
};

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

function formatShortDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

function getTypeFromCategoryRow(rowEl) {
  if (!rowEl) return null;
  const text = (rowEl.textContent || "").toLowerCase();
  if (text.includes("sub-class") || text.includes("subclass")) return "subclass";
  if (text.includes("background")) return "background";
  if (text.includes("monster")) return "monster";
  if (text.includes("spell")) return "spell";
  if (text.includes("class")) return "class";
  if (text.includes("race")) return "race";
  if (text.includes("feat")) return "feat";
  if (text.includes("faith")) return "faith";
  if (text.includes("pet")) return "pet";
  if (text.includes("item")) return "item";
  // ignore NPC row on purpose
  if (text.includes("npc")) return null;
  return null;
}

function ensureEmptyState(totalCount) {
  const header = document.querySelector(".main-content-header");
  if (!header) return;

  const existing = document.getElementById("hv-creation-empty");
  if (totalCount === 0) {
    if (!existing) {
      const div = document.createElement("div");
      div.id = "hv-creation-empty";
      div.className = "hv-empty";
      div.textContent = "You haven’t created anything yet.";
      header.insertAdjacentElement("afterend", div);
    }
  } else {
    existing?.remove();
  }
}

function clearPreviousInjected() {
  document.querySelectorAll(".hv-sublist").forEach((el) => el.remove());
  document.querySelectorAll(".hv-row-actions").forEach((el) => el.remove());
  document.querySelectorAll(".hv-meta").forEach((el) => el.remove());
}

function buildBadge(status) {
  const s = document.createElement("span");
  const st = String(status || "draft").toLowerCase();
  s.className = `hv-badge ${st}`;
  s.textContent = st;
  return s;
}

function openEditFor(type, id) {
  const t = normalizeType(type);
  let href = "./create.html";
  if (t === "class") href = `./create/create-class.html?id=${encodeURIComponent(id)}`;
  else if (t === "spell") href = `./create/create-spell.html?id=${encodeURIComponent(id)}`;
  else if (t === "item") href = `./create/create-item.html?id=${encodeURIComponent(id)}`;
  else if (t === "monster") href = `./create/create-monster.html?id=${encodeURIComponent(id)}`;
  else if (t === "race") href = `./create/create-rase.html?id=${encodeURIComponent(id)}`;
  else if (t === "background") href = `./create/create-background.html?id=${encodeURIComponent(id)}`;
  else if (t === "feat") href = `./create/create-feat.html?id=${encodeURIComponent(id)}`;
  else if (t === "subclass") href = `./create/create-subclass.html?id=${encodeURIComponent(id)}`;
  else if (t === "pet") href = `./create/create-pet.html?id=${encodeURIComponent(id)}`;
  else if (t === "faith") href = `./create/create-faith.html?id=${encodeURIComponent(id)}`;
  window.location.href = href;
}

function buildSublist(type, items) {
  const ul = document.createElement("ul");
  ul.className = "hv-sublist";
  ul.dataset.hvType = type;

  items.slice(0, 10).forEach((it) => {
    const li = document.createElement("li");
    li.className = "hv-subitem";
    li.tabIndex = 0;

    const name = document.createElement("span");
    name.className = "hv-subname";
    name.textContent = it.name || "-";

    const badge = buildBadge(it.status);

    const date = document.createElement("span");
    date.className = "hv-subdate";
    date.textContent = formatShortDate(it.updated_at);

    li.append(name, badge, date);
    li.addEventListener("click", () => openEditFor(type, it.id));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openEditFor(type, it.id);
    });

    ul.appendChild(li);
  });

  return ul;
}

function applySearchFilter(groups, query) {
  const q = String(query || "").trim().toLowerCase();
  const rows = document.querySelectorAll(".main-list > li.item");
  rows.forEach((row) => {
    // only filter category rows (not sublists)
    if (row.classList.contains("hv-row")) return;
    const type = getTypeFromCategoryRow(row);
    if (!type) return;

    const items = groups[type] || [];
    const matchesGroup =
      !q ||
      type.includes(q) ||
      (TYPE_CONFIG[type]?.label || "").toLowerCase().includes(q) ||
      items.some((it) => String(it.name || "").toLowerCase().includes(q));

    row.style.display = matchesGroup ? "" : "none";

    // if sublist open, filter its items too
    const sub = row.nextElementSibling;
    if (sub && sub.classList?.contains("hv-sublist")) {
      Array.from(sub.querySelectorAll(".hv-subitem")).forEach((subItemEl) => {
        const nm = (subItemEl.querySelector(".hv-subname")?.textContent || "").toLowerCase();
        subItemEl.style.display = !q || nm.includes(q) ? "" : "none";
      });
    }
  });
}

async function fetchHomebrew() {
  const { data, error } = await window.supabase
    .from("homebrew")
    .select("id, type, status, name, data, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

function groupByType(items) {
  const groups = {};
  items.forEach((it) => {
    const t = normalizeType(it.type);
    if (!TYPE_CONFIG[t]) return; // ignore npc/unknown
    (groups[t] ||= []).push(it);
  });
  return groups;
}

function updateCategoryRow(row, type, items) {
  const count = items.length;
  const latest = items[0]?.updated_at || null;

  const nameEl = row.querySelector(".item-name");
  const typeEl = row.querySelector(".item-type");

  if (nameEl) {
    nameEl.textContent = `${TYPE_CONFIG[type].label} (${count})`;
  }

  if (typeEl) {
    // show last updated in the "type" column (keeps column count intact)
    typeEl.textContent = `Last: ${formatShortDate(latest)}`;
  }

  // wipe placeholder columns to avoid misleading text
  row.querySelectorAll(".type-item,.weapon-type,.rarity,.type-monster,.cr,.ac,.hp,.type-spell,.range,.level,.tier,.role,.parent-class,.domain,.alignment")
    .forEach((el) => (el.textContent = "-"));

  // replace existing edit button with our actions container (still 1 grid cell)
  const oldBtn = row.querySelector(".item-button-edit");
  if (oldBtn) oldBtn.style.display = "none";

  const actions = document.createElement("div");
  actions.className = "hv-row-actions";

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "hv-action-btn";
  openBtn.textContent = "Open list";

  const createBtn = document.createElement("button");
  createBtn.type = "button";
  createBtn.className = "hv-action-btn";
  createBtn.textContent = "Create new";
  createBtn.addEventListener("click", () => {
    const href = TYPE_CONFIG[type]?.createHref || "./create.html";
    window.location.href = href;
  });

  openBtn.addEventListener("click", () => {
    // toggle sublist right after this row
    const next = row.nextElementSibling;
    if (next && next.classList?.contains("hv-sublist")) {
      next.remove();
      return;
    }

    // close other open sublists
    document.querySelectorAll(".hv-sublist").forEach((el) => el.remove());

    const sub = buildSublist(type, items);
    row.insertAdjacentElement("afterend", sub);
  });

  actions.append(openBtn, createBtn);
  row.appendChild(actions);
}

function renderSummaryIntoMainList(groups) {
  const list = document.querySelector(".main-list");
  if (!list) return false;

  // hide NPC category row (explicitly ignored)
  const npcRow = list.querySelector(".category-nps");
  if (npcRow) npcRow.style.display = "none";

  const categoryRows = Array.from(list.querySelectorAll(":scope > li.item"));
  let anyMatched = false;

  categoryRows.forEach((row) => {
    const type = getTypeFromCategoryRow(row);
    if (!type) return;
    if (!TYPE_CONFIG[type]) return;

    const items = groups[type] || [];
    updateCategoryRow(row, type, items);
    anyMatched = true;
  });

  return anyMatched;
}

function renderFallbackCards(groups) {
  const header = document.querySelector(".main-content-header");
  if (!header) return;

  const wrap = document.createElement("div");
  wrap.className = "hv-creation-summary";

  Object.keys(TYPE_CONFIG).forEach((type) => {
    const items = groups[type] || [];
    const card = document.createElement("div");
    card.className = "hv-creation-card";

    const title = document.createElement("div");
    title.className = "hv-creation-title";
    title.textContent = TYPE_CONFIG[type].label;

    const meta = document.createElement("div");
    meta.className = "hv-meta";
    meta.textContent = `${items.length} • Last: ${formatShortDate(items[0]?.updated_at)}`;

    const actions = document.createElement("div");
    actions.className = "hv-row-actions";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "hv-action-btn";
    openBtn.textContent = "Open list";

    const createBtn = document.createElement("button");
    createBtn.type = "button";
    createBtn.className = "hv-action-btn";
    createBtn.textContent = "Create new";
    createBtn.addEventListener("click", () => {
      window.location.href = TYPE_CONFIG[type].createHref || "./create.html";
    });

    openBtn.addEventListener("click", () => {
      const existing = card.querySelector(".hv-sublist");
      if (existing) {
        existing.remove();
      } else {
        card.appendChild(buildSublist(type, items));
      }
    });

    actions.append(openBtn, createBtn);
    card.append(title, meta, actions);
    wrap.appendChild(card);
  });

  header.insertAdjacentElement("afterend", wrap);
}

function wireSearch(groups) {
  const input =
    document.querySelector(".search-input") ||
    document.querySelector(".searchbar-wrap input");
  if (!input) return;

  input.addEventListener("input", () => applySearchFilter(groups, input.value));
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const ok = await window.ensureAuthOrPrompt?.();
    if (!ok) return;

    const items = await fetchHomebrew();
    console.log("Creation: fetched", items.length);

    const groups = groupByType(items);
    ensureEmptyState(items.length);

    clearPreviousInjected();

    const okUi = renderSummaryIntoMainList(groups);
    if (!okUi) {
      renderFallbackCards(groups);
    }

    wireSearch(groups);
  } catch (err) {
    console.error(err);
    notify("Load failed", "error");
  }
});


