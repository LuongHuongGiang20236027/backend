import { pool } from "../config/database.js";

class Document {

  // Lấy tất cả documents
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

  // Lấy document theo id
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

  // Lấy document theo người tạo
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

    // Trả về mảng document
    return result.rows;
  }

  // Tạo document mới
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

  // Xoá document
  static async delete(id) {
    await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
  }

  // Thích / bỏ thích tài liệu
  static async toggleLike(documentId, userId) {
    // Kiểm tra đã thích chưa
    const check = await pool.query(
      `SELECT id FROM document_likes WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId]
    );

    // Nếu đã thích thì bỏ thích
    if (check.rowCount > 0) {
      await pool.query(
        `DELETE FROM document_likes WHERE document_id = $1 AND user_id = $2`,
        [documentId, userId]
      );
      // Trả về false là đã bỏ thích
      return false;
    } else {
      // Chưa thích thì thêm thích
      await pool.query(
        `INSERT INTO document_likes (document_id, user_id) VALUES ($1, $2)`,
        [documentId, userId]
      );
      // Trả về true là đã thích
      return true;
    }
  }

  // Kiểm tra user đã thích tài liệu chưa
  static async isLikedByUser(documentId, userId) {
    const result = await pool.query(
      `SELECT 1
     FROM document_likes
     WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId]
    )

    return result.rowCount > 0
  }

  // Lấy danh sách tài liệu đã thích của user
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

  // Tìm kiếm tài liệu theo từ khoá// 🔍 Tìm kiếm tài liệu (không phân biệt hoa/thường + không cần gõ dấu)
  static async search(q) {
    const result = await pool.query(
      `
    SELECT d.*, u.name AS author_name,
      (SELECT COUNT(*) FROM document_likes WHERE document_id = d.id) AS like_count
    FROM documents d
    LEFT JOIN users u ON d.created_by = u.id
    WHERE
      unaccent(lower(coalesce(d.title, ''))) LIKE '%' || unaccent(lower($1)) || '%'
      OR unaccent(lower(coalesce(d.description, ''))) LIKE '%' || unaccent(lower($1)) || '%'
      OR unaccent(lower(coalesce(u.name, ''))) LIKE '%' || unaccent(lower($1)) || '%'
    ORDER BY d.created_at DESC
    LIMIT 50
    `,
      [q]
    )

    return result.rows
  }


}

export default Document;
