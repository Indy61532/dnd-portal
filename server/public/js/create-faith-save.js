// Save/Update logic for create-faith.html (Supabase)
// Classic script (not module). Uses window.supabase + optional window.AuthModalInstance + tinymce.

(function () {
  const LOCAL_STORAGE_KEY = "hv_current_faith_id";

  let currentFaithId = localStorage.getItem(LOCAL_STORAGE_KEY);

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
    const el = $(id);
    return (el && el.value != null) ? el.value : "";
  }

  function collectFaithData() {
    const name = toStringOrEmpty($("faith-name")?.value);
    const descriptionHtml = getTinyHtml("faith-description");
    const deityPatronName = toStringOrEmpty($("deity-patron")?.value);
    const deityPatronDescriptionHtml = getTinyHtml("deity-patron-description");

    return {
      info: {
        name,
        descriptionHtml,
      },
      deityPatron: {
        name: deityPatronName,
        descriptionHtml: deityPatronDescriptionHtml,
      },
    };
  }

  function getSaveBtn() {
    return document.querySelector(".input-img .button-create");
  }

  function setSaving(btn, isSaving) {
    if (!btn) return;
    btn.disabled = Boolean(isSaving);
    btn.textContent = isSaving ? "Saving..." : (currentFaithId ? "Update" : "Create faith");
  }

  function notifySuccess() {
    if (window.HeroVault?.showNotification) {
      window.HeroVault.showNotification("Faith saved", "success");
      return;
    }
    alert("Faith saved");
  }

  async function handleSave() {
    const saveBtn = getSaveBtn();
    setSaving(saveBtn, true);

    try {
      const session = await getSessionOrPrompt();
      if (!session) return;

      const name = toStringOrEmpty($("faith-name")?.value);
      if (!name) {
        alert("Faith Name is required.");
        $("faith-name")?.focus?.();
        return;
      }

      const faithData = collectFaithData();

      if (!currentFaithId) {
        const { data, error } = await window.supabase
          .from("homebrew")
          .insert({
            user_id: session.user.id,
            type: "faith",
            status: "draft",
            name: faithData.info.name,
            data: faithData,
          })
          .select()
          .single();

        if (error) throw error;

        currentFaithId = data.id;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(currentFaithId));
        if (saveBtn) saveBtn.textContent = "Update";
        notifySuccess();
        return;
      }

      const { error: updErr } = await window.supabase
        .from("homebrew")
        .update({ name: faithData.info.name, data: faithData })
        .eq("id", currentFaithId)
        .eq("user_id", session.user.id);

      if (updErr) throw updErr;

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

    // Prefer URL id for edit mode. If no ?id= provided, treat as NEW and clear stored id.
    try {
      const urlId = new URLSearchParams(window.location.search || "").get("id");
      if (urlId) {
        currentFaithId = urlId;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
      } else {
        currentFaithId = null;
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (_e) {
      // ignore
    }

    saveBtn.textContent = currentFaithId ? "Update" : "Create faith";

    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSave();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();


