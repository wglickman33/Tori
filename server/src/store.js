/**
 * In-memory store mirroring Firebase Realtime Database structure.
 * Replace with a real DB (e.g. SQLite/Postgres) later.
 *
 * Structure:
 * - authByEmail: { email -> { uid, email, displayName, passwordHash } }
 * - users: { [userId]: { ...userData, created_at, updated_at, folders: {}, items: {} } }
 *   - users[userId].folders[folderId]: { id, name, type, creationDate, customTag, created_at, updated_at, items: {} }
 *   - users[userId].folders[folderId].items[itemId]: { id, name, ..., folderId, created_at, updated_at }
 *   - users[userId].items[itemId]: root-level items (folderId: null)
 */

const authByEmail = new Map();
const users = Object.create(null);

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function timestamp() {
  return new Date().toISOString();
}

// ----- Auth (separate from user profile) -----
export function getAuthUserByEmail(email) {
  return authByEmail.get((email || "").trim().toLowerCase()) ?? null;
}

export function getAuthUserByUid(uid) {
  for (const u of authByEmail.values()) {
    if (u.uid === uid) return u;
  }
  return null;
}

export function createAuthUser({ uid, email, displayName, passwordHash }) {
  const key = (email || "").trim().toLowerCase();
  authByEmail.set(key, { uid, email: key, displayName: displayName || null, passwordHash });
}

// ----- User profile + data -----
export function getUser(userId) {
  return users[userId] ? { ...users[userId], folders: users[userId].folders ? { ...users[userId].folders } : {}, items: users[userId].items ? { ...users[userId].items } : {} } : null;
}

export function setUser(userId, data) {
  if (!users[userId]) {
    users[userId] = { folders: {}, items: {} };
  }
  const prev = users[userId];
  users[userId] = { ...prev, ...data, folders: prev.folders || {}, items: prev.items || {} };
}

export function updateUser(userId, updates) {
  if (!users[userId]) return;
  users[userId] = { ...users[userId], ...updates, updated_at: timestamp() };
}

export function deleteUser(userId) {
  delete users[userId];
}

// ----- Folders -----
export function getFolders(userId) {
  const u = users[userId];
  if (!u || !u.folders) return null;
  return u.folders;
}

export function getFolder(userId, folderId) {
  const folders = getFolders(userId);
  if (!folders || !folders[folderId]) return null;
  return { ...folders[folderId], items: folders[folderId].items ? { ...folders[folderId].items } : {} };
}

export function createFolder(userId, folderData) {
  if (!users[userId]) users[userId] = { folders: {}, items: {} };
  if (!users[userId].folders) users[userId].folders = {};
  const id = generateId();
  const folder = {
    id,
    ...folderData,
    created_at: timestamp(),
    updated_at: timestamp(),
    items: {},
  };
  users[userId].folders[id] = folder;
  return folder;
}

export function updateFolder(userId, folderId, updates) {
  const folder = users[userId]?.folders?.[folderId];
  if (!folder) return false;
  const { items, ...rest } = updates;
  users[userId].folders[folderId] = { ...folder, ...rest, updated_at: timestamp(), items: folder.items || {} };
  return true;
}

export function deleteFolder(userId, folderId) {
  const folder = users[userId]?.folders?.[folderId];
  if (!folder) return false;
  delete users[userId].folders[folderId];
  return true;
}

// ----- Items (root and inside folders) -----
function getItemLocation(userId, itemId, folderId) {
  if (folderId) {
    const folder = users[userId]?.folders?.[folderId];
    return folder?.items?.[itemId] ? { folderId, inFolder: true } : null;
  }
  return users[userId]?.items?.[itemId] ? { folderId: null, inFolder: false } : null;
}

export function createItem(userId, folderId, itemData) {
  if (!users[userId]) users[userId] = { folders: {}, items: {} };
  const id = generateId();
  const item = {
    id,
    ...itemData,
    folderId: folderId || null,
    created_at: timestamp(),
    updated_at: timestamp(),
  };
  if (folderId) {
    if (!users[userId].folders[folderId]) users[userId].folders[folderId] = { id: folderId, items: {} };
    if (!users[userId].folders[folderId].items) users[userId].folders[folderId].items = {};
    users[userId].folders[folderId].items[id] = item;
  } else {
    if (!users[userId].items) users[userId].items = {};
    users[userId].items[id] = item;
  }
  return item;
}

export function getAllItems(userId) {
  const list = [];
  const u = users[userId];
  if (!u) return list;
  if (u.items) {
    list.push(...Object.values(u.items));
  }
  if (u.folders) {
    for (const folder of Object.values(u.folders)) {
      if (folder.items) list.push(...Object.values(folder.items));
    }
  }
  return list;
}

export function updateItem(userId, itemId, newFolderId, currentFolderId, updates) {
  const u = users[userId];
  if (!u) return false;
  let item = null;
  if (currentFolderId && u.folders?.[currentFolderId]?.items?.[itemId]) {
    item = u.folders[currentFolderId].items[itemId];
    delete u.folders[currentFolderId].items[itemId];
  } else if (u.items?.[itemId]) {
    item = u.items[itemId];
    delete u.items[itemId];
  }
  if (!item) return false;
  const merged = { ...item, ...updates, id: itemId, updated_at: timestamp(), folderId: newFolderId || null };
  if (newFolderId) {
    if (!u.folders[newFolderId]) u.folders[newFolderId] = { id: newFolderId, items: {} };
    if (!u.folders[newFolderId].items) u.folders[newFolderId].items = {};
    u.folders[newFolderId].items[itemId] = merged;
  } else {
    if (!u.items) u.items = {};
    u.items[itemId] = merged;
  }
  return true;
}

export function deleteItem(userId, itemId, folderId) {
  const u = users[userId];
  if (!u) return false;
  if (folderId && u.folders?.[folderId]?.items?.[itemId]) {
    delete u.folders[folderId].items[itemId];
    return true;
  }
  if (u.items?.[itemId]) {
    delete u.items[itemId];
    return true;
  }
  return false;
}
