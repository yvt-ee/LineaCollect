// config/database.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env from project root (../.env relative to /config)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ✅ Detect hosted/production (Render or DATABASE_URL)
const isHosted =
  process.env.DATABASE_URL ||
  (process.env.PGHOST && process.env.PGHOST.includes("render.com")) ||
  process.env.NODE_ENV === "production";

let poolConfig;

if (process.env.DATABASE_URL) {
  // 🌐 Prefer single connection string if provided
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isHosted ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 30000,
    max: 5,
  };
} else {
  // 🖥 Local / manual config
  poolConfig = {
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "lineacollect",
    ssl: isHosted ? { rejectUnauthorized: false } : false, // 🔑 no SSL locally, SSL on Render
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 30000,
    max: 10,
  };
}

export const pool = new Pool(poolConfig);

// Tiny log (no password)
console.log(
  "Connecting to",
  poolConfig.host || "DATABASE_URL",
  "as",
  poolConfig.user || "N/A",
  `ssl=${poolConfig.ssl && poolConfig.ssl !== false}`
);
