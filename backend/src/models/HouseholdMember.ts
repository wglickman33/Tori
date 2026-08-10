import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { sequelize } from "../db/sequelize.js";

export type HouseholdRole = "owner" | "member";

export class HouseholdMember extends Model<
  InferAttributes<HouseholdMember>,
  InferCreationAttributes<HouseholdMember>
> {
  declare id: CreationOptional<string>;
  declare householdId: string;
  declare userId: string;
  declare role: HouseholdRole;
  declare joinedAt: CreationOptional<Date>;
}

HouseholdMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    householdId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("owner", "member"),
      allowNull: false,
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "household_members",
    updatedAt: false,
    createdAt: false,
    indexes: [
      {
        unique: true,
        fields: ["householdId", "userId"],
      },
    ],
  }
);
