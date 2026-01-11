// Save/Update logic for create-spell.html (Supabase)
// Uses: window.supabase (Supabase v2), window.tinymce (optional), window.AuthModalInstance (optional)

(function () {
  const STORAGE_BUCKET = "homebrew-images";
  const LOCAL_STORAGE_KEY = "hv_current_spell_id";

  let currentSpellId = localStorage.getItem(LOCAL_STORAGE_KEY);
  let existingRecordData = null; // preserve image_path/image_url if updating without new image

  function $(id) {
    return document.getElementById(id);
  }

  function toNumberOrNull(value) {
    const n = parseFloat(String(value ?? "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function toStringOrEmpty(value) {
    return (value == null) ? "" : String(value).trim();
  }

  async function getSessionOrPrompt() {
    const supabase = window.supabase;
    if (!supabase) return null;

    const { data: { session } = { session: null } } = await supabase.auth.getSession();
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

  function getSelectedClasses() {
    // Primary: read chips from DOM
    const container = document.querySelector(".spell-classes .selected-tags");
    if (container) {
      const selectors = [".tag", ".selected-tag", ".tag-item", ".chip", ".selected"];
      for (const sel of selectors) {
        const nodes = Array.from(container.querySelectorAll(sel));
        if (nodes.length) {
          const values = nodes
            .map((n) => (n.textContent || "").trim())
            .filter(Boolean);
          if (values.length) return Array.from(new Set(values));
        }
      }

      // fallback: any direct children with text
      const childValues = Array.from(container.children)
        .map((n) => (n.textContent || "").trim())
        .filter(Boolean);
      if (childValues.length) return Array.from(new Set(childValues));
    }

    // Secondary fallback: parse from input value
    const input = document.getElementById("spell-classes");
    const raw = (input?.value || "").trim();
    if (!raw) return [];
    return raw
      .split(/[;,]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function collectSpellData() {
    const name = toStringOrEmpty($("spell-name")?.value);
    const level = toNumberOrNull($("spell-level")?.value);
    const school = toStringOrEmpty($("spell-school")?.value);
    const classes = getSelectedClasses();

    return {
      info: {
        name,
        level,
        school,
        classes,
      },
      details: {
        castTime: toStringOrEmpty($("spell-cast-time")?.value),
        range: toStringOrEmpty($("spell-range")?.value),
        radius: toStringOrEmpty($("spell-radius")?.value),
        duration: toStringOrEmpty($("spell-duration")?.value),
        components: toStringOrEmpty($("spell-components")?.value),
      },
      blocks: {
        description: getTinyHtml("spell-description"),
        higherLevels: getTinyHtml("spell-higher-levels"),
      },
      image_path: existingRecordData?.image_path || null,
      image_url: existingRecordData?.image_url || null,
    };
  }

  async function loadExistingSpellData(id, userId) {
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

  async function uploadSpellImage({ userId, homebrewId, file }) {
    const safeName = String(file.name || "image").replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/spells/${homebrewId}/${Date.now()}-${safeName}`;

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
    btn.textContent = isSaving ? "Saving..." : (currentSpellId ? "Update Spell" : "Create Spell");
  }

  async function handleSave() {
    const btn = document.querySelector(".button-create");
    setSaving(btn, true);

    try {
      const session = await getSessionOrPrompt();
      if (!session) return;

      const name = toStringOrEmpty($("spell-name")?.value);
      if (!name) {
        alert("Name is required.");
        return;
      }

      if (currentSpellId && !existingRecordData) {
        existingRecordData = await loadExistingSpellData(currentSpellId, session.user.id);
      }

      let spellData = collectSpellData();

      const fileInput = $("spell-image");
      const file = fileInput?.files?.[0] || null;

      if (!currentSpellId) {
        // INSERT
        const { data, error } = await window.supabase
          .from("homebrew")
          .insert({
            user_id: session.user.id,
            type: "spell",
            status: "draft",
            name,
            data: spellData,
          })
          .select()
          .single();

        if (error) throw error;

        currentSpellId = data.id;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(currentSpellId));

        if (file) {
          const img = await uploadSpellImage({
            userId: session.user.id,
            homebrewId: currentSpellId,
            file,
          });
          spellData = { ...spellData, ...img };
          existingRecordData = spellData;

          const { error: upErr } = await window.supabase
            .from("homebrew")
            .update({ name, data: spellData })
            .eq("id", currentSpellId)
            .eq("user_id", session.user.id);

          if (upErr) throw upErr;
        }

        if (btn) btn.textContent = "Update Spell";
        if (fileInput) fileInput.value = "";
        notifySuccess("Spell saved");
        return;
      }

      // UPDATE
      if (file) {
        const img = await uploadSpellImage({
          userId: session.user.id,
          homebrewId: currentSpellId,
          file,
        });
        spellData = { ...spellData, ...img };
        existingRecordData = spellData;
      }

      const { error: updErr } = await window.supabase
        .from("homebrew")
        .update({ name, data: spellData })
        .eq("id", currentSpellId)
        .eq("user_id", session.user.id);

      if (updErr) throw updErr;

      if (fileInput) fileInput.value = "";
      notifySuccess("Spell saved");
    } catch (err) {
      console.error("Save failed:", err);
      alert(`Save failed: ${err?.message || "Unknown error"}`);
    } finally {
      const btn = document.querySelector(".button-create");
      setSaving(btn, false);
    }
  }

  function init() {
    // Prefer URL id for edit mode. If no ?id= provided, treat as NEW and clear stored id.
    try {
      const urlId = new URLSearchParams(window.location.search || "").get("id");
      if (urlId) {
        currentSpellId = urlId;
        localStorage.setItem(LOCAL_STORAGE_KEY, String(urlId));
      } else {
        currentSpellId = null;
        existingRecordData = null;
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (_e) {
      // ignore
    }

    const btn = document.querySelector(".button-create");
    if (btn) btn.textContent = currentSpellId ? "Update Spell" : "Create Spell";

    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        handleSave();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();


