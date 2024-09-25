import { ref, set, get, update, remove, push } from "firebase/database";
import { database } from "../services/firebaseConfig.js";
import { generateTimestamp } from "../helpers/helpers.js";

export const createUser = async (userId, userData) => {
  try {
    const newUser = {
      ...userData,
      created_at: generateTimestamp(),
      updated_at: generateTimestamp(),
    };
    await set(ref(database, `users/${userId}`), newUser);
    return newUser;
  } catch (error) {
    console.error(`Error creating user for userId ${userId}:`, error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

export const fetchUser = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error(`User with userId ${userId} not found`);
  } catch (error) {
    console.error(`Error fetching user for userId ${userId}:`, error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    const updates = {
      ...updatedData,
      updated_at: generateTimestamp(),
    };
    await update(ref(database, `users/${userId}`), updates);
  } catch (error) {
    console.error(`Error updating user for userId ${userId}:`, error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

export const removeUser = async (userId) => {
  try {
    await remove(ref(database, `users/${userId}`));
  } catch (error) {
    console.error(`Error removing user for userId ${userId}:`, error);
    throw new Error(`Failed to remove user: ${error.message}`);
  }
};

export const createFolder = async (userId, folderData) => {
  try {
    const folderId = push(ref(database, `users/${userId}/folders`)).key;
    const newFolderData = {
      id: folderId,
      ...folderData,
      created_at: generateTimestamp(),
      updated_at: generateTimestamp(),
    };
    await set(ref(database, `users/${userId}/folders/${folderId}`), newFolderData);
    return newFolderData;
  } catch (error) {
    console.error(`Error creating folder for userId ${userId}:`, error);
    throw new Error(`Failed to create folder: ${error.message}`);
  }
};

export const fetchFolders = async (userId) => {
  try {
    const folderRef = ref(database, `users/${userId}/folders`);
    const snapshot = await get(folderRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error(`No folders found for userId ${userId}`);
  } catch (error) {
    console.error(`Error fetching folders for userId ${userId}:`, error);
    throw new Error(`Failed to fetch folders: ${error.message}`);
  }
};

export const updateFolder = async (userId, folderId, updatedData) => {
  try {
    const updates = {
      ...updatedData,
      updated_at: generateTimestamp(),
    };
    await update(ref(database, `users/${userId}/folders/${folderId}`), updates);
  } catch (error) {
    console.error(`Error updating folder for userId ${userId}, folderId ${folderId}:`, error);
    throw new Error(`Failed to update folder: ${error.message}`);
  }
};

export const removeFolder = async (userId, folderId) => {
  try {
    await remove(ref(database, `users/${userId}/folders/${folderId}`));
  } catch (error) {
    console.error(`Error removing folder for userId ${userId}, folderId ${folderId}:`, error);
    throw new Error(`Failed to remove folder: ${error.message}`);
  }
};

export const createItem = async (userId, folderId = null, itemData) => {
  try {
    const itemId = push(ref(database, folderId ? `users/${userId}/folders/${folderId}/items` : `users/${userId}/items`)).key;
    const newItemData = {
      id: itemId,
      ...itemData,
      created_at: generateTimestamp(),
      updated_at: generateTimestamp(),
    };
    await set(ref(database, folderId ? `users/${userId}/folders/${folderId}/items/${itemId}` : `users/${userId}/items/${itemId}`), newItemData);
    return newItemData;
  } catch (error) {
    console.error(`Error creating item for userId ${userId}:`, error);
    throw new Error(`Failed to create item: ${error.message}`);
  }
};

export const fetchItems = async (userId, folderId = null) => {
  try {
    const itemRef = ref(database, folderId ? `users/${userId}/folders/${folderId}/items` : `users/${userId}/items`);
    const snapshot = await get(itemRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error(`No items found for userId ${userId}${folderId ? ` in folder ${folderId}` : ''}`);
  } catch (error) {
    console.error(`Error fetching items for userId ${userId}:`, error);
    throw new Error(`Failed to fetch items: ${error.message}`);
  }
};

export const updateItem = async (userId, itemId, folderId = null, updatedData) => {
  try {
    const updates = {
      ...updatedData,
      updated_at: generateTimestamp(),
    };
    await update(ref(database, folderId ? `users/${userId}/folders/${folderId}/items/${itemId}` : `users/${userId}/items/${itemId}`), updates);
  } catch (error) {
    console.error(`Error updating item for userId ${userId}, itemId ${itemId}:`, error);
    throw new Error(`Failed to update item: ${error.message}`);
  }
};

export const removeItem = async (userId, itemId, folderId = null) => {
  try {
    await remove(ref(database, folderId ? `users/${userId}/folders/${folderId}/items/${itemId}` : `users/${userId}/items/${itemId}`));
  } catch (error) {
    console.error(`Error removing item for userId ${userId}, itemId ${itemId}:`, error);
    throw new Error(`Failed to remove item: ${error.message}`);
  }
};