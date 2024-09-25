import { createUser, fetchUser, updateUser } from "../src/services/firebaseService.js";

const testUserOperations = async () => {
  const userId = "testUser123";
  const userData = {
    username: "William Glickman",
    email: "willglickman@gmail.com",
    password: "123qwE",
  };

  try {
    const existingUser = await fetchUser(userId);
    console.log("User already exists:", existingUser);
  } catch (error) {
    if (error.message.includes("not found")) {
      console.log("Creating user...");
      const createdUser = await createUser(userId, userData);
      console.log("User created:", createdUser);
    } else {
      console.error("Error fetching user:", error);
    }
  }

  console.log("Fetching user...");
  const fetchedUser = await fetchUser(userId);
  console.log("Fetched user:", fetchedUser);
};

testUserOperations().catch((error) => console.error("Error during test operations:", error));
