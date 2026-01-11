import { pool } from "../config/database.js";

class Assignment {
  // Lấy tất cả bài tập cho học sinh
  static async findAll() {
    const res = await pool.query(
      `SELECT a.*, u.name AS author_name
       FROM assignments a
       LEFT JOIN users u ON a.created_by = u.id
       ORDER BY a.created_at DESC`
    );

    const assignments = res.rows;

    // Lấy câu hỏi kèm đáp án (không show is_correct)
    for (let a of assignments) {
      a.questions = await this.getQuestionsWithAllAnswers(a.id, false);
    }

    return assignments;
  }

  // Lấy bài tập theo id cho học sinh
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

    assignment.questions = await this.getQuestionsWithAllAnswers(assignment.id, false);
    return assignment;
  }

  // Lấy bài tập theo giáo viên
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

    // Lấy câu hỏi kèm tất cả đáp án, giữ is_correct
    for (let a of assignments) {
      a.questions = await this.getQuestionsWithAllAnswers(a.id, true);
    }

    return assignments;
  }

  // Tạo assignment
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

    for (let ans of answers) {
      await pool.query(
        `INSERT INTO answers (question_id, content, is_correct)
         VALUES ($1, $2, $3)`,
        [question.id, ans.content, ans.is_correct || false]
      );
    }

    return question;
  }

  // Lấy câu hỏi + đáp án
  static async getQuestionsWithAllAnswers(assignmentId, includeCorrect) {
    const questionsRes = await pool.query(
      `SELECT * FROM questions WHERE assignment_id = $1 ORDER BY id`,
      [assignmentId]
    );
    const questions = questionsRes.rows;

    for (let q of questions) {
      let query = 'SELECT id, content';
      if (includeCorrect) query += ', is_correct';
      query += ' FROM answers WHERE question_id = $1 ORDER BY id';

      const answersRes = await pool.query(query, [q.id]);
      q.answers = answersRes.rows;
    }

    return questions;
  }

  // Submit bài tập (class Assignment)
  static async submitAssignment({ assignment_id, user_id, answers_json }) {
    const answers = JSON.parse(answers_json); // [{ question_id, answer_id: [..] }]

    // 1️⃣ Tạo attempt mới
    const attemptCountRes = await pool.query(
      `SELECT COUNT(*) FROM assignment_attempts WHERE assignment_id = $1 AND student_id = $2`,
      [assignment_id, user_id]
    );
    const attempt_number = parseInt(attemptCountRes.rows[0].count) + 1;

    // Tạm score = 0, sẽ tính sau
    let totalScore = 0;

    // 2️⃣ Lấy tất cả câu hỏi + đáp án đúng
    const questions = await this.getQuestionsWithAllAnswers(assignment_id, true);

    // 3️⃣ Tính điểm
    for (let question of questions) {
      const userAnswerObj = answers.find(a => a.question_id === question.id);
      const userAnswerIds = (userAnswerObj?.answer_id || []).map(Number)

      const correctAnswerIds = question.answers
        .filter(a => a.is_correct)
        .map(a => Number(a.id))


      let isCorrect = false

      if (question.type === "single") {
        isCorrect =
          userAnswerIds.length === 1 &&
          correctAnswerIds.length === 1 &&
          userAnswerIds[0] === correctAnswerIds[0]
      } else {
        // multiple: đủ – không thiếu – không thừa – không quan tâm thứ tự
        isCorrect =
          userAnswerIds.length === correctAnswerIds.length &&
          userAnswerIds.every(id => correctAnswerIds.includes(id))
      }

      if (isCorrect) {
        totalScore += Number(question.score)
      }

    }


    // 4️⃣ Tạo attempt với score đúng
    const attemptRes = await pool.query(
      `INSERT INTO assignment_attempts (assignment_id, student_id, attempt_number, score)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
      [assignment_id, user_id, attempt_number, totalScore]
    );
    const attempt = attemptRes.rows[0];

    // 5️⃣ Lưu student_answers
    for (let ans of answers) {
      const answerIds = Array.isArray(ans.answer_id) ? ans.answer_id : [ans.answer_id];
      for (let answerId of answerIds) {
        await pool.query(
          `INSERT INTO student_answers (attempt_id, question_id, answer_id)
         VALUES ($1, $2, $3)`,
          [attempt.id, ans.question_id, answerId]
        );
      }
    }

    return attempt;
  }


  // Lấy tất cả bài nộp của một học sinh
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

  // Lấy câu hỏi + đáp án **không kèm is_correct** (dành cho học sinh)
  static async getQuestionsForStudent(assignmentId) {
    const questionsRes = await pool.query(
      `SELECT id, content AS question_text, type AS question_type, score
     FROM questions
     WHERE assignment_id = $1
     ORDER BY id`,
      [assignmentId]
    );
    const questions = questionsRes.rows;

    for (let q of questions) {
      const answersRes = await pool.query(
        `SELECT id, content AS option_text
       FROM answers
       WHERE question_id = $1
       ORDER BY id`,
        [q.id]
      );
      q.options = answersRes.rows; // frontend dùng q.options
    }

    return questions;
  }

  // Lấy bài tập theo id cho học sinh (chỉ câu hỏi + đáp án, không show is_correct)
  static async findByIdForStudent(id) {
    const res = await pool.query(
      `SELECT a.*, u.name AS author_name
     FROM assignments a
     LEFT JOIN users u ON a.created_by = u.id
     WHERE a.id = $1`,
      [id]
    );

    const assignment = res.rows[0];
    if (!assignment) return null;

    // Lấy câu hỏi + đáp án dành cho học sinh
    assignment.questions = await this.getQuestionsForStudent(assignment.id);

    return assignment;
  }


}

export default Assignment;
