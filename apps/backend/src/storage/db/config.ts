import { z } from "zod";

const DatabaseConfigSchema = z.object({
  MYSQL_HOST: z.string().min(1).default("127.0.0.1"),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_DATABASE: z.string().min(1).default("plated"),
  MYSQL_USER: z.string().min(1).default("plated"),
  MYSQL_PASSWORD: z.string().default(""),
});

const parsed = DatabaseConfigSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid database configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const databaseConfig = {
  host: parsed.data.MYSQL_HOST,
  port: parsed.data.MYSQL_PORT,
  database: parsed.data.MYSQL_DATABASE,
  user: parsed.data.MYSQL_USER,
  password: parsed.data.MYSQL_PASSWORD,
};
