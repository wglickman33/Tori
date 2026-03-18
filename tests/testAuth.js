/**
 * Auth tests — run against local API (server must be running).
 * Usage: node tests/testAuth.js
 */
import * as api from "../src/services/api.js";

const testAuthOperations = async () => {
  const email = "test-auth@example.com";
  const password = "testPass123";

  console.log("Registering user...");
  try {
    const data = await api.apiRegister(email, password, "Test User");
    console.log("User registered:", data.user);
    api.setToken(data.token);
  } catch (error) {
    if (error.message.includes("already in use")) {
      console.log("User exists, logging in...");
      const data = await api.apiLogin(email, password);
      api.setToken(data.token);
      console.log("User logged in:", data.user);
    } else {
      throw error;
    }
  }

  console.log("Getting /me...");
  const me = await api.apiMe();
  console.log("Current user:", me);

  console.log("Clearing token (logout)...");
  api.setToken(null);
  console.log("Done.");
};

testAuthOperations().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
