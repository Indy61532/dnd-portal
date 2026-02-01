// Save/Update logic for create-monster.html (Supabase)
// Requires: window.supabase (Supabase v2), tinymce (optional), window.AuthModalInstance (optional)

const STORAGE_BUCKET = "homebrew-images";
const LOCAL_STORAGE_KEY = "hv_current_monster_id";

let currentHomebrewId = null;
let existingRecordData = null; // used to preserve image fields on update if no new upload

function $(id) {
  return document.getElementById(id);
}

function toNumberOrNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toStringOrEmpty(value) {
  return (value == null) ? "" : String(value).trim();
}

export async function getSessionOrPrompt() {
  const supabase = window.supabase;
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  const session = data?.session || null;
  if (!session) {
    window.AuthModalInstance?.show?.();
    return null;
  }
  return session;
}

export function getTiny(id) {
  try {
    const fromTiny = window.tinymce?.get(id)?.getContent();
    if (typeof fromTiny === "string") return fromTiny;
    const el = document.getElementById(id);
    return el ? (el.value || "") : "";
  } catch (_e) {
    const el = document.getElementById(id);
    return el ? (el.value || "") : "";
  }
}

export function collectMonsterData() {
  const mythicEnabled = Boolean($("mythic-checkbox")?.checked);
  const legendaryEnabled = Boolean($("legendary-checkbox")?.checked);
  const lairEnabled = Boolean($("lair-checkbox")?.checked);

  const data = {
    info: {
      name: toStringOrEmpty($("monster-name")?.value),
      type: toStringOrEmpty($("monster-type")?.value),
      subType: toStringOrEmpty($("monster-sub-type")?.value),
      habit: toStringOrEmpty($("monster-habit")?.value),
      size: toStringOrEmpty($("monster-size")?.value),
      alignment: toStringOrEmpty($("monster-alignment")?.value),
      rating: toStringOrEmpty($("monster-rating")?.value),
    },
    stats: {
      str: toNumberOrNull($("monster-str")?.value),
      dex: toNumberOrNull($("monster-dex")?.value),
      con: toNumberOrNull($("monster-con")?.value),
      int: toNumberOrNull($("monster-int")?.value),
      wis: toNumberOrNull($("monster-wis")?.value),
      cha: toNumberOrNull($("monster-cha")?.value),
    },
    combat: {
      armor: toNumberOrNull($("monster-armor")?.value),
      armorType: toStringOrEmpty($("monster-armor-type")?.value),
      initiativeBonus: toNumberOrNull($("monster-initiative-bonus")?.value),
      passivePerception: toNumberOrNull($("monster-passive-perception")?.value),
      hp: {
        average: toNumberOrNull($("monster-average-hp")?.value),
        dieCount: toNumberOrNull($("monster-die-count-hp")?.value),
        dieType: toStringOrEmpty($("monster-die-type")?.value),
        modifier: toNumberOrNull($("monster-hp-modifier")?.value),
      },
    },
    defenses: {
      savingThrow: toStringOrEmpty($("monster-saving-throw")?.value),
      resistances: toStringOrEmpty($("monster-resistances")?.value),
      immunities: toStringOrEmpty($("monster-immunities")?.value),
      vulnerabilities: toStringOrEmpty($("monster-vulnerabilities")?.value),
      conditionImmunities: toStringOrEmpty($("monster-condition-immunities")?.value),
    },
    blocks: {
      traits: getTiny("traits"),
      actions: getTiny("actions"),
      bonusActions: getTiny("bonus-actions"),
      reactions: getTiny("reactions"),
      characteristics: getTiny("characteristics"),
      mythicActions: mythicEnabled ? getTiny("mythic-actions") : "",
      legendaryActions: legendaryEnabled ? getTiny("legendary-actions") : "",
      lair: lairEnabled ? getTiny("lair") : "",
      lairActions: lairEnabled ? getTiny("lair-actions") : "",
    },
    flags: {
      mythicEnabled,
      legendaryEnabled,
      lairEnabled,
    },
    image_path: existingRecordData?.image_path || null,
    image_url: existingRecordData?.image_url || null,
  };

  return data;
}

async function loadExistingHomebrew(id, userId) {
  try {
    const { data, error } = await window.supabase
      .from("homebrew")
      .select("id, user_id, name, data")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) return null;
    return data || null;
  } catch (_e) {
    return null;
  }
}

async function uploadMonsterImage({ userId, homebrewId, file }) {
  const safeName = String(file.name || "image").replace(/[^\w.\-]+/g, "_");
  // Spec: userId/monsters/homebrewId/filename
  const path = `${userId}/monsters/${homebrewId}/${safeName}`;

  const { error: uploadError } = await window.supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: publicData } = window.supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  const publicUrl = publicData?.publicUrl || null;

  return { image_path: path, image_url: publicUrl };
}

function setButtonSaving(btn, isSaving, originalText) {
  if (!btn) return;
  btn.disabled = Boolean(isSaving);
  btn.textContent = isSaving ? "Saving..." : originalText;
}

function setTinyHtml(id, html) {
  const safeHtml = typeof html === "string" ? html : "";
  try {
    const editor = window.tinymce?.get(id);
    if (editor) {
      editor.setContent(safeHtml);
      return;
    }
  } catch (_e) {
    // ignore
  }
  const el = document.getElementById(id);
  if (el) el.value = safeHtml;
}

function applyExistingMonsterData(record) {
  if (!record) return;
  const data = record.data || {};
  const info = data.info || {};
  const stats = data.stats || {};
  const combat = data.combat || {};
  const defenses = data.defenses || {};
  const blocks = data.blocks || {};
  const flags = data.flags || {};

  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
  };

  setValue("monster-name", String(record.name || info.name || ""));
  setValue("monster-type", info.type ?? "");
  setValue("monster-sub-type", info.subType ?? "");
  setValue("monster-habit", info.habit ?? "");
  setValue("monster-size", info.size ?? "");
  setValue("monster-alignment", info.alignment ?? "");
  setValue("monster-rating", info.rating ?? "");

  setValue("monster-str", stats.str ?? "");
  setValue("monster-dex", stats.dex ?? "");
  setValue("monster-con", stats.con ?? "");
  setValue("monster-int", stats.int ?? "");
  setValue("monster-wis", stats.wis ?? "");
  setValue("monster-cha", stats.cha ?? "");

  setValue("monster-armor", combat.armor ?? "");
  setValue("monster-armor-type", combat.armorType ?? "");
  setValue("monster-initiative-bonus", combat.initiativeBonus ?? "");
  setValue("monster-passive-perception", combat.passivePerception ?? "");
  setValue("monster-average-hp", combat.hp?.average ?? "");
  setValue("monster-die-count-hp", combat.hp?.dieCount ?? "");
  setValue("monster-die-type", combat.hp?.dieType ?? "");
  setValue("monster-hp-modifier", combat.hp?.modifier ?? "");

  setValue("monster-saving-throw", defenses.savingThrow ?? "");
  setValue("monster-resistances", defenses.resistances ?? "");
  setValue("monster-immunities", defenses.immunities ?? "");
  setValue("monster-vulnerabilities", defenses.vulnerabilities ?? "");
  setValue("monster-condition-immunities", defenses.conditionImmunities ?? "");

  const mythicCheckbox = document.getElementById("mythic-checkbox");
  if (mythicCheckbox) {
    mythicCheckbox.checked = Boolean(flags.mythicEnabled);
    mythicCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const legendaryCheckbox = document.getElementById("legendary-checkbox");
  if (legendaryCheckbox) {
    legendaryCheckbox.checked = Boolean(flags.legendaryEnabled);
    legendaryCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const lairCheckbox = document.getElementById("lair-checkbox");
  if (lairCheckbox) {
    lairCheckbox.checked = Boolean(flags.lairEnabled);
    lairCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
  }

  setTinyHtml("traits", blocks.traits || "");
  setTinyHtml("actions", blocks.actions || "");
  setTinyHtml("bonus-actions", blocks.bonusActions || "");
  setTinyHtml("reactions", blocks.reactions || "");
  setTinyHtml("characteristics", blocks.characteristics || "");
  setTinyHtml("mythic-actions", blocks.mythicActions || "");
  setTinyHtml("legendary-actions", blocks.legendaryActions || "");
  setTinyHtml("lair", blocks.lair || "");
  setTinyHtml("lair-actions", blocks.lairActions || "");
}

async function hydrateFormForEdit() {
  if (!currentHomebrewId) return;
  const session = await getSessionOrPrompt();
  if (!session) return;
  const record = await loadExistingHomebrew(currentHomebrewId, session.user.id);
  if (!record) return;
  existingRecordData = record.data || null;
  applyExistingMonsterData(record);
}

async function handleSaveClick() {
  const button = document.querySelector(".button-create.create-button");
  const defaultText = currentHomebrewId ? "Update" : "Create";
  setButtonSaving(button, true, defaultText);

  try {
    const session = await getSessionOrPrompt();
    if (!session) return;

    const name = toStringOrEmpty($("monster-name")?.value);
    if (!name) {
      console.info("Name is required.");
      return;
    }

    // Load existing record once before update to preserve image fields
    if (currentHomebrewId && !existingRecordData) {
      const existing = await loadExistingHomebrew(currentHomebrewId, session.user.id);
      existingRecordData = existing?.data || null;
    }

    let monsterData = collectMonsterData();

    const fileInput = $("monster-image");
    const file = fileInput?.files?.[0] || null;

    if (!currentHomebrewId) {
      // INSERT
      const { data: inserted, error } = await window.supabase
        .from("homebrew")
        .insert({
          user_id: session.user.id,
          type: "monster",
          status: "draft",
          name,
          data: monsterData,
        })
        .select()
        .single();

      if (error) throw error;

      currentHomebrewId = inserted.id;
      localStorage.setItem(LOCAL_STORAGE_KEY, String(currentHomebrewId));

      // Upload image after insert (needs id)
      if (file) {
        const img = await uploadMonsterImage({
          userId: session.user.id,
          homebrewId: currentHomebrewId,
          file,
        });

        monsterData = { ...monsterData, ...img };

        const { error: upErr } = await window.supabase
          .from("homebrew")
          .update({ data: monsterData })
          .eq("id", currentHomebrewId)
          .eq("user_id", session.user.id);

        if (upErr) throw upErr;
        existingRecordData = monsterData;
      }

      // Switch button to Update
      if (button) button.textContent = "Update";
      console.info("Saved!");
      // After create, return to create.html listing
      window.location.href = "../create.html";
      return;
    }

    // UPDATE
    if (file) {
      const img = await uploadMonsterImage({
        userId: session.user.id,
        homebrewId: currentHomebrewId,
        file,
      });
      monsterData = { ...monsterData, ...img };
      existingRecordData = monsterData;
    }

    const { error: updErr } = await window.supabase
      .from("homebrew")
      .update({ name, data: monsterData, updated_at: new Date().toISOString() })
      .eq("id", currentHomebrewId)
      .eq("user_id", session.user.id);

    if (updErr) throw updErr;

    console.info("Updated!");
  } catch (err) {
    console.error("Save failed:", err);
    console.info(`Save failed: ${err?.message || "Unknown error"}`);
  } finally {
    const button = document.querySelector(".button-create.create-button");
    const text = currentHomebrewId ? "Update" : "Create";
    setButtonSaving(button, false, text);
  }
}

async function init() {
  // Prefer URL id for edit mode. If no ?id= provided, treat as NEW and clear stored id.
  try {
    const urlId = new URLSearchParams(window.location.search || "").get("id");
    if (urlId) {
      currentHomebrewId = /^\d+$/.test(urlId) ? Number(urlId) : urlId;
      localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
    } else {
      currentHomebrewId = null;
      existingRecordData = null;
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (_e) {
    // ignore
  }

  const button = document.querySelector(".button-create.create-button");
  if (!button) return;

  button.textContent = currentHomebrewId ? "Update" : "Create";

  button.addEventListener("click", (e) => {
    e.preventDefault();
    handleSaveClick();
  });

  hydrateFormForEdit();
}

document.addEventListener("DOMContentLoaded", init);



