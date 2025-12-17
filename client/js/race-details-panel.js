// client/js/race-details-panel.js (ESM)
// Race Details panel + 3 language selectors with dedupe + persistence.

const LANGUAGE_OPTIONS = [
  "Common",
  "Dwarvish",
  "Elvish",
  "Giant",
  "Gnomish",
  "Goblin",
  "Halfling",
  "Orc",
  "Draconic",
  "Abyssal",
  "Celestial",
  "Infernal",
  "Sylvan",
  "Undercommon",
];

function normalize(s) {
  return String(s || "").trim();
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function ensureDraft() {
  if (!window.HVCharacterDraft || typeof window.HVCharacterDraft !== "object") {
    window.HVCharacterDraft = {};
  }
  return window.HVCharacterDraft;
}

function loadDraftFromStorage() {
  const raw = localStorage.getItem("hv_character_draft");
  const parsed = raw ? safeJsonParse(raw) : null;
  if (parsed && typeof parsed === "object") {
    window.HVCharacterDraft = { ...ensureDraft(), ...parsed };
  }
  return ensureDraft();
}

function persistDraft() {
  try {
    localStorage.setItem("hv_character_draft", JSON.stringify(ensureDraft()));
  } catch (e) {
    // ignore quota / privacy errors
    console.warn("Failed to persist hv_character_draft:", e);
  }
}

function ensurePanelSkeleton(mountEl) {
  if (!mountEl) return null;

  const existing = mountEl.querySelector(":scope > .hv-race-details");
  if (existing) return existing;

  const section = document.createElement("section");
  section.className = "hv-race-details";
  section.id = "hvRaceDetails";
  section.innerHTML = `
    <div class="hv-rd-header">
      <div class="hv-rd-title">RACE DETAILS</div>
    </div>
    <div class="hv-rd-body"></div>
  `.trim();

  mountEl.appendChild(section);
  return section;
}

function getBodyEl(rootEl) {
  return rootEl?.querySelector?.(".hv-rd-body") || null;
}

function createInfoRow(label, value) {
  const row = document.createElement("div");
  row.className = "hv-rd-row";
  row.innerHTML = `<div class="hv-rd-label"></div><div class="hv-rd-value"></div>`;
  row.querySelector(".hv-rd-label").textContent = label;
  row.querySelector(".hv-rd-value").textContent = value || "-";
  return row;
}

function updateLanguageDedupe(selectEls) {
  const selected = new Set(
    selectEls
      .map((s) => normalize(s?.value))
      .filter((v) => v && v !== "__none__")
  );

  for (const sel of selectEls) {
    const current = normalize(sel.value);
    for (const opt of Array.from(sel.options)) {
      const val = normalize(opt.value);
      if (!val || val === "__none__") {
        opt.disabled = false;
        continue;
      }
      // disable in other selects if already chosen elsewhere
      opt.disabled = selected.has(val) && val !== current;
    }
  }
}

function buildLanguagesSection({ initialLanguages = [] }) {
  const wrap = document.createElement("div");
  wrap.className = "hv-rd-languages";

  const title = document.createElement("div");
  title.className = "hv-rd-subtitle";
  title.textContent = "Languages";
  wrap.appendChild(title);

  const rowsWrap = document.createElement("div");
  rowsWrap.className = "hv-lang-grid";

  const selects = [];

  for (let i = 0; i < 3; i++) {
    const row = document.createElement("div");
    row.className = "hv-lang-row";

    const lab = document.createElement("label");
    lab.className = "hv-lang-label";
    lab.textContent = `Language ${i + 1}`;

    const sel = document.createElement("select");
    sel.className = "hv-lang-select";
    sel.dataset.hvLangIndex = String(i);

    const none = document.createElement("option");
    none.value = "__none__";
    none.textContent = "— Select —";
    sel.appendChild(none);

    for (const lang of LANGUAGE_OPTIONS) {
      const opt = document.createElement("option");
      opt.value = lang;
      opt.textContent = lang;
      sel.appendChild(opt);
    }

    const initial = normalize(initialLanguages[i]);
    if (initial) sel.value = initial;

    row.append(lab, sel);
    rowsWrap.appendChild(row);
    selects.push(sel);
  }

  wrap.appendChild(rowsWrap);

  // wire dedupe
  updateLanguageDedupe(selects);
  for (const sel of selects) {
    sel.addEventListener("change", () => updateLanguageDedupe(selects));
  }

  return { wrap, selects };
}

function getRaceDescriptionHtml(raceHomebrew) {
  const d = raceHomebrew?.data || {};
  return (
    d?.descriptionHtml ||
    d?.description ||
    d?.info?.descriptionHtml ||
    d?.info?.description ||
    ""
  );
}

function getRaceInfo(raceHomebrew) {
  const d = raceHomebrew?.data || {};
  const info = d?.info || {};
  return {
    size: normalize(info?.size || d?.size),
    speed: normalize(info?.speed || d?.speed),
    vision: normalize(info?.vision || d?.vision),
  };
}

function renderTraits({ containerEl, raceHomebrew }) {
  const d = raceHomebrew?.data || {};

  // 1) If you have traitsHtml (our create-race-save.js uses this)
  if (normalize(d?.traitsHtml)) {
    const title = document.createElement("div");
    title.className = "hv-rd-subtitle";
    title.textContent = "Traits";
    const block = document.createElement("div");
    block.className = "hv-rd-rich content-block";
    block.innerHTML = d.traitsHtml;
    containerEl.append(title, block);
    return;
  }

  // 2) If you have traits array: [{ name, descriptionHtml/description }]
  if (Array.isArray(d?.traits) && d.traits.length) {
    const title = document.createElement("div");
    title.className = "hv-rd-subtitle";
    title.textContent = "Traits";
    containerEl.appendChild(title);

    const ul = document.createElement("ul");
    ul.className = "hv-rd-traits";
    for (const t of d.traits) {
      const li = document.createElement("li");
      const tName = normalize(t?.name);
      const tHtml = t?.descriptionHtml != null ? String(t.descriptionHtml) : "";
      const tText = t?.description != null ? String(t.description) : "";

      const head = document.createElement("div");
      head.className = "hv-rd-trait-name";
      head.textContent = tName || "Trait";

      const body = document.createElement("div");
      body.className = "hv-rd-trait-desc content-block";
      if (normalize(tHtml)) body.innerHTML = tHtml;
      else body.textContent = normalize(tText) || "—";

      li.append(head, body);
      ul.appendChild(li);
    }
    containerEl.appendChild(ul);
  }
}

export function renderRaceDetails({ mountEl, raceHomebrew }) {
  const rootEl = ensurePanelSkeleton(mountEl);
  if (!rootEl) return;

  // ensure draft exists and load persisted values once
  loadDraftFromStorage();

  const bodyEl = getBodyEl(rootEl);
  if (!bodyEl) return;

  bodyEl.innerHTML = "";

  if (!raceHomebrew) {
    const empty = document.createElement("div");
    empty.className = "hv-rd-empty";
    empty.textContent = "Select a race to see details.";
    bodyEl.appendChild(empty);
    return;
  }

  const draft = ensureDraft();
  draft.raceId = String(raceHomebrew.id || "");
  draft.raceName = normalize(raceHomebrew.name) || "Race";

  const name = document.createElement("div");
  name.className = "hv-rd-name";
  name.textContent = draft.raceName;
  bodyEl.appendChild(name);

  const descHtml = getRaceDescriptionHtml(raceHomebrew);
  if (normalize(descHtml)) {
    const desc = document.createElement("div");
    desc.className = "hv-rd-desc content-block";
    desc.innerHTML = descHtml;
    bodyEl.appendChild(desc);
  }

  const info = getRaceInfo(raceHomebrew);
  if (info.size || info.speed || info.vision) {
    const meta = document.createElement("div");
    meta.className = "hv-rd-meta";
    if (info.size) meta.appendChild(createInfoRow("Size", info.size));
    if (info.speed) meta.appendChild(createInfoRow("Speed", info.speed));
    if (info.vision) meta.appendChild(createInfoRow("Vision", info.vision));
    bodyEl.appendChild(meta);
  }

  renderTraits({ containerEl: bodyEl, raceHomebrew });

  const initialLangs = Array.isArray(draft.languages) ? draft.languages : [];
  const { wrap: langsWrap, selects } = buildLanguagesSection({ initialLanguages: initialLangs });
  bodyEl.appendChild(langsWrap);

  // write initial languages back (normalized)
  draft.languages = selects.map((s) => (s.value === "__none__" ? "" : s.value)).filter((x) => x !== undefined);
  persistDraft();

  // listen changes and persist
  for (const sel of selects) {
    sel.addEventListener("change", () => {
      const curDraft = ensureDraft();
      curDraft.languages = selects.map((s) => (s.value === "__none__" ? "" : s.value));
      persistDraft();
    });
  }
}

export function getDraft() {
  return loadDraftFromStorage();
}

export function setDraft(nextDraft) {
  window.HVCharacterDraft = { ...ensureDraft(), ...(nextDraft || {}) };
  persistDraft();
  return ensureDraft();
}


