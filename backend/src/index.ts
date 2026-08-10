import "dotenv/config";
import { createApp } from "./app.js";
import { sequelize } from "./db/sequelize.js";
import "./models/index.js";

const port = Number(process.env.PORT) || 3001;

async function start() {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be set in production");
    }
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set in production");
    }
  }

  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.NODE_ENV !== "production" });

  const app = createApp();
  app.listen(port, () => {
    console.log(`Tori API running at http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
