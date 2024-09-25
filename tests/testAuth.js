import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../src/services/firebaseConfig.js";

const testAuthOperations = async () => {
  const email = "willglickman@gmail.com";
  const password = "123qwE";

  console.log("Logging in user...");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in successfully:", userCredential.user);
  } catch (error) {
    console.error("Error logging in user:", error.message);
  }

  console.log("Logging out user...");
  try {
    await signOut(auth);
    console.log("User logged out successfully.");
  } catch (error) {
    console.error("Error logging out user:", error.message);
  }
};

testAuthOperations().catch((error) => console.error("Error during auth operations:", error));
