import knex from "knex";
// eslint-disable-next-line no-restricted-imports -- Knex config convention requested for this module.
import config from "../knexfile.js";

// Create one shared database connection-pool instance.
const db = knex(config);

// Initialize database with migrations and seeds.
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("Running migrations...");
    await db.migrate.latest();

    console.log("Running seeds...");
    await db.seed.run();

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

export default db;
