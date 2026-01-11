function isHttpOrigin(origin) {
  return typeof origin === "string" && /^https?:\/\//i.test(origin);
}

export function getApiBaseUrl() {
  // 1) Manually configured (highest priority)
  if (typeof window !== "undefined" && window.API_BASE_URL) {
    return String(window.API_BASE_URL).replace(/\/+$/, "");
  }

  // 2) Optional local dev fallback
  // return "http://localhost:3000";

  // 3) If frontend is served from the same origin as API, this "just works".
  if (typeof window !== "undefined" && isHttpOrigin(window.location?.origin)) {
    return window.location.origin;
  }

  // 4) Last resort: empty (caller can decide what to do)
  return "";
}

async function getAccessToken() {
  // Fast-path from cached session (auth-ui.js sets this)
  const cached = window.__authSession?.access_token;
  if (cached) return cached;

  try {
    const { data } = await window.supabase?.auth?.getSession?.();
    const token = data?.session?.access_token || null;
    if (token) {
      window.__authSession = data.session;
    }
    return token;
  } catch (_e) {
    return null;
  }
}

export async function apiFetch(path, options = {}, { auth = false } = {}) {
  const base = getApiBaseUrl();
  const urlPath = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  const url = `${base}${urlPath}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  if (auth) {
    const token = await getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  if (!res.ok) {
    const err = new Error(`API ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export async function pingHealth() {
  return apiFetch("/api/health");
}


