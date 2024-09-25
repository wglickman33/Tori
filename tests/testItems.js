import { createItem, fetchItems, updateItem, removeItem } from "../src/services/firebaseService.js";

const testItemOperations = async () => {
  const userId = "testUser123";

  console.log("Creating item without a folder...");
  const itemData = { name: "Headphones", barcode: "987654321", location: "Living Room", quantity: 2 };
  const createdItem = await createItem(userId, null, itemData);
  console.log("Item created without folder:", createdItem);

  console.log("Fetching items without folder...");
  const fetchedItems = await fetchItems(userId, null);
  console.log("Fetched items without folder:", fetchedItems);

  console.log("Updating item without folder...");
  const updatedItemData = { name: "Noise-Cancelling Headphones", location: "Bedroom" };
  await updateItem(userId, createdItem.id, null, updatedItemData);
  const updatedItems = await fetchItems(userId, null);
  console.log("Updated items without folder:", updatedItems);
};

testItemOperations().catch((error) => console.error("Error during item operations:", error));
