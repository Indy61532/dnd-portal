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

  function notifySuccess(msg) {
    if (window.HeroVault?.showNotification) {
      window.HeroVault.showNotification(msg, "success");
      return;
    }
    alert(msg);
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
        alert("Feat Name is required.");
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
      alert(`Save failed: ${err?.message || "Unknown error"}`);
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
  }

  document.addEventListener("DOMContentLoaded", init);
})();


