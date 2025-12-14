// Collection: render user's own homebrew items into category lists.
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

function createActions({ homebrewId, rowEl }) {
  const wrap = document.createElement("div");
  wrap.className = "hv-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "hv-btn hv-open";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => {
    const type = normalizeType(rowEl?.dataset?.hvType);
    let href = "./create.html";
    if (type === "class") href = `./create/create-class.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "spell") href = `./create/create-spell.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "item") href = `./create/create-item.html?id=${encodeURIComponent(homebrewId)}`;
    window.location.href = href;
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "hv-btn hv-remove";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async () => {
    try {
      const { error } = await window.supabase
        .from("homebrew")
        .delete()
        .eq("id", homebrewId);
      if (error) throw error;

      rowEl?.remove();
      notify("Deleted", "success");

      // if now empty
      ensureEmptyMessageIfNeeded();
    } catch (err) {
      console.error("Delete failed:", err);
      notify(`Delete failed: ${err?.message || "Unknown error"}`, "error");
    }
  });

  wrap.append(editBtn, deleteBtn);
  return wrap;
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
      return null;
  }
}

function createBadge(status) {
  const b = document.createElement("span");
  b.className = `hv-badge ${normalizeType(status) || "unknown"}`.trim();
  b.textContent = textOrDash(status);
  return b;
}

function buildRow(homebrew) {
  if (!homebrew) return null;

  const type = normalizeType(homebrew.type);
  const data = homebrew.data || {};

  const li = document.createElement("li");
  // include category-* class so it aligns with existing grid columns
  const headerSel = getCategoryHeaderSelector(type);
  const categoryClass = headerSel ? headerSel.replace(".", "") : "";
  li.className = `item hv-row ${categoryClass}`.trim();
  li.dataset.hvName = String(homebrew.name || "");
  li.dataset.hvType = type;
  li.dataset.hvHomebrewId = String(homebrew.id);

  // Always: name + type
  const nameSpan = createSpan("item-name", textOrDash(homebrew.name));
  const typeSpan = createSpan("item-type", textOrDash(type));
  li.appendChild(nameSpan);
  li.appendChild(typeSpan);

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
    // Show status badge on non item/spell/monster types (per prompt)
    nameSpan.appendChild(createBadge(homebrew.status));

    // Keep grid alignment: add empty placeholders for header columns
    if (type === "feat") {
      li.appendChild(createSpan("tier", ""));
    } else if (type === "subclass") {
      li.appendChild(createSpan("parent-class", ""));
    } else if (type === "faith") {
      li.appendChild(createSpan("domain", ""));
      li.appendChild(createSpan("alignment", ""));
    }
  }

  li.appendChild(
    createActions({
      homebrewId: homebrew.id,
      rowEl: li,
    })
  );

  return li;
}

function ensureEmptyMessageIfNeeded() {
  const main = document.querySelector(".main");
  const header = document.querySelector(".main-content-header");
  if (!main || !header) return;

  const existing = document.getElementById("hv-empty-homebrew");
  const rows = document.querySelectorAll(".main-list .hv-row");
  const anyVisible = Array.from(rows).some((r) => !r.hidden && r.style.display !== "none");

  if (!anyVisible) {
    if (!existing) {
      const div = document.createElement("div");
      div.id = "hv-empty-homebrew";
      div.className = "hv-empty";
      div.textContent = "No content created yet";
      header.insertAdjacentElement("afterend", div);
    }
  } else {
    existing?.remove();
  }
}

function wireSearch() {
  const input = document.querySelector(".search-input");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = String(input.value || "").trim().toLowerCase();
    const rows = document.querySelectorAll(".main-list .hv-row");
    rows.forEach((row) => {
      const name = String(row.dataset.hvName || "").toLowerCase();
      const type = String(row.dataset.hvType || "").toLowerCase();
      const hay = `${name} ${type}`.trim();
      row.hidden = q ? !hay.includes(q) : false;
    });
    ensureEmptyMessageIfNeeded();
  });
}

async function loadHomebrew() {
  console.log("Collection: loading homebrew…");
  const { data, error } = await window.supabase
    .from("homebrew")
    .select("id, type, status, name, data, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const items = Array.isArray(data) ? data : [];
  console.log("Collection: fetched", items.length);
  return items;
}

function renderHomebrew(items) {
  const list = document.querySelector(".main-list");
  if (!list) return;

  const lastInsertedAfter = new Map(); // headerEl -> last row

  for (const hb of items) {
    const type = normalizeType(hb?.type);
    const headerSel = getCategoryHeaderSelector(type);
    if (!headerSel) continue;

    const headerEl = list.querySelector(headerSel);
    if (!headerEl) continue;

    const row = buildRow(hb);
    if (!row) continue;

    const anchor = lastInsertedAfter.get(headerEl) || headerEl;
    anchor.insertAdjacentElement("afterend", row);
    lastInsertedAfter.set(headerEl, row);
  }

  ensureEmptyMessageIfNeeded();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const ok = await window.ensureAuthOrPrompt?.();
    if (!ok) return;

    wireSearch();
    const items = await loadHomebrew();
    renderHomebrew(items);
  } catch (err) {
    console.error("Collection load failed:", err);
    notify("Load failed", "error");
  }
});


