// Save/Update logic for create-rase.html (Supabase)
// Classic script (not module). Uses window.supabase + optional window.AuthModalInstance + tinymce.

(function () {
  const STORAGE_BUCKET = "homebrew-images";
  const LOCAL_STORAGE_KEY = "hv_current_race_id";

  let currentRaceId = localStorage.getItem(LOCAL_STORAGE_KEY);
  let existingRecordData = null; // preserve image if updating without new upload

  function $(id) {
    return document.getElementById(id);
  }

  function toStringOrEmpty(value) {
    return value == null ? "" : String(value).trim();
  }

  // Optional helper if you later want numeric speed (currently speed kept as string by spec)
  function toIntOrNull(value) {
    const n = parseInt(String(value ?? "").trim(), 10);
    return Number.isFinite(n) ? n : null;
  }

  async function getSessionOrPrompt() {
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

  function getTinyHtml(id) {
    try {
      const fromTiny = window.tinymce?.get?.(id)?.getContent();
      if (typeof fromTiny === "string") return fromTiny;
    } catch (_e) {
      // ignore
    }
    const el = $(id);
    return el ? (el.value || "") : "";
  }

  function extractSelectedTags(selectedTagsEl) {
    if (!selectedTagsEl) return [];

    const selectors = [".tag", ".selected-tag", ".tag-item", ".chip", ".selected"];
    for (const sel of selectors) {
      const nodes = Array.from(selectedTagsEl.querySelectorAll(sel));
      if (nodes.length) {
        const values = nodes
          .map((n) => (n.textContent || "").trim())
          .filter(Boolean);
        if (values.length) return Array.from(new Set(values));
      }
    }

    // fallback: any button/span/div children text
    const values = Array.from(selectedTagsEl.querySelectorAll("button, span, div"))
      .map((n) => (n.textContent || "").trim())
      .filter(Boolean);

    return Array.from(new Set(values));
  }

  function collectRaceData() {
    const name = toStringOrEmpty($("race-name")?.value);
    const descriptionHtml = getTinyHtml("race-description");
    const vision = toStringOrEmpty($("race-vision")?.value);
    const type = toStringOrEmpty($("race-type")?.value);
    const speed = toStringOrEmpty($("race-speed")?.value); // keep as string
    const language = toStringOrEmpty($("race-language")?.value);
    const size = toStringOrEmpty($("race-size")?.value);
    const traitsHtml = getTinyHtml("race-traits");

    const selectedTagsEl = document.querySelector(".multiselect-container .selected-tags");
    const resistances = extractSelectedTags(selectedTagsEl);

    return {
      info: {
        name,
        descriptionHtml,
        vision,
        type,
        speed,
        language,
        size,
      },
      traitsHtml,
      resistances,
      image: {
        path: existingRecordData?.image?.path || null,
        publicUrl: existingRecordData?.image?.publicUrl || null,
      },
    };
  }

  async function loadExistingRaceData(id, userId) {
    try {
      const { data, error } = await window.supabase
        .from("homebrew")
        .select("id, user_id, data")
        .eq("id", id)
        .eq("user_id", userId)
        .single();
      if (error) return null;
      return data?.data || null;
    } catch (_e) {
      return null;
    }
  }

  async function uploadRaceImage({ userId, homebrewId, file }) {
    // Spec path: race/<userId>/<homebrewId>/<timestamp>_<safeFileName>
    const safeName = String(file.name || "image").replace(/[^\w.\-]+/g, "_");
    const path = `race/${userId}/${homebrewId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await window.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicData } = window.supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return { path, publicUrl: publicData?.publicUrl || null };
  }

  function notifySuccess() {
    if (window.HeroVault?.showNotification) {
      window.HeroVault.showNotification("Race saved", "success");
      return;
    }
    alert("Race saved");
  }

  function getSaveBtn() {
    return document.querySelector(".input-img .button-create");
  }

  function setSaving(btn, isSaving) {
    if (!btn) return;
    btn.disabled = Boolean(isSaving);
    btn.textContent = isSaving ? "Saving..." : (currentRaceId ? "Update" : "Create");
  }

  async function handleSave() {
    const saveBtn = getSaveBtn();
    setSaving(saveBtn, true);

    try {
      const session = await getSessionOrPrompt();
      if (!session) return;

      const name = toStringOrEmpty($("race-name")?.value);
      if (!name) {
        alert("Race Name is required.");
        $("race-name")?.focus?.();
        return;
      }

      const fileInput = $("race-image");
      const file = fileInput?.files?.[0] || null;

      if (currentRaceId && !existingRecordData) {
        existingRecordData = await loadExistingRaceData(currentRaceId, session.user.id);
      }

      let raceData = collectRaceData();

      if (!currentRaceId) {
        // INSERT first (so we have homebrewId for storage path)
        const { data, error } = await window.supabase
          .from("homebrew")
          .insert({
            user_id: session.user.id,
            type: "race",
            status: "draft",
            name: raceData.info.name,
            data: raceData,
          })
          .select()
          .single();

        if (error) throw error;

        currentRaceId = data.id;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(currentRaceId));

        // upload image (optional) then UPDATE data.image
        if (file) {
          const img = await uploadRaceImage({
            userId: session.user.id,
            homebrewId: currentRaceId,
            file,
          });
          raceData = { ...raceData, image: img };
          existingRecordData = raceData;

          const { error: upErr } = await window.supabase
            .from("homebrew")
            .update({ name: raceData.info.name, data: raceData })
            .eq("id", currentRaceId)
            .eq("user_id", session.user.id);

          if (upErr) throw upErr;
        }

        if (saveBtn) saveBtn.textContent = "Update";
        if (fileInput) fileInput.value = "";
        notifySuccess();
        return;
      }

      // UPDATE
      if (!file) {
        // preserve existing image if no new upload
        const existing = existingRecordData || (await loadExistingRaceData(currentRaceId, session.user.id));
        if (existing?.image?.path || existing?.image?.publicUrl) {
          raceData.image = {
            path: existing.image.path || null,
            publicUrl: existing.image.publicUrl || null,
          };
        }
      } else {
        const img = await uploadRaceImage({
          userId: session.user.id,
          homebrewId: currentRaceId,
          file,
        });
        raceData = { ...raceData, image: img };
        existingRecordData = raceData;
      }

      const { error: updErr } = await window.supabase
        .from("homebrew")
        .update({ name: raceData.info.name, data: raceData })
        .eq("id", currentRaceId)
        .eq("user_id", session.user.id);

      if (updErr) throw updErr;

      if (fileInput) fileInput.value = "";
      notifySuccess();
    } catch (err) {
      console.error("Save failed:", err);
      alert(`Save failed: ${err?.message || "Unknown error"}`);
    } finally {
      const btn = getSaveBtn();
      setSaving(btn, false);
    }
  }

  function init() {
    const saveBtn = getSaveBtn();
    if (!saveBtn) return;
    saveBtn.textContent = currentRaceId ? "Update" : "Create";

    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSave();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();


