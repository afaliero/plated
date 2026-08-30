import type { Knex } from "knex";
import { databaseConfig } from "src/storage/db/config.js";

const config: Knex.Config = {
  client: "mysql2",
  connection: databaseConfig,
  pool: { min: 0, max: 10 },
  migrations: {
    directory: new URL("./db/migrations", import.meta.url).pathname,
    extension: "ts",
  },
  seeds: {
    directory: new URL("./db/seeds", import.meta.url).pathname,
    extension: "ts",
  },
};

export default config;
