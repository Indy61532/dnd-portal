// Central runtime config for the static frontend.
// This must run BEFORE any module that calls the backend (api-client.js).
(function () {
  if (typeof window === "undefined") return;

  // Highest priority: keep any value already set inline in HTML.
  if (window.API_BASE_URL) return;

  // For the "single URL" setup (frontend + API on the same origin),
  // do NOT force API_BASE_URL. api-client.js will use window.location.origin.
})();



