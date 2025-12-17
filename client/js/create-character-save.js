// client/js/create-character-save.js (ESM)
// Save Character Builder draft (localStorage.hv_character_draft) into Supabase table: characters

function notify(message, type = "success") {
  if (window.HeroVault?.showNotification) {
    window.HeroVault.showNotification(message, type);
    return;
  }
  alert(message);
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getDraft() {
  const raw = localStorage.getItem("hv_character_draft") || "{}";
  const parsed = safeJsonParse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
}

function toNumberOrDefault(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function getNameFromUIFallback() {
  // Optional: pull from Review step input if user didn't explicitly persist it yet
  const el = document.getElementById("char-name");
  const v = el ? String(el.value || "").trim() : "";
  return v || "";
}

async function getUserIdOrNull() {
  const { data } = await window.supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

function normalizeId(v) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function buildPayload(draft, userId) {
  // Prompt-required keys (with fallbacks to our current draft naming)
  const name = String(draft.name || getNameFromUIFallback() || "").trim();
  const level = toNumberOrDefault(draft.level ?? draft.characterLevel, 1);

  const inventory =
    Array.isArray(draft.inventory) ? draft.inventory :
    Array.isArray(draft.equipmentItems) ? draft.equipmentItems :
    [];

  const stats =
    (draft.stats && typeof draft.stats === "object") ? draft.stats :
    (draft.abilityFinalScores && typeof draft.abilityFinalScores === "object") ? draft.abilityFinalScores :
    {};

  const spells = (draft.spells && typeof draft.spells === "object") ? draft.spells : {};

  const notes = draft.notes != null ? String(draft.notes) : null;

  return {
    user_id: userId,
    name,
    level: Number(level || 1),
    class_id: normalizeId(draft.classId),
    subclass_id: normalizeId(draft.subclassId),
    race_id: normalizeId(draft.raceId),
    background_id: normalizeId(draft.backgroundId),
    faith_id: normalizeId(draft.faithId),
    stats,
    spells,
    inventory,
    notes,
  };
}

export async function saveCharacter() {
  const ok = await window.ensureAuthOrPrompt?.();
  if (!ok) return;

  const userId = await getUserIdOrNull();
  if (!userId) return;

  const draft = getDraft();
  console.log("Saving character draft:", draft);

  const payload = buildPayload(draft, userId);
  if (!payload.name) {
    notify("Name is required", "error");
    document.getElementById("char-name")?.focus?.();
    return;
  }

  const { data, error } = await window.supabase
    .from("characters")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error(error);
    notify("Save failed", "error");
    return;
  }

  const id = data?.id;
  if (id != null) {
    localStorage.setItem("hv_current_character_id", String(id));
  }

  notify("Character created", "success");

  // Redirect to character sheet (existing page is `charakter-sheet.html`)
  window.location.href = `../charakter-sheet.html?id=${encodeURIComponent(String(id))}`;
}

function isCreateAction(btnEl) {
  const t = String(btnEl?.textContent || "").trim().toLowerCase();
  return t.includes("create character");
}

function setSaving(btnEl, isSaving) {
  if (!btnEl) return;
  if (isSaving) {
    btnEl.disabled = true;
    btnEl.dataset.hvOldText = btnEl.textContent || "";
    btnEl.textContent = "Saving...";
  } else {
    btnEl.disabled = false;
    if (btnEl.dataset.hvOldText) btnEl.textContent = btnEl.dataset.hvOldText;
  }
}

export function wireCreateCharacterButton() {
  const btn = document.querySelector(".wizard-navigation .next-btn");
  if (!btn) return;

  // Capture-phase intercept to stop the placeholder click handler from firing.
  btn.addEventListener(
    "click",
    async (e) => {
      if (!isCreateAction(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

      try {
        setSaving(btn, true);
        await saveCharacter();
      } catch (err) {
        console.error(err);
        notify("Save failed", "error");
      } finally {
        setSaving(btn, false);
      }
    },
    true
  );
}

document.addEventListener("DOMContentLoaded", () => {
  wireCreateCharacterButton();
});


