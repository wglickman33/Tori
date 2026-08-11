import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import { DEFAULT_LOCATION_PRESETS } from "../constants/locations.js";
import { sequelize } from "../db/sequelize.js";

export class Household extends Model<InferAttributes<Household>, InferCreationAttributes<Household>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare inviteCode: string;
  declare ownerId: string;
  declare locationPresets: CreationOptional<string[]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Household.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    inviteCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    locationPresets: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [...DEFAULT_LOCATION_PRESETS],
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "households",
  }
);
