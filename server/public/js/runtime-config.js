// Central runtime config for the static frontend.
// This must run BEFORE any module that calls the backend (api-client.js).
(function () {
  if (typeof window === "undefined") return;

  // Highest priority: keep any value already set inline in HTML.
  if (window.API_BASE_URL) return;

  // Default: Railway backend.
  // If you later host frontend + backend under the same domain, you can remove this line
  // and rely on api-client.js falling back to window.location.origin.
  window.API_BASE_URL = "https://dnd-portal-production.up.railway.app";
})();



