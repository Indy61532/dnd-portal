// Save/Update logic for create-subclass.html (Supabase)
// Classic script (not module). Uses window.supabase + optional window.AuthModalInstance + tinymce.

(function () {
  const STORAGE_BUCKET = "homebrew-images";
  const LOCAL_STORAGE_KEY = "hv_current_subclass_id";

  let currentSubClassId = localStorage.getItem(LOCAL_STORAGE_KEY);
  let existingRecordData = null; // preserve image if updating without new upload (optional)

  function $(id) {
    return document.getElementById(id);
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
      const fromTiny = window.tinymce?.get?.(id)?.getContent();
      if (fromTiny != null) return fromTiny;
    } catch (_e) {
      // ignore
    }
    return $(id)?.value ?? "";
  }

  function extractSelectedTags(selectedTagsEl, fallbackInputEl) {
    if (selectedTagsEl) {
      const tagEls = Array.from(
        selectedTagsEl.querySelectorAll(".tag, .selected-tag, .tag-item, .chip, .selected")
      );
      if (tagEls.length) {
        const values = tagEls
          .map((el) => (el.textContent || "").replace(/×/g, "").trim())
          .filter(Boolean);
        if (values.length) return Array.from(new Set(values));
      }

      const childText = Array.from(selectedTagsEl.querySelectorAll("button, span, div"))
        .map((el) => (el.textContent || "").replace(/×/g, "").trim())
        .filter(Boolean);
      if (childText.length) return Array.from(new Set(childText));
    }

    const raw = toStringOrEmpty(fallbackInputEl?.value);
    if (!raw) return [];
    return raw
      .split(/[;,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function collectLevelProgression() {
    const table = document.querySelector(".table-1");
    if (!table) return [];

    const levels = [];
    for (let level = 1; level <= 20; level++) {
      const row = table.querySelector(`.level-${level}`);
      if (!row) continue;

      const selectedTagsEl = row.querySelector(".selected-tags");
      const features = extractSelectedTags(selectedTagsEl);
      levels.push({ level, features });
    }
    return levels;
  }

  function collectCustomFeatures() {
    const list = document.getElementById("features-list");
    if (!list) return [];

    const cards = Array.from(list.querySelectorAll(".feature-card"));
    if (!cards.length) return [];

    return cards
      .map((card) => {
        const name = (card.querySelector("h4")?.textContent || "").trim();
        const description = (card.querySelector("p")?.textContent || "").trim();
        return { name, description };
      })
      .filter((f) => f.name.length > 0 || f.description.length > 0);
  }

  function collectOptionalList(id) {
    const input = $(id);
    if (!input) return [];
    const selectedTagsEl = input.closest(".multiselect-container")?.querySelector(".selected-tags");
    return extractSelectedTags(selectedTagsEl, input);
  }

  function collectSubClassData() {
    const name = toStringOrEmpty($("subclass-name")?.value);
    const parentClass =
      toStringOrEmpty($("subclass-class")?.value) ||
      toStringOrEmpty($("subclass-parent-class")?.value) ||
      toStringOrEmpty($("parent-class")?.value) ||
      null;

    const descriptionHtml = getTinyHtml("subclass-description");

    const progression = {
      levels: collectLevelProgression(),
    };

    const lists = {
      features: collectOptionalList("subclass-features"),
      spells: collectOptionalList("subclass-spells"),
      proficiencies: collectOptionalList("subclass-proficiencies"),
    };

    return {
      info: {
        name,
        parentClass,
        descriptionHtml,
      },
      progression,
      lists,
      customFeatures: collectCustomFeatures(),
      image: {
        path: existingRecordData?.image?.path || null,
        publicUrl: existingRecordData?.image?.publicUrl || null,
      },
    };
  }

  async function loadExistingData(id, userId) {
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

  async function uploadSubClassImage({ userId, homebrewId, file }) {
    const safeName = String(file.name || "image").replace(/[^\w.\-]+/g, "_");
    const path = `subclass/${userId}/${homebrewId}/${Date.now()}_${safeName}`;

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
      window.HeroVault.showNotification("Sub-Class saved", "success");
      return;
    }
    console.info("Sub-Class saved");
  }

  function getSaveBtn() {
    return document.querySelector(".input-img .button-create") || document.querySelector(".button-create");
  }

  function setSaving(btn, isSaving) {
    if (!btn) return;
    btn.disabled = Boolean(isSaving);
    btn.textContent = isSaving ? "Saving..." : (currentSubClassId ? "Update" : "Create");
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

  function applyMultiSelectValues(inputEl, values) {
    if (!inputEl || !Array.isArray(values)) return;
    values.filter(Boolean).forEach((value) => {
      inputEl.value = String(value);
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    });
    inputEl.value = "";
  }

  function applyLevelProgression(levels) {
    if (!Array.isArray(levels)) return;
    const table = document.querySelector(".table-1");
    if (!table) return;
    levels.forEach((entry) => {
      const level = entry?.level;
      if (!level) return;
      const row = table.querySelector(`.level-${level}`);
      if (!row) return;
      const featureInput = row.querySelector(".multiselect-input");
      applyMultiSelectValues(featureInput, entry.features || []);
    });
  }

  function applyCustomFeatures(customFeatures) {
    if (!Array.isArray(customFeatures)) return;
    const list = document.getElementById("features-list");
    if (!list) return;
    const datalist = document.getElementById("list-non-caster");
    list.querySelector(".empty-state")?.remove();
    customFeatures.forEach((feature) => {
      const name = String(feature?.name || "").trim();
      const description = String(feature?.description || "").trim();
      if (!name && !description) return;

      if (datalist && name) {
        const exists = Array.from(datalist.options).some((opt) => opt.value === name);
        if (!exists) {
          const option = document.createElement("option");
          option.value = name;
          datalist.appendChild(option);
        }
      }

      const card = document.createElement("div");
      card.className = "feature-card";
      card.innerHTML = `
        <h4>${name}</h4>
        <p>${description}</p>
        <button class="feature-delete" title="Remove feature"><i class="fas fa-times"></i></button>
      `;

      card.querySelector(".feature-delete")?.addEventListener("click", () => {
        card.remove();
        if (list.children.length === 0) {
          list.innerHTML = '<div class="empty-state">No custom features added yet. Create one above to assign it to levels.</div>';
        }
      });

      list.appendChild(card);
    });
  }

  function applyOptionalList(id, values) {
    const input = document.getElementById(id);
    if (!input) return;
    applyMultiSelectValues(input, values || []);
  }

  function applyExistingSubClassData(record) {
    if (!record) return;
    const data = record.data || {};
    const info = data.info || {};
    const progression = data.progression || {};
    const lists = data.lists || {};

    const nameInput = document.getElementById("subclass-name");
    if (nameInput) nameInput.value = String(record.name || info.name || "");

    const parentClassInput =
      document.getElementById("subclass-class") ||
      document.getElementById("subclass-parent-class") ||
      document.getElementById("parent-class");
    if (parentClassInput) parentClassInput.value = info.parentClass || "";

    setTinyHtml("subclass-description", info.descriptionHtml || "");

    applyLevelProgression(progression.levels || []);
    applyOptionalList("subclass-features", lists.features || []);
    applyOptionalList("subclass-spells", lists.spells || []);
    applyOptionalList("subclass-proficiencies", lists.proficiencies || []);
    applyCustomFeatures(data.customFeatures || []);
  }

  async function hydrateFormForEdit() {
    if (!currentSubClassId) return;
    const session = await getSessionOrPrompt();
    if (!session) return;
    const record = await loadExistingData(currentSubClassId, session.user.id);
    if (!record) return;
    existingRecordData = record.data || null;
    applyExistingSubClassData(record);
  }

  async function handleSave() {
    const btn = getSaveBtn();
    setSaving(btn, true);

    try {
      const session = await getSessionOrPrompt();
      if (!session) return;

      const name = toStringOrEmpty($("subclass-name")?.value);
      if (!name) {
        console.info("Subclass name is required.");
        $("subclass-name")?.focus?.();
        return;
      }

      // Optional image support if exists in markup (not present today)
      const fileInput = $("subclass-image");
      const file = fileInput?.files?.[0] || null;

      if (currentSubClassId && !existingRecordData) {
        const record = await loadExistingData(currentSubClassId, session.user.id);
        existingRecordData = record?.data || null;
      }

      let dataJson = collectSubClassData();

      if (!currentSubClassId) {
        const { data, error } = await window.supabase
          .from("homebrew")
          .insert({
            user_id: session.user.id,
            type: "subclass",
            status: "draft",
            name: dataJson.info.name,
            data: dataJson,
          })
          .select()
          .single();

        if (error) throw error;

        currentSubClassId = data.id;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(currentSubClassId));

        if (file) {
          const img = await uploadSubClassImage({
            userId: session.user.id,
            homebrewId: currentSubClassId,
            file,
          });
          dataJson = { ...dataJson, image: img };
          existingRecordData = dataJson;

          const { error: upErr } = await window.supabase
            .from("homebrew")
            .update({ name: dataJson.info.name, data: dataJson })
            .eq("id", currentSubClassId)
            .eq("user_id", session.user.id);

          if (upErr) throw upErr;
        }

        if (btn) btn.textContent = "Update";
        if (fileInput) fileInput.value = "";
        notifySuccess();
        window.location.href = "../create.html";
        return;
      }

      // UPDATE
      if (!file) {
        const existing = existingRecordData || (await loadExistingData(currentSubClassId, session.user.id));
        if (existing?.image?.path || existing?.image?.publicUrl) {
          dataJson.image = {
            path: existing.image.path || null,
            publicUrl: existing.image.publicUrl || null,
          };
        }
      } else {
        const img = await uploadSubClassImage({
          userId: session.user.id,
          homebrewId: currentSubClassId,
          file,
        });
        dataJson = { ...dataJson, image: img };
        existingRecordData = dataJson;
      }

      const { error: updErr } = await window.supabase
        .from("homebrew")
        .update({ name: dataJson.info.name, data: dataJson })
        .eq("id", currentSubClassId)
        .eq("user_id", session.user.id);

      if (updErr) throw updErr;

      if (fileInput) fileInput.value = "";
      notifySuccess();
    } catch (err) {
      console.error("Save failed:", err);
      console.info(`Save failed: ${err?.message || "Unknown error"}`);
    } finally {
      const btn = getSaveBtn();
      setSaving(btn, false);
    }
  }

  function init() {
    const btn = getSaveBtn();
    if (!btn) return;

    // Prefer URL id for edit mode. If no ?id= provided, treat as NEW and clear stored id.
    try {
      const urlId = new URLSearchParams(window.location.search || "").get("id");
      if (urlId) {
        currentSubClassId = urlId;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
      } else {
        currentSubClassId = null;
        existingRecordData = null;
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (_e) {
      // ignore
    }

    btn.textContent = currentSubClassId ? "Update" : "Create";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSave();
    });

    hydrateFormForEdit();
  }

  document.addEventListener("DOMContentLoaded", init);
})();



