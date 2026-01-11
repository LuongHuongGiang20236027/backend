import { pool } from "../config/database.js";

class User {
  static async findByEmail(email) {
    const result = await pool.query(
      `SELECT id, email, password, name, role, avatar, gender, birth_date, created_at
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, email, name, role, avatar, gender, birth_date, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByIdWithPassword(id) {
    const result = await pool.query(
      `SELECT id, email, password FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }


  static async create(userData) {
    const { email, password, name, role = "student", gender, birth_date } = userData;
    const result = await pool.query(
      `INSERT INTO users (email, password, name, role, gender, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, avatar, gender, birth_date, created_at`,
      [email, password, name, role, gender || null, birth_date || null]
    );
    return result.rows[0];
  }

  static async update(id, userData) {
    const { name, avatar, gender, birth_date } = userData;
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           avatar = COALESCE($2, avatar),
           gender = COALESCE($3, gender),
           birth_date = COALESCE($4, birth_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, name, role, avatar, gender, birth_date, created_at, updated_at`,
      [name, avatar, gender, birth_date, id]
    );
    return result.rows[0];
  }

  static async updatePassword(id, newHash) {
    await pool.query(
      `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newHash, id]
    );
  }
}

export default User;
