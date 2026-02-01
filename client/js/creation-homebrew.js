// Creation page: list "My Homebrew" like Collection does, but only the user's own records.
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

function createBadge(status) {
  const b = document.createElement("span");
  b.className = `hv-badge ${normalizeType(status) || "unknown"}`.trim();
  b.textContent = textOrDash(status);
  return b;
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

function getEditHref(type, id) {
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

function getOpenHref(type, id) {
  const t = normalizeType(type);
  if (t === "monster") return `./view-monster.html?id=${encodeURIComponent(id)}`;
  if (t === "pet") return `./view-pet.html?id=${encodeURIComponent(id)}`;
  if (t === "class") return `./view-class.html?id=${encodeURIComponent(id)}`;
  if (t === "spell") return `./view-spell.html?id=${encodeURIComponent(id)}`;
  if (t === "item") return `./view-item.html?id=${encodeURIComponent(id)}`;
  if (t === "race") return `./view-race.html?id=${encodeURIComponent(id)}`;
  if (t === "background") return `./view-background.html?id=${encodeURIComponent(id)}`;
  if (t === "feat") return `./view-feat.html?id=${encodeURIComponent(id)}`;
  if (t === "subclass") return `./view-subclass.html?id=${encodeURIComponent(id)}`;
  if (t === "faith") return `./view-faith.html?id=${encodeURIComponent(id)}`;
  // fallback: open behaves like edit for other types (no dedicated view pages yet)
  return getEditHref(t, id);
}

function createActions({ homebrewId, rowEl }) {
  const wrap = document.createElement("div");
  wrap.className = "hv-actions";

  function getHref() {
    const type = normalizeType(rowEl?.dataset?.hvType);
    return getEditHref(type, homebrewId);
  }

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "hv-btn hv-open";
  openBtn.textContent = "Open";
  openBtn.addEventListener("click", () => {
    const type = normalizeType(rowEl?.dataset?.hvType);
    window.open(getOpenHref(type, homebrewId), "_blank", "noopener");
  });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "hv-btn hv-open";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => {
    window.location.href = getHref();
  });

  const shareBtn = document.createElement("button");
  shareBtn.type = "button";
  shareBtn.className = "hv-btn hv-share";
  shareBtn.textContent = "Share";
  shareBtn.addEventListener("click", async () => {
    try {
      shareBtn.disabled = true;
      shareBtn.textContent = "Sharing...";

      const { data: sessionData } = await window.supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        window.AuthModalInstance?.show?.();
        return;
      }

      const { error } = await window.supabase
        .from("homebrew")
        .update({ status: "public" })
        .eq("id", homebrewId)
        .eq("user_id", userId);
      if (error) throw error;

      // Update badge in DOM (if present)
      const badge = rowEl.querySelector(".hv-badge");
      if (badge) {
        badge.classList.remove("draft", "private");
        badge.classList.add("public");
        badge.textContent = "public";
      }

      // Remember new status on row and hide share button
      rowEl.dataset.hvStatus = "public";
      shareBtn.remove();

      notify("Shared", "success");
    } catch (err) {
      console.error("Share failed:", err);
      notify("Share failed", "error");
      shareBtn.disabled = false;
      shareBtn.textContent = "Share";
    }
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
      ensureEmptyMessageIfNeeded();
    } catch (err) {
      console.error("Delete failed:", err);
      notify("Delete failed", "error");
    }
  });

  // Share should only be available when status === "draft"
  const currentStatus = normalizeType(rowEl?.dataset?.hvStatus);
  if (currentStatus === "draft") {
    wrap.append(openBtn, editBtn, shareBtn, deleteBtn);
  } else {
    wrap.append(openBtn, editBtn, deleteBtn);
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
  li.dataset.hvStatus = normalizeType(homebrew.status || "draft");

  const nameEl = createSpan("item-name", textOrDash(homebrew.name));
  // For class + all other types (except item/spell/monster) show status badge next to name
  if (type !== "item" && type !== "spell" && type !== "monster") {
    nameEl.appendChild(createBadge(homebrew.status));
  }

  li.appendChild(nameEl);
  li.appendChild(createSpan("item-type", textOrDash(type)));

  // Removed extra columns here to simplify view (Name | Type | Buttons)

  li.appendChild(createActions({ homebrewId: homebrew.id, rowEl: li }));
  return li;
}

function ensureEmptyMessageIfNeeded() {
  const header = document.querySelector(".main-content-header");
  if (!header) return;

  const existing = document.getElementById("hv-empty-homebrew");
  const rows = document.querySelectorAll(".main-list .hv-row");
  const anyVisible = Array.from(rows).some((r) => !r.hidden && r.style.display !== "none");

  if (!anyVisible) {
    if (!existing) {
      const div = document.createElement("div");
      div.id = "hv-empty-homebrew";
      div.className = "hv-empty";
      div.textContent = "You haven’t created anything yet.";
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

async function loadMyHomebrew(userId) {
  console.log("Creation: loading homebrew…");
  const { data, error } = await window.supabase
    .from("homebrew")
    .select("id, type, status, name, data, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const items = Array.isArray(data) ? data : [];
  console.log("Creation: fetched", items.length);
  return items;
}

function renderHomebrew(items) {
  const list = document.querySelector(".main-list");
  if (!list) return;

  // remove any previously rendered rows
  list.querySelectorAll(".hv-row").forEach((el) => el.remove());

  // ignore NPC header row (DB doesn't have npc enum)
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
    const session = sessionData?.session || null;
    if (!session?.user?.id) return;

    wireSearch();
    const items = await loadMyHomebrew(session.user.id);
    renderHomebrew(items);
  } catch (err) {
    console.error(err);
    notify("Load failed", "error");
  }
});

