import pg from "pg"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, "../../.env") })

const { Pool } = pg

let pool

// Cấu hình kết nối dựa trên biến môi trường
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  console.log("🌐 Using Render PostgreSQL")
} else {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })
  console.log("💻 Using Local PostgreSQL")
}

export { pool }

// Test kết nối
export const testConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW()")
    console.log("✅ Connected to PostgreSQL at:", res.rows[0].now)
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message)
  }
}
