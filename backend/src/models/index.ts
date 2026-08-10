import { User } from "./User.js";
import { Household } from "./Household.js";
import { HouseholdMember } from "./HouseholdMember.js";
import { RefreshToken } from "./RefreshToken.js";
import { PasswordResetToken } from "./PasswordResetToken.js";
import { Folder } from "./Folder.js";
import { Item } from "./Item.js";

User.hasMany(HouseholdMember, { foreignKey: "userId", onDelete: "CASCADE" });
HouseholdMember.belongsTo(User, { foreignKey: "userId" });

Household.hasMany(HouseholdMember, { foreignKey: "householdId", onDelete: "CASCADE" });
HouseholdMember.belongsTo(Household, { foreignKey: "householdId" });

User.hasMany(Household, { foreignKey: "ownerId", as: "ownedHouseholds" });
Household.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

User.hasMany(RefreshToken, { foreignKey: "userId", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

User.hasMany(PasswordResetToken, { foreignKey: "userId", onDelete: "CASCADE" });
PasswordResetToken.belongsTo(User, { foreignKey: "userId" });

Household.hasMany(Folder, { foreignKey: "householdId", onDelete: "CASCADE" });
Folder.belongsTo(Household, { foreignKey: "householdId" });

Household.hasMany(Item, { foreignKey: "householdId", onDelete: "CASCADE" });
Item.belongsTo(Household, { foreignKey: "householdId" });

Folder.hasMany(Item, { foreignKey: "folderId", onDelete: "CASCADE" });
Item.belongsTo(Folder, { foreignKey: "folderId" });

export {
  User,
  Household,
  HouseholdMember,
  RefreshToken,
  PasswordResetToken,
  Folder,
  Item,
};
