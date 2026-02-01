// Save/Update logic for create-pet.html (Supabase)
// Requires: window.supabase (Supabase v2), tinymce (optional), window.AuthModalInstance (optional)

const STORAGE_BUCKET = "homebrew-images";
const LOCAL_STORAGE_KEY = "hv_current_pet_id";

let currentPetId = null;
let existingRecordData = null; // preserve image fields on update if no new upload

function $(id) {
  return document.getElementById(id);
}

export async function getSessionOrPrompt() {
  const supabase = window.supabase;
  if (!supabase) return null;

  const { data: { session } = { session: null } } = await supabase.auth.getSession();
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

export function toNumberOrNull(value) {
  const n = parseFloat(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function toStringOrEmpty(value) {
  return (value == null) ? "" : String(value).trim();
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

export function collectPetData() {
  const mythicEnabled = Boolean($("mythic-checkbox")?.checked);
  const legendaryEnabled = Boolean($("legendary-checkbox")?.checked);

  const data = {
    info: {
      type: toStringOrEmpty($("pet-type")?.value),
      subType: toStringOrEmpty($("pet-sub-type")?.value),
      size: toStringOrEmpty($("pet-size")?.value),
      alignment: toStringOrEmpty($("pet-alignment")?.value),
    },
    stats: {
      abilities: {
        str: toNumberOrNull($("pet-str")?.value),
        dex: toNumberOrNull($("pet-dex")?.value),
        con: toNumberOrNull($("pet-con")?.value),
        int: toNumberOrNull($("pet-int")?.value),
        wis: toNumberOrNull($("pet-wis")?.value),
        cha: toNumberOrNull($("pet-cha")?.value),
      },
      armor: toNumberOrNull($("pet-armor")?.value),
      initiativeBonus: toNumberOrNull($("pet-initiative-bonus")?.value),
      passivePerception: toNumberOrNull($("pet-passive-perception")?.value),
      hp: {
        avg: toNumberOrNull($("pet-average-hp")?.value),
        modifier: toNumberOrNull($("pet-hp-modifier")?.value),
      },
      savingThrow: toStringOrEmpty($("pet-saving-throw")?.value),
      resistance: toStringOrEmpty($("pet-resistances")?.value),
      immunities: toStringOrEmpty($("pet-immunities")?.value),
      vulnerabilities: toStringOrEmpty($("pet-vulnerabilities")?.value),
      conditionImmunities: toStringOrEmpty($("pet-condition-immunities")?.value),
    },
    blocks: {
      traits: getTiny("traits"),
      actions: getTiny("actions"),
      bonusActions: getTiny("bonus-actions"),
      reactions: getTiny("reactions"),
      mythicActions: mythicEnabled ? getTiny("mythic-actions") : "",
      legendaryActions: legendaryEnabled ? getTiny("legendary-actions") : "",
    },
    flags: { mythicEnabled, legendaryEnabled },
    image_path: existingRecordData?.image_path || null,
    image_url: existingRecordData?.image_url || null,
  };

  return data;
}

async function loadExistingPet(id, userId) {
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

async function uploadPetImage({ userId, homebrewId, file }) {
  const safeName = String(file.name || "image").replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/pets/${homebrewId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await window.supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: publicData } = window.supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return { image_path: path, image_url: publicData?.publicUrl || null };
}

function setButtonSaving(btn, isSaving, originalText) {
  if (!btn) return;
  btn.disabled = Boolean(isSaving);
  btn.textContent = isSaving ? "Saving..." : originalText;
}

function applyExistingPetData(record) {
  if (!record) return;
  const data = record.data || {};
  const info = data.info || {};
  const stats = data.stats || {};
  const abilities = stats.abilities || {};
  const blocks = data.blocks || {};
  const flags = data.flags || {};

  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
  };

  setValue("pet-name", String(record.name || ""));
  setValue("pet-type", info.type ?? "");
  setValue("pet-sub-type", info.subType ?? "");
  setValue("pet-size", info.size ?? "");
  setValue("pet-alignment", info.alignment ?? "");

  setValue("pet-str", abilities.str ?? "");
  setValue("pet-dex", abilities.dex ?? "");
  setValue("pet-con", abilities.con ?? "");
  setValue("pet-int", abilities.int ?? "");
  setValue("pet-wis", abilities.wis ?? "");
  setValue("pet-cha", abilities.cha ?? "");

  setValue("pet-armor", stats.armor ?? "");
  setValue("pet-initiative-bonus", stats.initiativeBonus ?? "");
  setValue("pet-passive-perception", stats.passivePerception ?? "");
  setValue("pet-average-hp", stats.hp?.avg ?? "");
  setValue("pet-hp-modifier", stats.hp?.modifier ?? "");
  setValue("pet-saving-throw", stats.savingThrow ?? "");
  setValue("pet-resistances", stats.resistance ?? "");
  setValue("pet-immunities", stats.immunities ?? "");
  setValue("pet-vulnerabilities", stats.vulnerabilities ?? "");
  setValue("pet-condition-immunities", stats.conditionImmunities ?? "");

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

  setTinyHtml("traits", blocks.traits || "");
  setTinyHtml("actions", blocks.actions || "");
  setTinyHtml("bonus-actions", blocks.bonusActions || "");
  setTinyHtml("reactions", blocks.reactions || "");
  setTinyHtml("mythic-actions", blocks.mythicActions || "");
  setTinyHtml("legendary-actions", blocks.legendaryActions || "");
}

async function hydrateFormForEdit() {
  if (!currentPetId) return;
  const session = await getSessionOrPrompt();
  if (!session) return;
  const record = await loadExistingPet(currentPetId, session.user.id);
  if (!record) return;
  existingRecordData = record.data || null;
  applyExistingPetData(record);
}

async function handleSaveClick() {
  const button = document.querySelector(".button-create.create-button");
  const defaultText = currentPetId ? "Update" : "Create";
  setButtonSaving(button, true, defaultText);

  try {
    const session = await getSessionOrPrompt();
    if (!session) return;

    const name = toStringOrEmpty($("pet-name")?.value);
    if (!name) {
      console.info("Name is required.");
      return;
    }

    // Preserve existing image data on update if no new image uploaded
    if (currentPetId && !existingRecordData) {
      const existing = await loadExistingPet(currentPetId, session.user.id);
      existingRecordData = existing?.data || null;
    }

    let petData = collectPetData();

    const fileInput = $("pet-image");
    const file = fileInput?.files?.[0] || null;

    if (!currentPetId) {
      // INSERT
      const { data: inserted, error } = await window.supabase
        .from("homebrew")
        .insert({
          user_id: session.user.id,
          type: "pet",
          status: "draft",
          name,
          data: petData,
        })
        .select()
        .single();

      if (error) throw error;

      currentPetId = inserted.id;
      localStorage.setItem(LOCAL_STORAGE_KEY, String(currentPetId));

      if (file) {
        const img = await uploadPetImage({
          userId: session.user.id,
          homebrewId: currentPetId,
          file,
        });
        petData = { ...petData, ...img };
        existingRecordData = petData;

        const { error: upErr } = await window.supabase
          .from("homebrew")
          .update({ name, data: petData })
          .eq("id", currentPetId)
          .eq("user_id", session.user.id);

        if (upErr) throw upErr;
      }

      if (button) button.textContent = "Update";
      console.info("Pet saved");
      window.location.href = "../create.html";
      return;
    }

    // UPDATE
    if (file) {
      const img = await uploadPetImage({
        userId: session.user.id,
        homebrewId: currentPetId,
        file,
      });
      petData = { ...petData, ...img };
      existingRecordData = petData;
    }

    const { error: updErr } = await window.supabase
      .from("homebrew")
      .update({ name, data: petData })
      .eq("id", currentPetId)
      .eq("user_id", session.user.id);

    if (updErr) throw updErr;

    console.info("Pet saved");
  } catch (err) {
    console.error("Save failed:", err);
    console.info(`Save failed: ${err?.message || "Unknown error"}`);
  } finally {
    const button = document.querySelector(".button-create.create-button");
    const text = currentPetId ? "Update" : "Create";
    setButtonSaving(button, false, text);
  }
}

function init() {
  // Prefer URL id for edit mode. If no ?id= provided, treat as NEW and clear stored id.
  try {
    const urlId = new URLSearchParams(window.location.search || "").get("id");
    if (urlId) {
      currentPetId = /^\d+$/.test(urlId) ? Number(urlId) : urlId;
      localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
    } else {
      currentPetId = null;
      existingRecordData = null;
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (_e) {
    // ignore
  }

  const button = document.querySelector(".button-create.create-button");
  if (!button) return;

  button.textContent = currentPetId ? "Update" : "Create";

  button.addEventListener("click", (e) => {
    e.preventDefault();
    handleSaveClick();
  });

  hydrateFormForEdit();
}

document.addEventListener("DOMContentLoaded", init);




