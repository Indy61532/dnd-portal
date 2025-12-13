function formatJoinedDate(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function getDisplayNameFromSession(session) {
  const name = session?.user?.user_metadata?.name;
  return (typeof name === "string" && name.trim().length > 0) ? name.trim() : "Adventurer";
}

function setLoggedOutUI() {
  const profileCart = document.querySelector(".profilecart");
  if (profileCart) profileCart.classList.remove("active");

  const navProfile = document.querySelector(".nav-right.profile");
  if (navProfile) navProfile.classList.remove("active");
}

function setLoggedInUI(session) {
  const displayName = getDisplayNameFromSession(session);
  const email = session?.user?.email || "";
  const joined = formatJoinedDate(session?.user?.created_at);

  // Navbar profile
  const navProfile = document.querySelector(".nav-right.profile");
  if (navProfile) {
    navProfile.classList.add("active");
    const navNameEl = navProfile.querySelector(".profilename");
    if (navNameEl) navNameEl.textContent = displayName;
  }

  // Profile card (only exists on some pages, e.g. index.html)
  const profileCart = document.querySelector(".profilecart");
  if (profileCart) {
    profileCart.classList.add("active");

    const cartNameEl = profileCart.querySelector(".profilename");
    if (cartNameEl) cartNameEl.textContent = displayName;

    const emailEl = profileCart.querySelector(".email");
    if (emailEl) emailEl.textContent = email;

    const joinedEl = profileCart.querySelector(".whenyoujoin");
    if (joinedEl) joinedEl.textContent = joined ? `Joined: ${joined}` : "Joined: -";

    const createdThingsEl = profileCart.querySelector(".createthings");
    if (createdThingsEl) createdThingsEl.textContent = "Characters Created: 0";
  }
}

export async function updateAuthUI() {
  try {
    if (!window.supabase) {
      setLoggedOutUI();
      window.__authSession = null;
      lockGatedUI();
      return;
    }

    const { data, error } = await window.supabase.auth.getSession();
    if (error) {
      setLoggedOutUI();
      window.__authSession = null;
      lockGatedUI();
      return;
    }

    const session = data?.session || null;
    if (!session) {
      setLoggedOutUI();
      window.__authSession = null;
      lockGatedUI();
      return;
    }

    window.__authSession = session;
    setLoggedInUI(session);
    unlockGatedUI();
  } catch (_e) {
    setLoggedOutUI();
    window.__authSession = null;
    lockGatedUI();
  }
}

export async function logout() {
  try {
    await window.supabase?.auth.signOut();
  } finally {
    // onAuthStateChange will also fire; this is a safe immediate refresh
    await updateAuthUI();
  }
}

function getAuthGatedElementsForLock() {
  // Lock only things that are meant to require auth (explicit)
  const selector = ['[data-requires-auth="true"]', ".locked"].join(", ");
  return Array.from(document.querySelectorAll(selector));
}

function getAuthGatedElementsForUnlock() {
  // Unlock everything that looks gated
  const selector = [
    ".locked",
    '[data-requires-auth="true"]',
    '[aria-disabled="true"]',
    "[disabled]",
  ].join(", ");
  return Array.from(document.querySelectorAll(selector));
}

function ensureLockOverlay(el) {
  if (el.querySelector(":scope > .lock-overlay")) return;

  // Make sure overlay positioning works
  const style = window.getComputedStyle(el);
  if (style.position === "static") {
    el.style.position = "relative";
  }

  const overlay = document.createElement("div");
  overlay.className = "lock-overlay";
  overlay.setAttribute("role", "button");
  overlay.setAttribute("tabindex", "0");
  overlay.setAttribute("aria-label", "Login required");
  overlay.innerHTML = `<span class="lock-overlay__text">Login required</span>`;

  overlay.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    ensureAuthOrPrompt();
  });

  overlay.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      ensureAuthOrPrompt();
    }
  });

  el.appendChild(overlay);
}

export function lockGatedUI() {
  const gated = getAuthGatedElementsForLock();

  gated.forEach((el) => {
    // If element was disabled/aria-disabled due to gating, remove disabled so overlay can be clicked
    if (el.matches('[data-requires-auth="true"]')) {
      if (el.hasAttribute("disabled")) {
        el.dataset.authHadDisabled = "1";
        el.removeAttribute("disabled");
      }
      if (el.getAttribute("aria-disabled") === "true") {
        el.dataset.authHadAriaDisabled = "1";
      }
    }

    el.classList.add("locked");
    el.dataset.authLocked = "1";
    el.setAttribute("aria-disabled", "true");
    ensureLockOverlay(el);
  });
}

export function unlockGatedUI() {
  const gated = getAuthGatedElementsForUnlock();

  gated.forEach((el) => {
    // Only remove disabled if we previously removed it for auth gating
    if (el.dataset.authHadDisabled === "1") {
      delete el.dataset.authHadDisabled;
    }

    // Only clear aria-disabled if we set it for auth gating (or if explicitly gated)
    if (el.dataset.authLocked === "1" || el.matches('[data-requires-auth="true"]')) {
      el.removeAttribute("aria-disabled");
    }

    delete el.dataset.authLocked;
    el.classList.remove("locked");

    const overlays = el.querySelectorAll(":scope > .lock-overlay");
    overlays.forEach((o) => o.remove());
  });
}

export async function ensureAuthOrPrompt() {
  // Fast path from cached session
  if (window.__authSession) return true;

  try {
    const { data, error } = await window.supabase?.auth.getSession?.();
    const session = !error ? (data?.session || null) : null;
    window.__authSession = session;

    if (session) return true;
  } catch (_e) {
    // ignore
  }

  if (window.AuthModalInstance?.show) {
    window.AuthModalInstance.show();
  }
  return false;
}

// Make available for inline handlers if needed
window.updateAuthUI = updateAuthUI;
window.logout = logout;
window.lockGatedUI = lockGatedUI;
window.unlockGatedUI = unlockGatedUI;
window.ensureAuthOrPrompt = ensureAuthOrPrompt;

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();

  // React to auth changes (login/logout, refresh, etc.)
  if (window.supabase) {
    window.supabase.auth.onAuthStateChange((_event, session) => {
      window.__authSession = session || null;
      updateAuthUI();
    });
  }
});


