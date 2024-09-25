import { createFolder, fetchFolders, updateFolder, removeFolder } from "../src/services/firebaseService.js";

const testFolderOperations = async () => {
  const userId = "testUser123";

  console.log("Creating folder...");
  const folderData = { name: "Personal Documents" };
  const createdFolder = await createFolder(userId, folderData);
  console.log("Folder created:", createdFolder);

  console.log("Fetching folders...");
  const fetchedFolders = await fetchFolders(userId);
  console.log("Fetched folders:", fetchedFolders);

  console.log("Updating folder...");
  const updatedFolderData = { name: "Work Documents" };
  await updateFolder(userId, createdFolder.id, updatedFolderData);
  const updatedFolders = await fetchFolders(userId);
  console.log("Updated folders:", updatedFolders);
};

testFolderOperations().catch((error) => console.error("Error during folder operations:", error));
