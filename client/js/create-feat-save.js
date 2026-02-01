// Save/Update logic for create-feat.html (Supabase)
// Classic script (not module). Uses window.supabase + optional window.AuthModalInstance + tinymce.

(function () {
  const LOCAL_STORAGE_KEY = "hv_current_feat_id";

  let currentFeatId = localStorage.getItem(LOCAL_STORAGE_KEY);

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
      const fromTiny = window.tinymce?.get(id)?.getContent();
      if (typeof fromTiny === "string") return fromTiny;
    } catch (_e) {
      // ignore
    }
    const el = document.getElementById(id);
    return el ? (el.value || "") : "";
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

  function collectFeatData() {
    const name = toStringOrEmpty($("feat-name")?.value);
    const descriptionHtml = getTinyHtml("feat-description");
    const hasStats = Boolean($("stats-checkbox")?.checked);

    const selectedTagsEl = document.querySelector(".multiselect-container .selected-tags");
    const stats = hasStats ? extractSelectedTags(selectedTagsEl) : [];

    return {
      info: {
        name,
        descriptionHtml,
        hasStats,
      },
      stats,
    };
  }

  async function loadExistingFeatData(id, userId) {
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

  function applyMultiSelectValues(inputEl, values) {
    if (!inputEl || !Array.isArray(values)) return;
    values.filter(Boolean).forEach((value) => {
      inputEl.value = String(value);
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    });
    inputEl.value = "";
  }

  function applyExistingFeatData(record) {
    if (!record) return;
    const data = record.data || {};
    const info = data.info || {};

    const nameInput = document.getElementById("feat-name");
    if (nameInput) nameInput.value = String(record.name || info.name || "");

    const statsCheckbox = document.getElementById("stats-checkbox");
    if (statsCheckbox) {
      statsCheckbox.checked = Boolean(info.hasStats);
      statsCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
    }

    setTinyHtml("feat-description", info.descriptionHtml || "");

    const statsInput = document.querySelector(".multiselect-container .multiselect-input");
    applyMultiSelectValues(statsInput, data.stats || []);
  }

  async function hydrateFormForEdit() {
    if (!currentFeatId) return;
    const session = await getSessionOrPrompt();
    if (!session) return;
    const record = await loadExistingFeatData(currentFeatId, session.user.id);
    if (!record) return;
    applyExistingFeatData(record);
  }

  function notifySuccess(msg) {
    if (window.HeroVault?.showNotification) {
      window.HeroVault.showNotification(msg, "success");
      return;
    }
    console.info(msg);
  }

  function getSaveBtn() {
    return document.querySelector(".input-img .button-create");
  }

  function setSaving(btn, isSaving) {
    if (!btn) return;
    btn.disabled = Boolean(isSaving);
    btn.textContent = isSaving ? "Saving..." : (currentFeatId ? "Update" : "Create feat");
  }

  async function handleSave() {
    const saveBtn = getSaveBtn();
    setSaving(saveBtn, true);

    try {
      const session = await getSessionOrPrompt();
      if (!session) return;

      const name = toStringOrEmpty($("feat-name")?.value);
      if (!name) {
        console.info("Feat Name is required.");
        return;
      }

      const dataJson = collectFeatData();

      if (!currentFeatId) {
        const { data, error } = await window.supabase
          .from("homebrew")
          .insert({
            user_id: session.user.id,
            type: "feat",
            status: "draft",
            name,
            data: dataJson,
          })
          .select()
          .single();

        if (error) throw error;

        currentFeatId = data.id;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(currentFeatId));

        if (saveBtn) saveBtn.textContent = "Update";
        notifySuccess("Feat saved");
        window.location.href = "../create.html";
        return;
      }

      const { error: updErr } = await window.supabase
        .from("homebrew")
        .update({ name, data: dataJson })
        .eq("id", currentFeatId)
        .eq("user_id", session.user.id);

      if (updErr) throw updErr;

      notifySuccess("Feat saved");
    } catch (err) {
      console.error("Save failed:", err);
      console.info(`Save failed: ${err?.message || "Unknown error"}`);
    } finally {
      const btn = getSaveBtn();
      setSaving(btn, false);
    }
  }

  function init() {
    const saveBtn = getSaveBtn();
    if (!saveBtn) return;

    // Prefer URL id for edit mode. If no ?id= provided, treat as NEW and clear stored id.
    try {
      const urlId = new URLSearchParams(window.location.search || "").get("id");
      if (urlId) {
        currentFeatId = urlId;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
      } else {
        currentFeatId = null;
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (_e) {
      // ignore
    }

    saveBtn.textContent = currentFeatId ? "Update" : "Create feat";

    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSave();
    });

    hydrateFormForEdit();
  }

  document.addEventListener("DOMContentLoaded", init);
})();



