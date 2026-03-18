/**
 * Item API tests — run against local API. Usage: node tests/testItems.js
 */
import * as api from "../src/services/api.js";

const testItemOperations = async () => {
  const email = "test-items@example.com";
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

  const created = await api.createItem(uid, null, { name: "Headphones", location: "Living Room", quantity: 2 });
  const items = await api.fetchItems(uid);
  await api.updateItem(uid, created.id, null, null, { name: "Noise-Cancelling Headphones" });
  await api.removeItem(uid, created.id, null);
  console.log("Done.");
  api.setToken(null);
};

testItemOperations().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
