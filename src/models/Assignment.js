import { pool } from "../config/database.js";

class Assignment {
  // =============================
  // LẤY TẤT CẢ BÀI TẬP
  // =============================
  static async findAll() {
    const res = await pool.query(
      `SELECT 
        a.*, 
        u.name AS author_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       ORDER BY a.created_at DESC`
    );

    const assignments = res.rows;

    for (let a of assignments) {
      a.questions = await this.getQuestionsWithAllAnswers(a.id, false);
    }

    return assignments;
  }

  // =============================
  // LẤY BÀI TẬP THEO ID
  // =============================
  static async findById(id) {
    const res = await pool.query(
      `SELECT 
        a.*, 
        u.name AS author_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [id]
    );

    const assignment = res.rows[0];
    if (!assignment) return null;

    assignment.questions = await this.getQuestionsWithAllAnswers(
      assignment.id,
      false
    );

    return assignment;
  }

  // =============================
  // LẤY BÀI TẬP CỦA GIÁO VIÊN
  // =============================
  static async findByCreator(userId) {
    const res = await pool.query(
      `SELECT 
        a.*, 
        u.name AS author_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.created_by = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );

    const assignments = res.rows;

    for (let a of assignments) {
      a.questions = await this.getQuestionsWithAllAnswers(a.id, true);
    }

    return assignments;
  }

  // =============================
  // TẠO BÀI TẬP
  // =============================
  static async create({
    title,
    description,
    thumbnail,
    total_score,
    created_by,
    start_time,
    end_time,
    time_limit,
    max_attempts,
  }) {
    const res = await pool.query(
      `INSERT INTO assignments
       (title, description, thumbnail, total_score, created_by, start_time, end_time, time_limit, max_attempts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        title,
        description,
        thumbnail,
        total_score,
        created_by,
        start_time,
        end_time,
        time_limit,
        max_attempts || 1,
      ]
    );

    return res.rows[0];
  }

  // =============================
  // BẮT ĐẦU LÀM BÀI
  // =============================
  static async startAttempt({ assignment_id, user_id }) {
    // Lấy assignment
    const assignmentRes = await pool.query(
      `SELECT start_time, end_time, max_attempts
       FROM assignments
       WHERE id = $1`,
      [assignment_id]
    );

    const assignment = assignmentRes.rows[0];
    if (!assignment) throw new Error("Không tìm thấy bài tập");

    const now = new Date();

    // Check mở bài
    if (assignment.start_time && now < assignment.start_time) {
      throw new Error("Chưa tới thời gian làm bài");
    }

    // Check hết hạn
    if (assignment.end_time && now > assignment.end_time) {
      throw new Error("Bài tập đã hết hạn");
    }

    // Check số lần làm
    const countRes = await pool.query(
      `SELECT COUNT(*)
       FROM assignment_attempts
       WHERE assignment_id = $1 AND student_id = $2`,
      [assignment_id, user_id]
    );

    const attemptCount = Number(countRes.rows[0].count);

    if (attemptCount >= assignment.max_attempts) {
      throw new Error("Bạn đã hết số lần làm bài");
    }

    const attempt_number = attemptCount + 1;

    // Tạo attempt mới
    const attemptRes = await pool.query(
      `INSERT INTO assignment_attempts
       (assignment_id, student_id, attempt_number)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [assignment_id, user_id, attempt_number]
    );

    return attemptRes.rows[0];
  }

  // =============================
  // TẠO CÂU HỎI + ĐÁP ÁN
  // =============================
  static async createQuestionWithAnswers({
    assignment_id,
    content,
    type,
    score,
    answers,
  }) {
    const questionRes = await pool.query(
      `INSERT INTO questions (assignment_id, content, type, score)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [assignment_id, content, type, score]
    );

    const question = questionRes.rows[0];

    for (let ans of answers) {
      await pool.query(
        `INSERT INTO answers (question_id, content, is_correct)
         VALUES ($1,$2,$3)`,
        [question.id, ans.content, ans.is_correct || false]
      );
    }

    return question;
  }

  // =============================
  // LẤY CÂU HỎI + ĐÁP ÁN
  // =============================
  static async getQuestionsWithAllAnswers(assignmentId, includeCorrect) {
    const questionsRes = await pool.query(
      `SELECT * FROM questions WHERE assignment_id = $1 ORDER BY id`,
      [assignmentId]
    );

    const questions = questionsRes.rows;

    for (let q of questions) {
      let query = "SELECT id, content";
      if (includeCorrect) query += ", is_correct";
      query += " FROM answers WHERE question_id = $1 ORDER BY id";

      const answersRes = await pool.query(query, [q.id]);
      q.answers = answersRes.rows;
    }

    return questions;
  }

  // =============================
  // NỘP BÀI
  // =============================
  static async submitAssignment({ assignment_id, user_id, answers_json }) {
    const answers = JSON.parse(answers_json);

    // 1️⃣ Lấy assignment
    const assignmentRes = await pool.query(
      `SELECT start_time, end_time, time_limit
       FROM assignments
       WHERE id = $1`,
      [assignment_id]
    );

    const assignment = assignmentRes.rows[0];
    if (!assignment) throw new Error("Không tìm thấy bài tập");

    const now = new Date();

    // Check hết hạn
    if (assignment.end_time && now > assignment.end_time) {
      throw new Error("Đã hết hạn nộp bài");
    }

    // 2️⃣ Lấy attempt mới nhất
    const attemptRes = await pool.query(
      `SELECT id, started_at, is_submitted
       FROM assignment_attempts
       WHERE assignment_id = $1 AND student_id = $2
       ORDER BY attempt_number DESC
       LIMIT 1`,
      [assignment_id, user_id]
    );

    const lastAttempt = attemptRes.rows[0];
    if (!lastAttempt) throw new Error("Bạn chưa bắt đầu làm bài");

    if (lastAttempt.is_submitted) {
      throw new Error("Attempt này đã được nộp");
    }

    // 3️⃣ Check hết giờ làm
    if (assignment.time_limit) {
      const startedAt = new Date(lastAttempt.started_at);
      const diffMinutes = (now - startedAt) / 60000;

      if (diffMinutes > assignment.time_limit) {
        throw new Error("Đã hết thời gian làm bài");
      }
    }

    // 4️⃣ Tính điểm
    let totalScore = 0;
    const questions = await this.getQuestionsWithAllAnswers(
      assignment_id,
      true
    );

    for (let question of questions) {
      const userAnswerObj = answers.find(
        (a) => a.question_id === question.id
      );

      const userAnswerIds = (userAnswerObj?.answer_id || []).map(Number);

      const correctAnswerIds = question.answers
        .filter((a) => a.is_correct)
        .map((a) => Number(a.id));

      let isCorrect = false;

      if (question.type === "single") {
        isCorrect =
          userAnswerIds.length === 1 &&
          correctAnswerIds.length === 1 &&
          userAnswerIds[0] === correctAnswerIds[0];
      } else {
        isCorrect =
          userAnswerIds.length === correctAnswerIds.length &&
          userAnswerIds.every((id) => correctAnswerIds.includes(id));
      }

      if (isCorrect) {
        totalScore += Number(question.score);
      }
    }

    // 5️⃣ UPDATE attempt
    const updateRes = await pool.query(
      `UPDATE assignment_attempts
       SET score = $1,
           submitted_at = NOW(),
           is_submitted = true
       WHERE id = $2
       RETURNING *`,
      [totalScore, lastAttempt.id]
    );

    const attempt = updateRes.rows[0];

    // 6️⃣ Lưu câu trả lời
    for (let ans of answers) {
      const answerIds = Array.isArray(ans.answer_id)
        ? ans.answer_id
        : [ans.answer_id];

      for (let answerId of answerIds) {
        await pool.query(
          `INSERT INTO student_answers (attempt_id, question_id, answer_id)
           VALUES ($1,$2,$3)`,
          [attempt.id, ans.question_id, answerId]
        );
      }
    }

    return attempt;
  }

  // =============================
  // LẤY BÀI ĐÃ NỘP CỦA HỌC SINH
  // =============================
  static async getUserSubmissions(userId) {
    const res = await pool.query(
      `SELECT
        aa.id,
        aa.assignment_id,
        aa.student_id,
        aa.score,
        aa.attempt_number,
        aa.created_at,
        a.title,
        a.description,
        a.total_score,
        a.thumbnail
       FROM assignment_attempts aa
       JOIN assignments a ON aa.assignment_id = a.id
       WHERE aa.student_id = $1
       ORDER BY aa.created_at DESC`,
      [userId]
    );

    return res.rows;
  }

  // =============================
  // LẤY TẤT CẢ BÀI NỘP CỦA 1 BÀI
  // =============================
  static async getSubmissionsByAssignment(assignmentId) {
    const res = await pool.query(
      `SELECT
        aa.*,
        u.name AS student_name
       FROM assignment_attempts aa
       LEFT JOIN users u ON aa.student_id = u.id
       WHERE aa.assignment_id = $1
       ORDER BY aa.created_at DESC`,
      [assignmentId]
    );

    return res.rows;
  }

  // =============================
  // LẤY 1 ATTEMPT CỤ THỂ
  // =============================
  static async getSingleUserAttempt({
    assignmentId,
    userId,
    attemptId,
  }) {
    const attemptRes = await pool.query(
      `SELECT *
       FROM assignment_attempts
       WHERE id = $1 AND assignment_id = $2 AND student_id = $3`,
      [attemptId, assignmentId, userId]
    );

    const attempt = attemptRes.rows[0];
    if (!attempt) return null;

    const questions = await this.getQuestionsWithAllAnswers(
      assignmentId,
      true
    );

    const studentAnswersRes = await pool.query(
      `SELECT question_id, answer_id
       FROM student_answers
       WHERE attempt_id = $1`,
      [attempt.id]
    );

    const studentAnswers = studentAnswersRes.rows;

    attempt.questions = questions.map((q) => {
      const userAnsForQ = studentAnswers
        .filter((sa) => sa.question_id === q.id)
        .map((sa) => sa.answer_id);

      const correctAnswerIds = q.answers
        .filter((a) => a.is_correct)
        .map((a) => a.id);

      let isCorrect = false;

      if (q.type === "single") {
        isCorrect =
          userAnsForQ.length === 1 &&
          correctAnswerIds.length === 1 &&
          userAnsForQ[0] === correctAnswerIds[0];
      } else {
        isCorrect =
          userAnsForQ.length === correctAnswerIds.length &&
          userAnsForQ.every((id) => correctAnswerIds.includes(id));
      }

      return {
        ...q,
        user_answer_ids: userAnsForQ,
        isCorrect,
      };
    });

    attempt.assignment_title = "Bài tập";
    attempt.total_score = questions.reduce(
      (acc, q) => acc + Number(q.score),
      0
    );

    return attempt;
  }

  // =============================
  // XOÁ BÀI TẬP
  // =============================
  static async deleteById(id) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM student_answers
         WHERE attempt_id IN (
           SELECT id FROM assignment_attempts
           WHERE assignment_id = $1
         )`,
        [id]
      );

      await client.query(
        `DELETE FROM assignment_attempts
         WHERE assignment_id = $1`,
        [id]
      );

      await client.query(
        `DELETE FROM answers
         WHERE question_id IN (
           SELECT id FROM questions
           WHERE assignment_id = $1
         )`,
        [id]
      );

      await client.query(
        `DELETE FROM questions
         WHERE assignment_id = $1`,
        [id]
      );

      const result = await client.query(
        `DELETE FROM assignments WHERE id = $1`,
        [id]
      );

      await client.query("COMMIT");

      return result.rowCount;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

export default Assignment;
