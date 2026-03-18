const BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || process.env?.VITE_API_URL || "http://localhost:3001";

const TOKEN_KEY = "capstone_token";

let _tokenMemory = null;

export function getToken() {
  if (typeof localStorage !== "undefined") return localStorage.getItem(TOKEN_KEY);
  return _tokenMemory;
}

export function setToken(token) {
  if (typeof localStorage !== "undefined") {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } else {
    _tokenMemory = token || null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText || "Request failed");
  return data;
}

// --- Auth ---
export async function apiRegister(email, password, fullName) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, fullName }),
  });
  return data;
}

export async function apiLogin(email, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function apiMe() {
  const data = await request("/api/auth/me");
  return data.user;
}

// --- Users ---
export async function createUser(userId, userData) {
  const data = await request(`/api/users/${userId}`, {
    method: "POST",
    body: JSON.stringify(userData),
  });
  return data;
}

export async function fetchUser(userId) {
  return request(`/api/users/${userId}`);
}

export async function updateUser(userId, updatedData) {
  return request(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updatedData),
  });
}

export async function removeUser(userId) {
  await request(`/api/users/${userId}`, { method: "DELETE" });
}

// --- Folders ---
export async function fetchFolders(userId) {
  const list = await request(`/api/users/${userId}/folders`);
  return Array.isArray(list) ? list : [];
}

export async function createFolder(userId, folderData) {
  return request(`/api/users/${userId}/folders`, {
    method: "POST",
    body: JSON.stringify(folderData),
  });
}

export async function updateFolder(userId, folderId, updatedData) {
  await request(`/api/users/${userId}/folders/${folderId}`, {
    method: "PATCH",
    body: JSON.stringify(updatedData),
  });
  return { success: true };
}

export async function removeFolder(userId, folderId) {
  await request(`/api/users/${userId}/folders/${folderId}`, { method: "DELETE" });
  return { success: true };
}

// --- Items ---
export async function fetchItems(userId) {
  const list = await request(`/api/users/${userId}/items`);
  return Array.isArray(list) ? list : [];
}

export async function createItem(userId, folderId, itemData) {
  return request(`/api/users/${userId}/items`, {
    method: "POST",
    body: JSON.stringify({ ...itemData, folderId: folderId || undefined }),
  });
}

export async function updateItem(userId, itemId, folderId, currentFolderId, updatedData) {
  await request(`/api/users/${userId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...updatedData,
      folderId: folderId ?? undefined,
      currentFolderId: currentFolderId ?? undefined,
    }),
  });
  return { success: true };
}

export async function removeItem(userId, itemId, folderId) {
  const q = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
  await request(`/api/users/${userId}/items/${itemId}${q}`, { method: "DELETE" });
  return { success: true };
}
