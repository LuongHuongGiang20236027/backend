import { pool } from "../config/database.js";

class Assignment {
  // Lấy tất cả bài tập
  static async findAll() {
    const res = await pool.query(
      `SELECT a.*, u.name AS author_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       ORDER BY a.created_at DESC`
    );

    const assignments = res.rows;

    // Lấy câu hỏi kèm tất cả đáp án, không giữ is_correct
    for (let a of assignments) {
      a.questions = await this.getQuestionsWithAllAnswers(a.id, false);
    }

    return assignments;
  }

  // Lấy bài tập theo id
  static async findById(id) {
    const res = await pool.query(
      `SELECT a.*, u.name AS author_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [id]
    );
    const assignment = res.rows[0];
    if (!assignment) return null;
    // Lấy câu hỏi kèm tất cả đáp án, không giữ is_correct
    assignment.questions = await this.getQuestionsWithAllAnswers(assignment.id, false);
    return assignment;
  }

  // Lấy bài tập của một giáo viên
  static async findByCreator(userId) {
    const res = await pool.query(
      `SELECT a.*, u.name AS author_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.created_by = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );

    const assignments = res.rows;

    // Lấy câu hỏi kèm tất cả đáp án, có giữ is_correct
    for (let a of assignments) {
      a.questions = await this.getQuestionsWithAllAnswers(a.id, true);
    }

    return assignments;
  }

  // Tạo bài tập mới
  static async create({ title, description, thumbnail, total_score, created_by }) {
    const res = await pool.query(
      `INSERT INTO assignments (title, description, thumbnail, total_score, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, thumbnail, total_score, created_by]
    );
    return res.rows[0];
  }

  // Tạo câu hỏi kèm đáp án
  static async createQuestionWithAnswers({ assignment_id, content, type, score, answers }) {
    const questionRes = await pool.query(
      `INSERT INTO questions (assignment_id, content, type, score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [assignment_id, content, type, score]
    );
    const question = questionRes.rows[0];

    // Tạo đáp án
    for (let ans of answers) {
      await pool.query(
        `INSERT INTO answers (question_id, content, is_correct)
         VALUES ($1, $2, $3)`,
        [question.id, ans.content, ans.is_correct || false]
      );
    }

    return question;
  }

  // Lấy câu hỏi kèm tất cả đáp án, có thể giữ hoặc không giữ is_correct
  static async getQuestionsWithAllAnswers(assignmentId, includeCorrect) {
    const questionsRes = await pool.query(
      `SELECT * FROM questions WHERE assignment_id = $1 ORDER BY id`,
      [assignmentId]
    );
    const questions = questionsRes.rows;

    // Lấy đáp án cho từng câu hỏi
    for (let q of questions) {
      let query = 'SELECT id, content';
      // Nếu includeCorrect thì thêm is_correct vào query
      if (includeCorrect) query += ', is_correct';
      query += ' FROM answers WHERE question_id = $1 ORDER BY id';

      // Lấy đáp án
      const answersRes = await pool.query(query, [q.id]);
      q.answers = answersRes.rows;
    }

    return questions;
  }

  // Nộp bài tập
  static async submitAssignment({ assignment_id, user_id, answers_json }) {
    // answers_json: stringified array
    const answers = JSON.parse(answers_json); // [{ question_id, answer_id: [..] }]

    // 1️⃣ Tính attempt_number
    const attemptCountRes = await pool.query(
      `SELECT COUNT(*) FROM assignment_attempts WHERE assignment_id = $1 AND student_id = $2`,
      [assignment_id, user_id]
    );

    const attempt_number = parseInt(attemptCountRes.rows[0].count) + 1;

    // Biến lưu điểm tổng
    let totalScore = 0;

    // 2️⃣ Lấy câu hỏi + đáp án đúng
    const questions = await this.getQuestionsWithAllAnswers(assignment_id, true);

    // 3️⃣ So sánh câu trả lời và tính điểm
    for (let question of questions) {
      // Tìm câu trả lời của user cho câu hỏi này
      const userAnswerObj = answers.find(a => a.question_id === question.id);
      // Lấy mảng answer_id của user
      const userAnswerIds = (userAnswerObj?.answer_id || []).map(Number)
      // Lấy mảng answer_id đúng
      const correctAnswerIds = question.answers
        .filter(a => a.is_correct)
        .map(a => Number(a.id))

      // So sánh
      let isCorrect = false
      // Kiểu single hoặc multiple
      if (question.type === "single") {
        // single: đúng nếu trùng 1 đáp án đúng
        isCorrect =
          userAnswerIds.length === 1 &&
          correctAnswerIds.length === 1 &&
          userAnswerIds[0] === correctAnswerIds[0]
      } else {
        // multiple: đúng nếu trùng tất cả đáp án đúng
        isCorrect =
          userAnswerIds.length === correctAnswerIds.length &&
          userAnswerIds.every(id => correctAnswerIds.includes(id))
      }
      // Cộng điểm nếu đúng
      if (isCorrect) {
        // cộng điểm câu hỏi vào tổng điểm
        totalScore += Number(question.score)
      }

    }

    // 4️⃣ Lưu attempt
    const attemptRes = await pool.query(
      `INSERT INTO assignment_attempts (assignment_id, student_id, attempt_number, score)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
      [assignment_id, user_id, attempt_number, totalScore]
    );
    const attempt = attemptRes.rows[0];

    // 5️⃣ Lưu câu trả lời của học sinh
    for (let ans of answers) {
      // ans.answer_id có thể là single hoặc array
      const answerIds = Array.isArray(ans.answer_id) ? ans.answer_id : [ans.answer_id];
      for (let answerId of answerIds) {
        // Lưu vào bảng student_answers
        await pool.query(
          `INSERT INTO student_answers (attempt_id, question_id, answer_id)
         VALUES ($1, $2, $3)`,
          [attempt.id, ans.question_id, answerId]
        );
      }
    }

    return attempt;
  }


  // Lấy tất cả bài nộp của học sinh
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
    )

    return res.rows
  }


  // Lấy tất cả bài nộp cho một bài tập
  static async getSubmissionsByAssignment(assignmentId) {
    const res = await pool.query(
      `SELECT aa.*, u.name AS student_name
       FROM assignment_attempts aa
       LEFT JOIN users u ON aa.student_id = u.id
       WHERE aa.assignment_id = $1
       ORDER BY aa.created_at DESC`,
      [assignmentId]
    );
    return res.rows;
  }

  // Lấy 1 attempt cụ thể
  static async getSingleUserAttempt({ assignmentId, userId, attemptId }) {
    const attemptRes = await pool.query(
      `SELECT * FROM assignment_attempts
     WHERE id = $1 AND assignment_id = $2 AND student_id = $3`,
      [attemptId, assignmentId, userId]
    )
    const attempt = attemptRes.rows[0]
    if (!attempt) return null

    // Lấy câu hỏi + đáp án có is_correct
    const questions = await this.getQuestionsWithAllAnswers(assignmentId, true)

    // Lấy câu trả lời học sinh
    const studentAnswersRes = await pool.query(
      `SELECT question_id, answer_id FROM student_answers WHERE attempt_id = $1`,
      [attempt.id]
    )
    const studentAnswers = studentAnswersRes.rows

    attempt.questions = questions.map(q => {
      const userAnsForQ = studentAnswers
        .filter(sa => sa.question_id === q.id)
        .map(sa => sa.answer_id)

      const correctAnswerIds = q.answers.filter(a => a.is_correct).map(a => a.id)

      let isCorrect = false
      if (q.type === "single") {
        isCorrect =
          userAnsForQ.length === 1 &&
          correctAnswerIds.length === 1 &&
          userAnsForQ[0] === correctAnswerIds[0]
      } else {
        isCorrect =
          userAnsForQ.length === correctAnswerIds.length &&
          userAnsForQ.every(id => correctAnswerIds.includes(id))
      }

      return {
        ...q,
        user_answer_ids: userAnsForQ,
        isCorrect,
      }
    })

    // Gán thông tin assignment
    attempt.assignment_title = questions[0]?.assignment_title || "Bài tập"
    attempt.total_score = questions.reduce((acc, q) => acc + Number(q.score), 0)

    return attempt
  }


  // Xoá bài tập (PostgreSQL + transaction)
  static async deleteById(id) {
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      await client.query(
        `DELETE FROM student_answers
       WHERE attempt_id IN (
         SELECT id FROM assignment_attempts WHERE assignment_id = $1
       )`,
        [id]
      )

      await client.query(
        `DELETE FROM assignment_attempts WHERE assignment_id = $1`,
        [id]
      )

      await client.query(
        `DELETE FROM answers
       WHERE question_id IN (
         SELECT id FROM questions WHERE assignment_id = $1
       )`,
        [id]
      )

      await client.query(
        `DELETE FROM questions WHERE assignment_id = $1`,
        [id]
      )

      const result = await client.query(
        `DELETE FROM assignments WHERE id = $1`,
        [id]
      )

      await client.query("COMMIT")
      return result.rowCount // để controller biết có xóa thật hay không
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  }

}

export default Assignment;
