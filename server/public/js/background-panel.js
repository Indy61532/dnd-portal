// client/js/background-panel.js (ESM)
// Background step UI: dropdown + description + skill/tool selects + accordion
// Persists to localStorage key: hv_character_draft

const DRAFT_KEY = "hv_character_draft";

const FALLBACK_SKILLS = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];

const FALLBACK_TOOLS = [
  "None",
  "Thieves' Tools",
  "Herbalism Kit",
  "Smith's Tools",
  "Alchemist's Supplies",
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cartographer's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools",
  "Disguise Kit",
  "Forgery Kit",
  "Dice Set",
  "Dragonchess Set",
  "Playing Card Set",
  "Three-Dragon Ante Set",
  "Bagpipes",
  "Drum",
  "Dulcimer",
  "Flute",
  "Lute",
  "Lyre",
  "Horn",
  "Pan Flute",
  "Shawm",
  "Viol",
  "Navigator's Tools",
  "Poisoner's Kit",
];

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

function saveDraft(next) {
  const cur = loadDraft();
  const merged = { ...cur, ...(next || {}) };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn("Failed to save draft:", e);
  }
  // keep in-memory draft in sync if you use it elsewhere
  if (window.HVCharacterDraft && typeof window.HVCharacterDraft === "object") {
    Object.assign(window.HVCharacterDraft, merged);
  }
  return merged;
}

function ensureSkeleton(mountEl) {
  if (!mountEl) return null;

  const existing = mountEl.querySelector(":scope > .hv-bg");
  if (existing) return existing;

  const section = document.createElement("section");
  section.className = "hv-bg";
  section.innerHTML = `
    <h2>Choose Origin: Background</h2>
    <p class="hv-bg-hint">Pick a background to see details and choose proficiencies.</p>

    <select id="hvBackgroundSelect" class="hv-select"></select>

    <div id="hvBackgroundDescription" class="hv-bg-desc"></div>

    <div class="hv-bg-picks">
      <div class="hv-pick">
        <label>Skill Proficiencies</label>
        <select id="hvBgSkillSelect" class="hv-select"></select>
      </div>

      <div class="hv-pick">
        <label>Tool Proficiencies</label>
        <select id="hvBgToolSelect" class="hv-select"></select>
      </div>
    </div>

    <div class="hv-accordion">
      <button class="hv-acc-btn" data-target="hvBgFeat" type="button">Granted Feat <span class="caret">▾</span></button>
      <div class="hv-acc-panel" id="hvBgFeat"></div>

      <button class="hv-acc-btn" data-target="hvBgAbilities" type="button">Ability Scores <span class="caret">▾</span></button>
      <div class="hv-acc-panel" id="hvBgAbilities"></div>
    </div>
  `.trim();

  mountEl.appendChild(section);
  return section;
}

function setSelectOptions(selectEl, options, placeholder = "— Select —") {
  if (!selectEl) return;
  selectEl.innerHTML = "";

  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = placeholder;
  selectEl.appendChild(ph);

  for (const optVal of options) {
    const v = normalize(optVal);
    if (!v) continue;
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    selectEl.appendChild(o);
  }
}

function setHtml(el, html) {
  if (!el) return;
  const h = normalize(html);
  el.innerHTML = h ? h : "";
}

function renderFeat(panelEl, grantedFeat) {
  if (!panelEl) return;
  panelEl.innerHTML = "";

  if (!grantedFeat) {
    panelEl.textContent = "No granted feat";
    return;
  }

  // string feat name
  if (typeof grantedFeat === "string") {
    const name = normalize(grantedFeat);
    panelEl.innerHTML = `<div class="hv-feat-name"></div><div class="hv-feat-desc">No description yet.</div>`;
    panelEl.querySelector(".hv-feat-name").textContent = name || "Feat";
    return;
  }

  // object feat
  const name = normalize(grantedFeat?.name) || "Feat";
  const descHtml = grantedFeat?.descriptionHtml;
  const desc = grantedFeat?.description;

  const nameEl = document.createElement("div");
  nameEl.className = "hv-feat-name";
  nameEl.textContent = name;

  const descEl = document.createElement("div");
  descEl.className = "hv-feat-desc content-block";
  if (normalize(descHtml)) descEl.innerHTML = String(descHtml);
  else descEl.textContent = normalize(desc) || "No description yet.";

  panelEl.append(nameEl, descEl);
}

function renderAbilities(panelEl, abilityChoices) {
  if (!panelEl) return;
  panelEl.innerHTML = "";

  if (!abilityChoices) {
    panelEl.textContent = "3 choices";
    return;
  }

  if (typeof abilityChoices === "string") {
    panelEl.textContent = abilityChoices;
    return;
  }

  const pre = document.createElement("pre");
  pre.className = "hv-pre";
  pre.textContent = JSON.stringify(abilityChoices, null, 2);
  panelEl.appendChild(pre);
}

function wireAccordion(rootEl) {
  const buttons = Array.from(rootEl.querySelectorAll(".hv-acc-btn"));
  const panels = buttons
    .map((b) => rootEl.querySelector(`#${CSS.escape(b.dataset.target || "")}`))
    .filter(Boolean);

  function closeAll(exceptId = null) {
    for (const btn of buttons) {
      const target = btn.dataset.target || "";
      const panel = rootEl.querySelector(`#${CSS.escape(target)}`);
      const isOpen = exceptId && target === exceptId;
      btn.classList.toggle("is-open", Boolean(isOpen));
      if (panel) panel.style.display = isOpen ? "block" : "none";
    }
  }

  // default: all closed
  closeAll(null);

  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target || "";
      const isOpen = btn.classList.contains("is-open");
      closeAll(isOpen ? null : target);
    });
  }
}

function getBackgroundFields(bg) {
  const data = bg?.data || {};
  const description =
    data.descriptionHtml ||
    data.description ||
    data.info?.descriptionHtml ||
    data.info?.description ||
    "";

  const skillsOptions = data.skillsOptions || data.proficiencies?.skills || null;
  const toolsOptions = data.toolsOptions || data.proficiencies?.tools || null;

  const grantedFeat = data.grantedFeat || data.feat || null;
  const abilityChoices = data.abilityChoices || data.abilities || null;

  return { description, skillsOptions, toolsOptions, grantedFeat, abilityChoices };
}

export async function initBackgroundPanel({ mountEl }) {
  // hard gate (prompt requirement)
  const ok = await window.ensureAuthOrPrompt?.();
  if (!ok) return;

  const rootEl = ensureSkeleton(mountEl);
  if (!rootEl) return;

  const bgSelect = rootEl.querySelector("#hvBackgroundSelect");
  const descEl = rootEl.querySelector("#hvBackgroundDescription");
  const skillSelect = rootEl.querySelector("#hvBgSkillSelect");
  const toolSelect = rootEl.querySelector("#hvBgToolSelect");
  const featPanel = rootEl.querySelector("#hvBgFeat");
  const abilitiesPanel = rootEl.querySelector("#hvBgAbilities");

  wireAccordion(rootEl);

  const { data: rows, error } = await window.supabase
    .from("homebrew")
    .select("id, name, data, updated_at")
    .eq("type", "background")
    .order("name", { ascending: true });

  if (error) throw error;
  const backgrounds = Array.isArray(rows) ? rows : [];

  // Background dropdown
  bgSelect.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "— Select Background —";
  bgSelect.appendChild(ph);

  for (const bg of backgrounds) {
    const opt = document.createElement("option");
    opt.value = String(bg.id);
    opt.textContent = bg.name || "Unnamed Background";
    bgSelect.appendChild(opt);
  }

  function findSelected() {
    const id = normalize(bgSelect.value);
    return backgrounds.find((b) => String(b.id) === id) || null;
  }

  function renderBackgroundDetails(bg) {
    if (!bg) {
      setHtml(descEl, "");
      setSelectOptions(skillSelect, FALLBACK_SKILLS);
      setSelectOptions(toolSelect, FALLBACK_TOOLS);
      renderFeat(featPanel, null);
      renderAbilities(abilitiesPanel, null);
      return;
    }

    const { description, skillsOptions, toolsOptions, grantedFeat, abilityChoices } = getBackgroundFields(bg);
    setHtml(descEl, description);

    const skills = Array.isArray(skillsOptions) && skillsOptions.length ? skillsOptions : FALLBACK_SKILLS;
    const tools = Array.isArray(toolsOptions) && toolsOptions.length ? toolsOptions : FALLBACK_TOOLS;
    setSelectOptions(skillSelect, skills);
    setSelectOptions(toolSelect, tools);

    renderFeat(featPanel, grantedFeat);
    renderAbilities(abilitiesPanel, abilityChoices);
  }

  // Restore draft
  const draft = loadDraft();
  const preferredId = normalize(draft.backgroundId);
  if (preferredId) {
    bgSelect.value = preferredId;
  }

  // Initial render
  renderBackgroundDetails(findSelected());

  // Restore skill/tool selections (after options filled)
  const initialBg = findSelected();
  if (initialBg) {
    const d2 = loadDraft();
    if (normalize(d2.backgroundSkill)) skillSelect.value = normalize(d2.backgroundSkill);
    if (normalize(d2.backgroundTool)) toolSelect.value = normalize(d2.backgroundTool);
  }

  // Persist changes
  bgSelect.addEventListener("change", () => {
    const bg = findSelected();
    renderBackgroundDetails(bg);

    // reset picks when switching bg (DDB-like)
    skillSelect.value = "";
    toolSelect.value = "";

    saveDraft({
      backgroundId: bg ? String(bg.id) : "",
      backgroundName: bg?.name || "",
      backgroundSkill: "",
      backgroundTool: "",
    });
  });

  skillSelect.addEventListener("change", () => {
    const bg = findSelected();
    saveDraft({
      backgroundId: bg ? String(bg.id) : normalize(loadDraft().backgroundId),
      backgroundName: bg?.name || normalize(loadDraft().backgroundName),
      backgroundSkill: normalize(skillSelect.value),
    });
  });

  toolSelect.addEventListener("change", () => {
    const bg = findSelected();
    saveDraft({
      backgroundId: bg ? String(bg.id) : normalize(loadDraft().backgroundId),
      backgroundName: bg?.name || normalize(loadDraft().backgroundName),
      backgroundTool: normalize(toolSelect.value),
    });
  });
}


