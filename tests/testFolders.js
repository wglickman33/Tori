/**
 * Folder API tests — run against local API. Usage: node tests/testFolders.js
 */
import * as api from "../src/services/api.js";

const testFolderOperations = async () => {
  const email = "test-folders@example.com";
  const password = "testPass123";
  let uid;

  try {
    const data = await api.apiRegister(email, password, "Test User");
    api.setToken(data.token);
    uid = data.user.uid;
    await api.createUser(uid, { displayName: "Test User" });
  } catch (e) {
    const data = await api.apiLogin(email, password);
    api.setToken(data.token);
    uid = data.user.uid;
  }

  console.log("Creating folder...");
  const folder = await api.createFolder(uid, { name: "Personal Documents", type: "Other (Add New)" });
  console.log("Folder created:", folder.id);

  const list = await api.fetchFolders(uid);
  console.log("Fetched folders:", list.length);

  await api.updateFolder(uid, folder.id, { name: "Work Documents" });
  await api.removeFolder(uid, folder.id);
  console.log("Done.");
  api.setToken(null);
};

testFolderOperations().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
