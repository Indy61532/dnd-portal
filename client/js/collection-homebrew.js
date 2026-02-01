// Collection: render user's own homebrew items into category lists.
// ESM module. Depends on:
// - window.supabase (from supabase-client.js)
// - window.ensureAuthOrPrompt (from auth-ui.js)

function notify(message, type = "success") {
  if (window.HeroVault?.showNotification) {
    window.HeroVault.showNotification(message, type);
    return;
  }
  console.info(message);
}

function normalizeType(t) {
  return String(t || "").trim().toLowerCase();
}

function textOrDash(v) {
  const s = (v == null ? "" : String(v)).trim();
  return s || "";
}

function createSpan(className, text) {
  const el = document.createElement("span");
  el.className = className;
  el.textContent = text ?? "";
  return el;
}

let currentUserId = null;

function createActions({ homebrewId, rowEl }) {
  const wrap = document.createElement("div");
  wrap.className = "hv-actions";

  function getHref() {
    const type = normalizeType(rowEl?.dataset?.hvType);
    let href = "./create.html";
    if (type === "class") href = `./create/create-class.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "spell") href = `./create/create-spell.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "item") href = `./create/create-item.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "monster") href = `./create/create-monster.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "pet") href = `./create/create-pet.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "class") href = `./create/create-class.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "race") href = `./create/create-race.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "background") href = `./create/create-background.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "feat") href = `./create/create-feat.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "subclass") href = `./create/create-subclass.html?id=${encodeURIComponent(homebrewId)}`;
    else if (type === "faith") href = `./create/create-faith.html?id=${encodeURIComponent(homebrewId)}`;
    return href;
  }

  function getOpenHref() {
    const type = normalizeType(rowEl?.dataset?.hvType);
    if (type === "monster") return `./view-monster.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "pet") return `./view-pet.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "faith") return `./view-faith.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "class") return `./view-class.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "spell") return `./view-spell.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "item") return `./view-item.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "race") return `./view-race.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "background") return `./view-background.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "feat") return `./view-feat.html?id=${encodeURIComponent(homebrewId)}`;
    if (type === "subclass") return `./view-subclass.html?id=${encodeURIComponent(homebrewId)}`;
    return getHref();
  }

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "hv-btn hv-open";
  openBtn.textContent = "Open";
  openBtn.addEventListener("click", () => {
    window.open(getOpenHref(), "_blank", "noopener");
  });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "hv-btn hv-open";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => {
    window.location.href = getHref();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "hv-btn hv-remove";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async () => {
    try {
      const isOwner = String(rowEl?.dataset?.hvIsOwner || "") === "1";
      const userId = currentUserId;
      if (!userId) {
        window.AuthModalInstance?.show?.();
        return;
      }

      if (isOwner) {
        const { error } = await window.supabase
          .from("homebrew")
          .delete()
          .eq("id", homebrewId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await window.supabase
          .from("user_saved_items")
          .delete()
          .eq("user_id", userId)
          .eq("homebrew_id", homebrewId);
        if (error) throw error;
      }

      rowEl?.remove();
      notify(isOwner ? "Deleted" : "Removed from collection", "success");

      // if now empty
      ensureEmptyMessageIfNeeded();
    } catch (err) {
      console.error("Delete failed:", err);
      notify(`Delete failed: ${err?.message || "Unknown error"}`, "error");
    }
  });

  wrap.append(openBtn, editBtn, deleteBtn);
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
  li.dataset.hvOwnerId = String(homebrew.user_id || "");

  // Always: name + type
  const nameSpan = createSpan("item-name", textOrDash(homebrew.name));
  const typeSpan = createSpan("item-type", textOrDash(type));
  li.appendChild(nameSpan);
  li.appendChild(typeSpan);

  // Show status badge on non item/spell/monster types (per prompt)
  if (type !== "item" && type !== "spell" && type !== "monster") {
      nameSpan.appendChild(createBadge(homebrew.status));
  }

  // Removed extra columns here to simplify view (Name | Type | Buttons)

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
  if (!currentUserId) return [];
  console.log("Collection: loading homebrew…");

  const { data: owned, error: ownedError } = await window.supabase
    .from("homebrew")
    .select("id, user_id, type, status, name, data, updated_at")
    .eq("user_id", currentUserId)
    .order("updated_at", { ascending: false });
  if (ownedError) throw ownedError;

  const { data: savedRows, error: savedError } = await window.supabase
    .from("user_saved_items")
    .select("homebrew:homebrew_id (id, user_id, type, status, name, data, updated_at)")
    .eq("user_id", currentUserId);
  if (savedError) throw savedError;

  const itemsMap = new Map();
  (Array.isArray(owned) ? owned : []).forEach((hb) => {
    if (hb?.id != null) itemsMap.set(String(hb.id), hb);
  });
  (Array.isArray(savedRows) ? savedRows : []).forEach((row) => {
    const hb = row?.homebrew || null;
    if (hb?.id != null && !itemsMap.has(String(hb.id))) {
      itemsMap.set(String(hb.id), hb);
    }
  });

  const items = Array.from(itemsMap.values()).sort((a, b) => {
    const at = new Date(a?.updated_at || 0).getTime();
    const bt = new Date(b?.updated_at || 0).getTime();
    return bt - at;
  });

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

    const isOwner = currentUserId && String(hb.user_id) === String(currentUserId);
    row.dataset.hvIsOwner = isOwner ? "1" : "0";

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

    const { data: sessionData } = await window.supabase.auth.getSession();
    currentUserId = sessionData?.session?.user?.id || null;
    if (!currentUserId) return;

    wireSearch();
    const items = await loadHomebrew();
    renderHomebrew(items);
  } catch (err) {
    console.error("Collection load failed:", err);
    notify("Load failed", "error");
  }
});

