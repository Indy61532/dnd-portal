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

async function handleSaveClick() {
  const button = document.querySelector(".button-create.create-button");
  const defaultText = currentHomebrewId ? "Update" : "Create";
  setButtonSaving(button, true, defaultText);

  try {
    const session = await getSessionOrPrompt();
    if (!session) return;

    const name = toStringOrEmpty($("monster-name")?.value);
    if (!name) {
      alert("Name is required.");
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
      alert("Saved!");
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

    alert("Updated!");
  } catch (err) {
    console.error("Save failed:", err);
    alert(`Save failed: ${err?.message || "Unknown error"}`);
  } finally {
    const button = document.querySelector(".button-create.create-button");
    const text = currentHomebrewId ? "Update" : "Create";
    setButtonSaving(button, false, text);
  }
}

async function init() {
  const savedId = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedId) {
    currentHomebrewId = /^\d+$/.test(savedId) ? Number(savedId) : savedId;
    const button = document.querySelector(".button-create.create-button");
    if (button) button.textContent = "Update";
  }

  const button = document.querySelector(".button-create.create-button");
  if (!button) return;

  button.addEventListener("click", (e) => {
    e.preventDefault();
    handleSaveClick();
  });
}

document.addEventListener("DOMContentLoaded", init);


