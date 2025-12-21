// client/js/campaigns-page.js (ESM)
// Campaigns: create campaign -> create default DM folders -> immediately render new card (no reload).

function notify(message, type = "success") {
  if (window.HeroVault?.showNotification) {
    window.HeroVault.showNotification(message, type);
    return;
  }
  alert(message);
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function text(v) {
  return String(v ?? "").trim();
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getSession() {
  const { data } = await window.supabase.auth.getSession();
  return data?.session || null;
}

function ensureModal() {
  let overlay = document.getElementById("hvCampaignModal");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "hvCampaignModal";
  overlay.className = "hv-modal-overlay";
  overlay.innerHTML = `
    <div class="hv-modal" role="dialog" aria-modal="true" aria-labelledby="hvCampaignModalTitle">
      <div class="hv-modal-header">
        <div class="hv-modal-title" id="hvCampaignModalTitle">Create Campaign</div>
        <button type="button" class="hv-modal-close" aria-label="Close">✕</button>
      </div>
      <form class="hv-modal-body" id="hvCreateCampaignForm">
        <label class="hv-field">
          <span class="hv-label">Name</span>
          <input class="hv-input" id="hvCampaignName" maxlength="80" placeholder="e.g. Curse of Strahd" required />
        </label>
        <label class="hv-field">
          <span class="hv-label">Description</span>
          <textarea class="hv-textarea" id="hvCampaignDescription" rows="4" maxlength="500" placeholder="Short summary (optional)"></textarea>
        </label>
        <div class="hv-modal-actions">
          <button type="button" class="hv-btn hv-btn-ghost" data-action="cancel">Cancel</button>
          <button type="submit" class="hv-btn hv-btn-primary" id="hvCreateCampaignBtn">Create Campaign</button>
        </div>
      </form>
    </div>
  `.trim();

  document.body.appendChild(overlay);

  const close = () => hideModal();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector(".hv-modal-close")?.addEventListener("click", close);
  overlay.querySelector('[data-action="cancel"]')?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  return overlay;
}

function showModal() {
  const overlay = ensureModal();
  overlay.classList.add("is-open");
  const nameEl = overlay.querySelector("#hvCampaignName");
  nameEl?.focus();
}

function hideModal() {
  const overlay = document.getElementById("hvCampaignModal");
  if (!overlay) return;
  overlay.classList.remove("is-open");
}

function clearModalInputs() {
  const overlay = document.getElementById("hvCampaignModal");
  if (!overlay) return;
  const nameEl = overlay.querySelector("#hvCampaignName");
  const descEl = overlay.querySelector("#hvCampaignDescription");
  if (nameEl) nameEl.value = "";
  if (descEl) descEl.value = "";
}

function createCampaignCard({ campaignId, name, description }) {
  const card = document.createElement("div");
  card.className = "campaign-card";
  card.dataset.campaignId = String(campaignId);

  const desc = text(description);
  const infoHtml = desc
    ? `
      <div class="campaign-info">
        <div class="campaign-stat">
          <span class="campaign-stat-label">Description</span>
          <span class="campaign-stat-value">${escapeHtml(desc)}</span>
        </div>
      </div>
    `.trim()
    : `<div class="campaign-info"></div>`;

  card.innerHTML = `
    <div class="campaign-status active"></div>
    <div class="campaign-header">
      <div class="campaign-icon"><i class="fas fa-dragon"></i></div>
      <div class="campaign-name">${escapeHtml(text(name) || "Campaign")}</div>
    </div>
    ${infoHtml}
    <div class="campaign-actions">
      <button class="campaign-action open" type="button">
        <i class="fas fa-play"></i>
        Open
      </button>
      <button class="campaign-action delete" type="button" title="Delete">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `.trim();

  // Open on card click (nice UX), keep buttons too
  card.addEventListener("click", () => {
    window.location.href = `dm-board.html?campaignId=${encodeURIComponent(String(campaignId))}`;
  });

  const openBtn = card.querySelector(".campaign-action.open");
  const delBtn = card.querySelector(".campaign-action.delete");

  openBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `dm-board.html?campaignId=${encodeURIComponent(String(campaignId))}`;
  });

  delBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteCampaign({ campaignId, cardEl: card });
  });

  return card;
}

async function createDefaultDmFolders({ campaignId, userId }) {
  const names = ["Items", "NPCs", "Locations", "Quests", "Session Notes", "Encounters"];
  const rows = names.map((name, idx) => ({
    campaign_id: campaignId,
    user_id: userId,
    name,
    sort_order: idx,
  }));

  const { error } = await window.supabase.from("dm_folders").insert(rows);
  if (error) throw error;
}

async function deleteCampaign({ campaignId, cardEl }) {
  const ok = await window.ensureAuthOrPrompt();
  if (!ok) return;

  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  if (!confirm("Delete this campaign?")) return;

  try {
    const { error } = await window.supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("user_id", userId);
    if (error) throw error;

    cardEl?.remove();
    notify("Deleted", "success");
  } catch (e) {
    console.error(e);
    notify("Delete failed", "error");
  }
}

async function insertCampaign({ userId, name, description }) {
  const payload = {
    user_id: userId,
    name,
    description: description || null,
  };

  const { data, error } = await window.supabase
    .from("campaigns")
    .insert(payload)
    .select("id, name, description, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function loadCampaignsIntoGrid({ userId, gridEl }) {
  // Replace static examples with real data
  const { data, error } = await window.supabase
    .from("campaigns")
    .select("id, name, description, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  gridEl.innerHTML = "";
  const items = Array.isArray(data) ? data : [];
  items.forEach((c) => {
    gridEl.appendChild(
      createCampaignCard({
        campaignId: c.id,
        name: c.name,
        description: c.description,
      })
    );
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = $(".campaigns-grid");
  const newBtn = $(".button-new-charakter");
  if (!grid || !newBtn) return;

  // Auth gate
  const ok = await window.ensureAuthOrPrompt();
  if (!ok) return;

  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  // Initial load (optional but makes the page real)
  try {
    await loadCampaignsIntoGrid({ userId, gridEl: grid });
  } catch (e) {
    console.error("Load campaigns failed:", e);
    notify("Load failed", "error");
  }

  // Open modal
  newBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showModal();
  });

  // Create campaign submit
  const overlay = ensureModal();
  overlay.querySelector("#hvCreateCampaignForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = text(overlay.querySelector("#hvCampaignName")?.value);
    const description = text(overlay.querySelector("#hvCampaignDescription")?.value);

    const ok2 = await window.ensureAuthOrPrompt();
    if (!ok2) return;

    const session2 = await getSession();
    const userId2 = session2?.user?.id;
    if (!userId2) return;

    if (!name) {
      notify("Name is required", "error");
      return;
    }

    const btn = overlay.querySelector("#hvCreateCampaignBtn");
    if (btn) btn.disabled = true;

    try {
      const created = await insertCampaign({ userId: userId2, name, description });
      const campaignId = created?.id;
      console.log("Campaign created:", campaignId);

      try {
        await createDefaultDmFolders({ campaignId, userId: userId2 });
      } catch (folderErr) {
        console.error(folderErr);
        notify("Campaign created, but DM Board setup failed", "error");
      }

      // UI update without reload (prepend newest)
      const card = createCampaignCard({
        campaignId,
        name: created.name,
        description: created.description,
      });
      grid.prepend(card);

      notify("Campaign created", "success");
      hideModal();
      clearModalInputs();
    } catch (err) {
      console.error(err);
      notify("Create campaign failed", "error");
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});


