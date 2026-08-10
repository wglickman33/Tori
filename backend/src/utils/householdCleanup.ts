import { Folder, Household, HouseholdMember, Item } from "../models/index.js";
import { deleteStoredImage } from "./imageStorage.js";

export async function destroyHouseholdData(householdId: string): Promise<void> {
  const items = await Item.findAll({ where: { householdId } });
  for (const item of items) {
    await deleteStoredImage(item.imageUrl);
  }
  await Item.destroy({ where: { householdId } });
  await Folder.destroy({ where: { householdId } });
  await HouseholdMember.destroy({ where: { householdId } });
  await Household.destroy({ where: { id: householdId } });
}
