import { pool } from "../config/database.js";

class Document {
  static async findAll() {
    const result = await pool.query(
      `SELECT d.*, u.name AS author_name,
        (SELECT COUNT(*) FROM document_likes WHERE document_id = d.id) AS like_count
       FROM documents d
       LEFT JOIN users u ON d.created_by = u.id
       ORDER BY d.created_at DESC`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT d.*, u.name AS author_name,
        (SELECT COUNT(*) FROM document_likes WHERE document_id = d.id) AS like_count
       FROM documents d
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCreator(createdBy) {
    const result = await pool.query(
      `SELECT d.*, u.name AS author_name,
            (SELECT COUNT(*) FROM document_likes WHERE document_id = d.id) AS like_count
     FROM documents d
     LEFT JOIN users u ON d.created_by = u.id
     WHERE d.created_by = $1
     ORDER BY d.created_at DESC`,
      [createdBy]
    );

    // ✅ TRẢ VỀ ARRAY
    return result.rows;
  }



  static async create(data) {
    const { title, description, file_url, thumbnail, created_by } = data;
    const result = await pool.query(
      `INSERT INTO documents (title, description, file_url, thumbnail, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, file_url, thumbnail || null, created_by]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
  }

  static async toggleLike(documentId, userId) {
    const check = await pool.query(
      `SELECT id FROM document_likes WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId]
    );

    if (check.rowCount > 0) {
      await pool.query(
        `DELETE FROM document_likes WHERE document_id = $1 AND user_id = $2`,
        [documentId, userId]
      );
      return false;
    } else {
      await pool.query(
        `INSERT INTO document_likes (document_id, user_id) VALUES ($1, $2)`,
        [documentId, userId]
      );
      return true;
    }
  }

  static async isLikedByUser(documentId, userId) {
    const result = await pool.query(
      `SELECT 1
     FROM document_likes
     WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId]
    )

    return result.rowCount > 0
  }

  static async findLikedByUser(userId) {
    const result = await pool.query(
      `SELECT d.*, u.name AS author_name,
        (SELECT COUNT(*) FROM document_likes WHERE document_id = d.id) AS like_count
     FROM document_likes dl
     JOIN documents d ON dl.document_id = d.id
     LEFT JOIN users u ON d.created_by = u.id
     WHERE dl.user_id = $1
     ORDER BY dl.created_at DESC`,
      [userId]
    )

    return result.rows
  }


}

export default Document;
