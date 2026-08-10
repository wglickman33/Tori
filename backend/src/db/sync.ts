import "dotenv/config";
import { sequelize } from "./sequelize.js";
import "../models/index.js";

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log("Database synced");
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
