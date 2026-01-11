// client/js/class-features-panel.js (ESM)
// Renders a D&D Beyond-like "Class Features" panel:
// - Level dropdown (1-20)
// - Accordion of features available up to selected level
//
// Usage:
//   import { renderClassFeaturesPanel } from "../../js/class-features-panel.js";
//   renderClassFeaturesPanel({ mountEl, classHomebrew });

function normalizeFeatureName(name) {
  return String(name || "")
    .replace(/\s+/g, " ")
    .replace(/[×✕✖]/g, "")
    .trim()
    .toLowerCase();
}

function toIntOrNull(v) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function ensurePanelSkeleton(mountEl) {
  if (!mountEl) return null;

  // If already rendered, reuse.
  const existing = mountEl.querySelector(":scope > .hv-class-features");
  if (existing) return existing;

  const section = document.createElement("section");
  section.className = "hv-class-features";
  section.innerHTML = `
    <div class="hv-cf-header">
      <div class="hv-cf-title">CLASS FEATURES</div>
      <label class="hv-cf-level">
        <span>Level</span>
        <select id="hvClassLevelSelect"></select>
      </label>
    </div>
    <div id="hvClassFeaturesList" class="hv-cf-list"></div>
  `.trim();

  mountEl.appendChild(section);
  return section;
}

function getSelectEl(rootEl) {
  return rootEl?.querySelector?.("#hvClassLevelSelect") || document.getElementById("hvClassLevelSelect");
}

function getListEl(rootEl) {
  return rootEl?.querySelector?.("#hvClassFeaturesList") || document.getElementById("hvClassFeaturesList");
}

function fillLevelSelect(selectEl, defaultLevel = 1) {
  if (!selectEl) return;
  const cur = getSelectedLevel() ?? defaultLevel;

  selectEl.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = String(i);
    selectEl.appendChild(opt);
  }

  const clamped = Math.min(20, Math.max(1, cur));
  selectEl.value = String(clamped);
}

function getProgressionLevels(classHomebrew) {
  const levels = classHomebrew?.data?.progression?.levels;
  if (!Array.isArray(levels)) return [];
  return levels
    .map((l) => ({
      level: toIntOrNull(l?.level),
      features: Array.isArray(l?.features) ? l.features : [],
    }))
    .filter((l) => l.level != null)
    .sort((a, b) => a.level - b.level);
}

function getCustomFeatures(classHomebrew) {
  const custom = classHomebrew?.data?.customFeatures;
  if (!Array.isArray(custom)) return [];
  return custom
    .map((f) => ({
      name: String(f?.name || "").trim(),
      description: f?.description != null ? String(f.description) : null,
      descriptionHtml: f?.descriptionHtml != null ? String(f.descriptionHtml) : null,
    }))
    .filter((f) => f.name);
}

function computeFeaturesUpToLevel({ classHomebrew, selectedLevel }) {
  const levels = getProgressionLevels(classHomebrew);
  const unique = [];
  const seen = new Set();
  const firstLevelByKey = new Map(); // normalized -> first level

  for (const row of levels) {
    if (row.level > selectedLevel) break;
    for (const rawName of row.features) {
      const name = String(rawName || "").trim();
      if (!name) continue;
      const key = normalizeFeatureName(name);
      if (!key) continue;

      if (!firstLevelByKey.has(key)) firstLevelByKey.set(key, row.level);
      if (seen.has(key)) continue;

      seen.add(key);
      unique.push({ name, key });
    }
  }

  return { unique, firstLevelByKey };
}

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function createAccordionCard({ featureName, levelLabel, descriptionHtml, descriptionText }) {
  const card = document.createElement("div");
  card.className = "hv-cf-card";

  const head = document.createElement("button");
  head.type = "button";
  head.className = "hv-cf-head";
  head.innerHTML = `
    <div class="hv-cf-head-left">
      <div class="hv-cf-name"></div>
      <div class="hv-cf-meta"></div>
    </div>
    <div class="hv-cf-caret" aria-hidden="true"></div>
  `.trim();

  const nameEl = head.querySelector(".hv-cf-name");
  const metaEl = head.querySelector(".hv-cf-meta");
  if (nameEl) nameEl.textContent = featureName;
  if (metaEl) metaEl.textContent = levelLabel;

  const bodyWrap = document.createElement("div");
  bodyWrap.className = "hv-cf-body";

  const bodyInner = document.createElement("div");
  bodyInner.className = "hv-cf-body-inner content-block";
  if (descriptionHtml && descriptionHtml.trim()) {
    bodyInner.innerHTML = descriptionHtml;
  } else {
    bodyInner.textContent = descriptionText && descriptionText.trim() ? descriptionText : "No description yet.";
  }
  bodyWrap.appendChild(bodyInner);

  card.append(head, bodyWrap);

  return { card, head, bodyWrap };
}

function closeCard({ card, bodyWrap }) {
  card.classList.remove("is-open");
  bodyWrap.style.maxHeight = "0px";
}

function openCard({ card, bodyWrap }) {
  card.classList.add("is-open");
  // wait a tick to ensure scrollHeight is correct when becoming visible
  requestAnimationFrame(() => {
    bodyWrap.style.maxHeight = `${bodyWrap.scrollHeight}px`;
  });
}

function renderList({ rootEl, classHomebrew, selectedLevel }) {
  const listEl = getListEl(rootEl);
  if (!listEl) return;

  listEl.innerHTML = "";

  if (!classHomebrew) {
    const empty = document.createElement("div");
    empty.className = "hv-cf-empty";
    empty.textContent = "Select a class to see features.";
    listEl.appendChild(empty);
    return;
  }

  const { unique, firstLevelByKey } = computeFeaturesUpToLevel({ classHomebrew, selectedLevel });
  const custom = getCustomFeatures(classHomebrew);

  if (unique.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hv-cf-empty";
    empty.textContent = "No features for this level yet.";
    listEl.appendChild(empty);
    return;
  }

  const cards = [];

  for (const f of unique) {
    const found = custom.find((x) => normalizeFeatureName(x.name) === f.key);
    const firstLevel = firstLevelByKey.get(f.key) ?? null;
    const levelLabel = firstLevel ? `${ordinal(firstLevel)} level` : "";

    const { card, head, bodyWrap } = createAccordionCard({
      featureName: f.name,
      levelLabel,
      descriptionHtml: found?.descriptionHtml || null,
      descriptionText: found?.description || null,
    });

    // Accordion behavior: max 1 open at a time (DDB-like)
    head.addEventListener("click", () => {
      const isOpen = card.classList.contains("is-open");
      for (const c of cards) closeCard(c);
      if (!isOpen) openCard({ card, bodyWrap });
    });

    // initial collapsed
    closeCard({ card, bodyWrap });

    listEl.appendChild(card);
    cards.push({ card, bodyWrap });
  }
}

export function getSelectedLevel() {
  const sel = document.getElementById("hvClassLevelSelect");
  const n = toIntOrNull(sel?.value);
  return n;
}

export function setSelectedLevel(level) {
  const n = toIntOrNull(level);
  if (!n) return;
  const sel = document.getElementById("hvClassLevelSelect");
  if (!sel) return;
  sel.value = String(Math.min(20, Math.max(1, n)));
  sel.dispatchEvent(new Event("change", { bubbles: true }));
}

export function renderClassFeaturesPanel({ mountEl, classHomebrew }) {
  const rootEl = ensurePanelSkeleton(mountEl);
  if (!rootEl) return;

  const selectEl = getSelectEl(rootEl);
  fillLevelSelect(selectEl, 1);

  const rerender = () => {
    const selectedLevel = getSelectedLevel() ?? 1;
    renderList({ rootEl, classHomebrew, selectedLevel });
  };

  // Avoid double-binding change listeners if re-rendering with new classHomebrew.
  if (selectEl && !selectEl.dataset.hvBound) {
    selectEl.addEventListener("change", rerender);
    selectEl.dataset.hvBound = "1";
  }

  rerender();
}


