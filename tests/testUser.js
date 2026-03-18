/**
 * User API tests — run against local API with a valid token.
 * Usage: node tests/testUser.js
 */
import * as api from "../src/services/api.js";

const testUserOperations = async () => {
  const email = "test-user@example.com";
  const password = "testPass123";
  let uid;

  try {
    const data = await api.apiRegister(email, password, "Test User");
    api.setToken(data.token);
    uid = data.user.uid;
  } catch (e) {
    const data = await api.apiLogin(email, password);
    api.setToken(data.token);
    uid = data.user.uid;
  }

  console.log("Creating/updating user profile...");
  await api.createUser(uid, { displayName: "Test User" });
  console.log("Fetching user...");
  const user = await api.fetchUser(uid);
  console.log("Fetched user:", user);
  api.setToken(null);
  console.log("Done.");
};

testUserOperations().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
