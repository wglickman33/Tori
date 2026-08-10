import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== "test") {
  console.warn("DATABASE_URL is not set. Set it to your Postgres connection string.");
}

export const sequelize = new Sequelize(databaseUrl || "postgresql://127.0.0.1:5432/tori", {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  dialectOptions:
    process.env.NODE_ENV === "production"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
});
