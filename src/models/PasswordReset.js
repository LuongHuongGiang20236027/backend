import { pool } from "../config/database.js";

class PasswordReset {
    static async create(userId, token, expiresAt) {
        await pool.query(
            `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
            [userId, token, expiresAt]
        );
    }

    static async findValidToken(token) {
        const result = await pool.query(
            `SELECT *
       FROM password_resets
       WHERE token = $1
         AND used = false
         AND expires_at > NOW()
       LIMIT 1`,
            [token]
        );
        return result.rows[0] || null;
    }

    static async markUsed(id) {
        await pool.query(
            `UPDATE password_resets
       SET used = true
       WHERE id = $1`,
            [id]
        );
    }
}

export default PasswordReset;
