import { parseSseBuffer } from "../utils/parseSse";
import { currentLanguage } from "../i18n";

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
  theme?: "light" | "dark" | "auto";
  language?: "en" | "es";
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
  /** Household-managed item-form locations; seeded from defaults. */
  locationPresets?: string[];
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
  theme?: "light" | "dark" | "auto";
  language?: "en" | "es";
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
  mine: () =>
    api<{ households: HouseholdSummary[]; household: HouseholdSummary | null }>(
      "/api/households/mine"
    ),
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
  updateLocationPresets: (id: string, locationPresets: string[]) =>
    api<{ household: HouseholdSummary }>(`/api/households/${id}/location-presets`, {
      method: "PUT",
      body: JSON.stringify({ locationPresets }),
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

export type ToriChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ToriProposedItem = {
  name: string;
  quantity: number;
  location: string | null;
  folderId: string | null;
  expirationDate: string | null;
  purchaseDate: string | null;
  tags: string[];
  price: string | null;
};

export type ToriPendingAction =
  | { type: "add_item"; item: ToriProposedItem }
  | { type: "update_item"; itemId: string; itemName: string; patch: Partial<ToriProposedItem> }
  | { type: "delete_item"; itemId: string; itemName: string };

export type ToriChatResponse = {
  reply: string;
  pendingAction?: ToriPendingAction;
};

export type ToriStreamEvent =
  | { type: "tool.start"; id: string; name: string; input: unknown }
  | { type: "tool.result"; id: string; name: string; input: unknown; output: unknown }
  | { type: "reply"; reply: string; pendingAction?: ToriPendingAction }
  | { type: "error"; error: string; status?: number };

async function fetchToriChatStream(
  messages: ToriChatMessage[],
  householdId: string,
  retry = true
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/tori/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ householdId, messages, locale: currentLanguage() }),
  });

  if (res.status === 401 && retry && getRefreshToken()) {
    const next = await refreshAccessToken();
    if (next) return fetchToriChatStream(messages, householdId, false);
  }

  return res;
}

export const toriApi = {
  chat: (messages: ToriChatMessage[], householdId: string) =>
    api<ToriChatResponse>("/api/tori/chat", {
      method: "POST",
      body: JSON.stringify({ householdId, messages, locale: currentLanguage() }),
    }),
  chatStream: async (
    messages: ToriChatMessage[],
    householdId: string,
    onEvent?: (event: ToriStreamEvent) => void
  ): Promise<ToriChatResponse> => {
    const res = await fetchToriChatStream(messages, householdId);
    const contentType = res.headers.get("content-type") ?? "";

    if (!contentType.includes("text/event-stream")) {
      const data = (await res.json().catch(() => ({}))) as ToriChatResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
      if (!data.reply) throw new Error("Tori AI returned an empty reply. Try again.");
      onEvent?.({ type: "reply", reply: data.reply, pendingAction: data.pendingAction });
      return { reply: data.reply, pendingAction: data.pendingAction };
    }

    if (!res.body) throw new Error("Tori AI could not reply right now. Try again.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let reply = "";
    let pendingAction: ToriPendingAction | undefined;
    let streamError: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest;
      for (const frame of parsed.events) {
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(frame.data) as Record<string, unknown>;
        } catch {
          continue;
        }
        if (frame.event === "tool.start" || frame.event === "tool.result") {
          onEvent?.(data as unknown as ToriStreamEvent);
        } else if (frame.event === "reply") {
          reply = typeof data.reply === "string" ? data.reply : "";
          pendingAction = data.pendingAction as ToriPendingAction | undefined;
          onEvent?.({ type: "reply", reply, pendingAction });
        } else if (frame.event === "error") {
          streamError =
            typeof data.error === "string" && data.error.trim()
              ? data.error
              : "Tori AI could not reply right now. Try again.";
        }
      }
    }

    if (streamError) throw new Error(streamError);
    if (!reply) throw new Error("Tori AI returned an empty reply. Try again.");
    return { reply, pendingAction };
  },
};

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url}`;
}
