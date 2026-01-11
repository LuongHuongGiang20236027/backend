import Assignment from "../models/Assignment.js"

// Lấy tất cả bài tập (học sinh)
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findAll()
    res.json({ assignments })
  } catch (error) {
    console.error("Get assignments error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy bài tập theo id (học sinh)
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params
    const assignment = await Assignment.findById(id)

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" })
    }

    res.json({ assignment })
  } catch (error) {
    console.error("Get assignment error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy bài tập của giáo viên (có is_correct)
export const getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findByCreator(req.userId)
    res.json({ assignments })
  } catch (error) {
    console.error("Get my assignments error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const createAssignment = async (req, res) => {
  try {
    let { title, description, total_score, questions } = req.body

    // 🔥 parse questions
    if (typeof questions === "string") {
      questions = JSON.parse(questions)
    }

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // 🔥 lấy thumbnail đúng cách
    const thumbnail = req.file
      ? `/uploads/documents/thumbnails/${req.file.filename}`
      : null

    const assignment = await Assignment.create({
      title,
      description,
      thumbnail,
      total_score,
      created_by: req.userId,
    })

    for (let q of questions) {
      await Assignment.createQuestionWithAnswers({
        assignment_id: assignment.id,
        content: q.content,
        type: q.type,
        score: q.score,
        answers: q.answers,
      })
    }

    res.status(201).json({ assignment })
  } catch (error) {
    console.error("Create assignment error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Submit bài tập
export const submitAssignment = async (req, res) => {
  try {
    const user_id = req.userId // lấy từ authMiddleware
    const { assignment_id, answers } = req.body // answers: [{ question_id, answer_id: [...] }]

    if (!assignment_id || !answers) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Gọi model để submit
    const attempt = await Assignment.submitAssignment({
      assignment_id,
      user_id,
      answers_json: JSON.stringify(answers)
    })

    // Tính score tổng (model đã tính)
    return res.json({ submission: attempt, score: attempt.score, total_questions: answers.length })
  } catch (error) {
    console.error("Submit assignment error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy tất cả bài nộp của học sinh
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Assignment.getUserSubmissions(req.userId)
    res.json({ submissions })
  } catch (error) {
    console.error("Get submissions error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy tất cả bài nộp cho một bài tập
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params
    const submissions = await Assignment.getSubmissionsByAssignment(id)
    res.json({ submissions })
  } catch (error) {
    console.error("Get assignment submissions error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy bài tập theo id cho học sinh (không show is_correct)
export const getAssignmentByIdForStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByIdForStudent(id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ assignment });
  } catch (error) {
    console.error("Get assignment for student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
