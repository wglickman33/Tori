const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const ACCESS_KEY = "tori_access_token";
const REFRESH_KEY = "tori_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = (await res.json()) as AuthSession;
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  if (res.status === 401 && retry && getRefreshToken()) {
    const next = await refreshAccessToken();
    if (next) return api<T>(path, options, false);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface HouseholdSummary {
  id: string;
  name: string;
  inviteCode: string | null;
  role: "owner" | "member";
  ownerId: string;
  memberCount: number;
}

export interface Folder {
  id: string;
  householdId: string;
  name: string;
  category: string;
  creationDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: string;
  householdId: string;
  folderId: string | null;
  name: string;
  location: string | null;
  purchaseDate: string | null;
  expirationDate: string | null;
  quantity: number;
  price: string | null;
  tags: string[];
  imageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type FolderInput = {
  name: string;
  category: string;
  creationDate?: string | null;
};

export type ItemInput = {
  name: string;
  location?: string | null;
  folderId?: string | null;
  purchaseDate?: string | null;
  expirationDate?: string | null;
  quantity?: number;
  price?: number | string | null;
  tags?: string[];
};

export type ProfileUpdate = {
  displayName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

export interface HouseholdMemberRow {
  userId: string;
  displayName: string;
  email: string;
  role: "owner" | "member";
  joinedAt: string;
}

export const authApi = {
  register: (displayName: string, email: string, password: string) =>
    api<AuthSession>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ displayName, email, password }),
    }),
  login: (email: string, password: string) =>
    api<AuthSession>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<AuthUser>("/api/auth/me"),
  updateProfile: (body: ProfileUpdate) =>
    api<AuthUser>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAccount: () => api<void>("/api/auth/me", { method: "DELETE" }),
  logout: (refreshToken: string) =>
    api<void>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
  forgotPassword: (email: string) =>
    api<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    api<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),
};

export const householdsApi = {
  mine: () => api<{ household: HouseholdSummary | null }>("/api/households/mine"),
  create: (name: string) =>
    api<{ household: HouseholdSummary }>("/api/households", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  join: (inviteCode: string) =>
    api<{ household: HouseholdSummary }>("/api/households/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    }),
  get: (id: string) => api<{ household: HouseholdSummary | null }>(`/api/households/${id}`),
  update: (id: string, name: string) =>
    api<{ household: HouseholdSummary }>(`/api/households/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  listMembers: (id: string) =>
    api<{ members: HouseholdMemberRow[] }>(`/api/households/${id}/members`),
  removeMember: (id: string, userId: string) =>
    api<void>(`/api/households/${id}/members/${userId}`, { method: "DELETE" }),
  leave: (id: string) => api<void>(`/api/households/${id}/leave`, { method: "POST" }),
  regenerateCode: (id: string) =>
    api<{ inviteCode: string }>(`/api/households/${id}/regenerate-code`, {
      method: "POST",
    }),
};

export const inventoryApi = {
  listFolders: (householdId: string) =>
    api<{ folders: Folder[] }>(`/api/households/${householdId}/folders`),
  createFolder: (householdId: string, body: FolderInput) =>
    api<{ folder: Folder }>(`/api/households/${householdId}/folders`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateFolder: (householdId: string, folderId: string, body: Partial<FolderInput>) =>
    api<{ folder: Folder }>(`/api/households/${householdId}/folders/${folderId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteFolder: (householdId: string, folderId: string) =>
    api<void>(`/api/households/${householdId}/folders/${folderId}`, { method: "DELETE" }),
  listItems: (householdId: string) =>
    api<{ items: Item[] }>(`/api/households/${householdId}/items`),
  createItem: (householdId: string, body: ItemInput) =>
    api<{ item: Item }>(`/api/households/${householdId}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateItem: (householdId: string, itemId: string, body: Partial<ItemInput>) =>
    api<{ item: Item }>(`/api/households/${householdId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteItem: (householdId: string, itemId: string) =>
    api<void>(`/api/households/${householdId}/items/${itemId}`, { method: "DELETE" }),
  uploadItemImage: async (householdId: string, itemId: string, file: File) => {
    const token = getAccessToken();
    const body = new FormData();
    body.append("image", file);
    const res = await fetch(`${API_URL}/api/households/${householdId}/items/${itemId}/image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
    return data as { item: Item };
  },
  deleteItemImage: (householdId: string, itemId: string) =>
    api<{ item: Item }>(`/api/households/${householdId}/items/${itemId}/image`, {
      method: "DELETE",
    }),
  exportCsvUrl: (householdId: string) => `${API_URL}/api/households/${householdId}/export`,
  eventsUrl: (householdId: string, token: string) =>
    `${API_URL}/api/households/${householdId}/events?token=${encodeURIComponent(token)}`,
};

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}
