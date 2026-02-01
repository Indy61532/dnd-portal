// Save/Update logic for create-background.html (Supabase)
// Classic script (not module). Uses window.supabase + optional window.AuthModalInstance + tinymce.

(function () {
  const LOCAL_STORAGE_KEY = "hv_current_background_id";

  let currentBackgroundId = localStorage.getItem(LOCAL_STORAGE_KEY);

  function $(id) {
    return document.getElementById(id);
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
    const el = $(id);
    if (el) el.value = safeHtml;
  }

  function toStringOrEmpty(value) {
    return value == null ? "" : String(value).trim();
  }

  function extractSelectedTags(selectedTagsEl, fallbackInputEl) {
    if (selectedTagsEl) {
      // Prefer explicit tag/chip elements if present
      const tagEls = Array.from(selectedTagsEl.querySelectorAll(".tag, .selected-tag, .tag-item, .chip, .selected"));
      if (tagEls.length) {
        const values = tagEls
          .map((el) => (el.textContent || "").replace(/×/g, "").trim())
          .filter(Boolean);
        if (values.length) return Array.from(new Set(values));
      }

      // Fallback: any child nodes with text (avoid grabbing the input value here)
      const childText = Array.from(selectedTagsEl.querySelectorAll("button, span, div"))
        .map((el) => (el.textContent || "").replace(/×/g, "").trim())
        .filter(Boolean);
      if (childText.length) return Array.from(new Set(childText));
    }

    // Last resort fallback: parse from input value (comma-separated)
    const raw = toStringOrEmpty(fallbackInputEl?.value);
    if (!raw) return [];
    return raw
      .split(/[;,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function collectBackgroundData() {
    const name = toStringOrEmpty($("background-name")?.value);
    const descriptionHtml = getTinyHtml("background-description");
    const tools = toStringOrEmpty($("background-tools")?.value);

    const skillsInput = $("background-skills");
    const skillsSelectedTags = skillsInput?.closest(".selected-tags") || null;
    const skills = extractSelectedTags(skillsSelectedTags, skillsInput);

    const languagesInput = $("background-languages");
    const languagesSelectedTags = languagesInput?.closest(".selected-tags") || null;
    const languages = extractSelectedTags(languagesSelectedTags, languagesInput);

    const featureName = toStringOrEmpty($("background-feat-name")?.value);
    const featureDescriptionHtml = getTinyHtml("background-feat-description");

    return {
      info: {
        name,
        descriptionHtml,
        tools,
      },
      skills,
      languages,
      feature: {
        name: featureName,
        descriptionHtml: featureDescriptionHtml,
      },
    };
  }

  async function loadExistingBackgroundData(id, userId) {
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

  function applyExistingBackgroundData(record) {
    if (!record) return;
    const data = record.data || {};
    const info = data.info || {};

    const setValue = (id, value) => {
      const el = $(id);
      if (el) el.value = value ?? "";
    };

    setValue("background-name", String(record.name || info.name || ""));
    setValue("background-tools", info.tools ?? "");
    setValue("background-feat-name", data.feature?.name ?? "");

    setTinyHtml("background-description", info.descriptionHtml || "");
    setTinyHtml("background-feat-description", data.feature?.descriptionHtml || "");

    applyMultiSelectValues($("background-skills"), data.skills || []);
    applyMultiSelectValues($("background-languages"), data.languages || []);
  }

  async function hydrateFormForEdit() {
    if (!currentBackgroundId) return;
    const session = await getSessionOrPrompt();
    if (!session) return;
    const record = await loadExistingBackgroundData(currentBackgroundId, session.user.id);
    if (!record) return;
    applyExistingBackgroundData(record);
  }

  function getSaveBtn() {
    return document.querySelector(".input-img .button-create");
  }

  function setSaving(btn, isSaving) {
    if (!btn) return;
    btn.disabled = Boolean(isSaving);
    btn.textContent = isSaving ? "Saving..." : (currentBackgroundId ? "Update" : "Create background");
  }

  function notifySuccess() {
    if (window.HeroVault?.showNotification) {
      window.HeroVault.showNotification("Background saved", "success");
      return;
    }
    console.info("Background saved");
  }

  async function handleSave() {
    const btn = getSaveBtn();
    setSaving(btn, true);

    try {
      const session = await getSessionOrPrompt();
      if (!session) return;

      const name = toStringOrEmpty($("background-name")?.value);
      if (!name) {
        if (window.HeroVault?.showNotification) {
          window.HeroVault.showNotification("Please enter a Background Name", "error");
        } else {
          console.info("Background Name is required.");
        }
        $("background-name")?.focus?.();
        return;
      }

      const dataJson = collectBackgroundData();

      if (!currentBackgroundId) {
        const { data, error } = await window.supabase
          .from("homebrew")
          .insert({
            user_id: session.user.id,
            type: "background",
            status: "draft",
            name: dataJson.info.name,
            data: dataJson,
          })
          .select()
          .single();

        if (error) throw error;

        currentBackgroundId = data.id;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(currentBackgroundId));
        if (btn) btn.textContent = "Update";
        notifySuccess();
        window.location.href = "../create.html";
        return;
      }

      const { error: updErr } = await window.supabase
        .from("homebrew")
        .update({ name: dataJson.info.name, data: dataJson })
        .eq("id", currentBackgroundId)
        .eq("user_id", session.user.id);

      if (updErr) throw updErr;

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
        currentBackgroundId = urlId;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
      } else {
        currentBackgroundId = null;
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (_e) {
      // ignore
    }

    btn.textContent = currentBackgroundId ? "Update" : "Create background";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSave();
    });

    hydrateFormForEdit();
  }

  document.addEventListener("DOMContentLoaded", init);
})();



