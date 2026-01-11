// Save/Update logic for create-class.html (Supabase)
// Classic script (not module). Uses window.supabase + optional window.AuthModalInstance + tinymce.

(function () {
  const STORAGE_BUCKET = "homebrew-images";
  const LOCAL_STORAGE_KEY = "hv_current_class_id";

  let currentClassId = localStorage.getItem(LOCAL_STORAGE_KEY);
  let existingRecordData = null; // preserve image fields on update if no new upload

  function $(id) {
    return document.getElementById(id);
  }

  function toIntOrNull(value) {
    const n = parseInt(String(value ?? "").trim(), 10);
    return Number.isFinite(n) ? n : null;
  }

  function toStringOrEmpty(value) {
    return value == null ? "" : String(value).trim();
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
      const fromTiny = window.tinymce?.get(id)?.getContent();
      if (typeof fromTiny === "string") return fromTiny;
    } catch (_e) {
      // ignore
    }
    const el = document.getElementById(id);
    return el ? (el.value || "") : "";
  }

  function getSelectedCasterType() {
    if ($("none-caster-checkbox")?.checked) return "none";
    if ($("pact-caster-checkbox")?.checked) return "pact";
    if ($("full-caster-checkbox")?.checked) return "full";
    if ($("third-caster-checkbox")?.checked) return "third";
    if ($("half-caster-checkbox")?.checked) return "half";
    // fallback
    return "none";
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

    // fallback: any button/span/div children
    const values = Array.from(selectedTagsEl.querySelectorAll("button, span, div"))
      .map((n) => (n.textContent || "").trim())
      .filter(Boolean);

    return Array.from(new Set(values));
  }

  function collectLevelProgression() {
    const table = document.querySelector(".table-1");
    if (!table) return [];

    const levels = [];
    for (let level = 1; level <= 20; level++) {
      const row = table.querySelector(`.level-${level}`);
      if (!row) continue;

      // Proficiency Bonus input je vždy 2. buňka v row (div:nth-child(2)) -> input.num-input
      // (bulletproof i když se později do řádku přidají další num-inputy)
      const profInput = row.querySelector(":scope > div:nth-child(2) input.num-input");
      const profBonus = profInput ? toIntOrNull(profInput.value) : null;

      const selectedTagsEl = row.querySelector(".selected-tags");
      const features = extractSelectedTags(selectedTagsEl);

      levels.push({ level, profBonus, features });
    }
    return levels;
  }

  function collectCasterTable(casterType) {
    if (!casterType || casterType === "none") return null;

    const sectionMap = {
      third: ".third-caster",
      half: ".half-caster",
      full: ".full-caster",
      pact: ".pact-caster",
    };

    const sectionSel = sectionMap[casterType];
    const section = sectionSel ? document.querySelector(sectionSel) : null;
    const table = section ? section.querySelector(".table-2") : null;
    if (!table) return null;

    const headerRow = table.querySelector(".row-1");
    const headerDivs = headerRow ? Array.from(headerRow.children) : [];
    const header = headerDivs
      .map((d) => (d.textContent || "").trim())
      .filter(Boolean)
      .slice(1); // ignore first ("Level")

    const rows = [];
    for (let level = 1; level <= 20; level++) {
      const row = table.querySelector(`.level-${level}`);
      if (!row) continue;
      const inputs = Array.from(row.querySelectorAll("input.num-input"));
      const values = inputs.map((inp) => toIntOrNull(inp.value));
      rows.push({ level, values });
    }

    return { casterType, header, rows };
  }

  function collectCustomFeatures() {
    const list = document.getElementById("features-list");
    if (!list) return [];

    const cards = Array.from(list.querySelectorAll(".feature-card"));
    if (!cards.length) return [];

    return cards.map((card) => {
      const name = (card.querySelector("h4")?.textContent || "").trim();
      const description = (card.querySelector("p")?.textContent || "").trim();
      return { name, description };
    }).filter((f) => f.name.length > 0 || f.description.length > 0);
  }

  function collectClassData() {
    const name = toStringOrEmpty($("class-name")?.value);
    const casterType = getSelectedCasterType();
    const descriptionHtml = getTinyHtml("class-description");

    const levels = collectLevelProgression();
    const casterTable = collectCasterTable(casterType);
    const customFeatures = collectCustomFeatures();

    return {
      info: {
        name,
        casterType,
        descriptionHtml,
      },
      progression: {
        levels,
        casterTable,
      },
      customFeatures,
      image_path: existingRecordData?.image_path || null,
      image_url: existingRecordData?.image_url || null,
    };
  }

  async function loadExistingClassData(id, userId) {
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

  async function uploadClassImage({ userId, homebrewId, file }) {
    const safeName = String(file.name || "image").replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/classes/${homebrewId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await window.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicData } = window.supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return { image_path: path, image_url: publicData?.publicUrl || null };
  }

  function notifySuccess(msg) {
    if (window.HeroVault?.showNotification) {
      window.HeroVault.showNotification(msg, "success");
      return;
    }
    alert(msg);
  }

  function setSaving(btn, isSaving) {
    if (!btn) return;
    btn.disabled = Boolean(isSaving);
    btn.textContent = isSaving ? "Saving..." : (currentClassId ? "Update" : "Create");
  }

  async function handleSave() {
    const saveBtn = document.querySelector(".input-img .button-create");
    setSaving(saveBtn, true);

    try {
      const session = await getSessionOrPrompt();
      if (!session) return;

      const className = toStringOrEmpty($("class-name")?.value);
      if (!className) {
        alert("Class Name is required.");
        return;
      }

      const fileInput = $("class-image");
      const file = fileInput?.files?.[0] || null;

      // If updating, load existing data once to preserve image if needed
      if (currentClassId && !existingRecordData) {
        existingRecordData = await loadExistingClassData(currentClassId, session.user.id);
      }

      let classData = collectClassData();

      if (!currentClassId) {
        // INSERT
        const { data, error } = await window.supabase
          .from("homebrew")
          .insert({
            user_id: session.user.id,
            type: "class",
            status: "draft",
            name: className,
            data: classData,
          })
          .select()
          .single();

        if (error) throw error;

        currentClassId = data.id;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(currentClassId));

        // upload image after insert
        if (file) {
          const img = await uploadClassImage({
            userId: session.user.id,
            homebrewId: currentClassId,
            file,
          });
          classData = { ...classData, ...img };
          existingRecordData = classData;

          const { error: upErr } = await window.supabase
            .from("homebrew")
            .update({ name: className, data: classData })
            .eq("id", currentClassId)
            .eq("user_id", session.user.id);

          if (upErr) throw upErr;
        }

        if (saveBtn) saveBtn.textContent = "Update";
        if (fileInput) fileInput.value = "";
        notifySuccess("Class saved");
        return;
      }

      // UPDATE
      // Preserve existing image if no new file chosen
      if (!file) {
        const existing = existingRecordData || (await loadExistingClassData(currentClassId, session.user.id));
        if (existing?.image_path || existing?.image_url) {
          classData.image_path = existing.image_path || null;
          classData.image_url = existing.image_url || null;
        }
      } else {
        const img = await uploadClassImage({
          userId: session.user.id,
          homebrewId: currentClassId,
          file,
        });
        classData = { ...classData, ...img };
        existingRecordData = classData;
      }

      const { error: updErr } = await window.supabase
        .from("homebrew")
        .update({ name: className, data: classData })
        .eq("id", currentClassId)
        .eq("user_id", session.user.id);

      if (updErr) throw updErr;

      if (fileInput) fileInput.value = "";
      notifySuccess("Class saved");
    } catch (err) {
      console.error("Save failed:", err);
      alert(`Save failed: ${err?.message || "Unknown error"}`);
    } finally {
      const saveBtn = document.querySelector(".input-img .button-create");
      setSaving(saveBtn, false);
    }
  }

  function init() {
    const saveBtn = document.querySelector(".input-img .button-create");
    if (!saveBtn) return;

    // Prefer URL id for edit mode. If no ?id= provided, treat as NEW and clear stored id.
    try {
      const urlId = new URLSearchParams(window.location.search || "").get("id");
      if (urlId) {
        currentClassId = urlId;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
      } else {
        currentClassId = null;
        existingRecordData = null;
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (_e) {
      // ignore
    }

    saveBtn.textContent = currentClassId ? "Update" : "Create";

    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSave();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();


