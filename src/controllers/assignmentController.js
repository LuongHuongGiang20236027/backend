import Assignment from "../models/Assignment.js"

// Lấy tất cả bài tập
export const getAllAssignments = async (req, res) => {
  try {
    // Lấy tất cả bài tập
    const assignments = await Assignment.findAll()
    res.json({ assignments })
  } catch (error) {
    console.error("Get assignments error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy bài tập theo id
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params
    const assignment = await Assignment.findById(id)
    // Nếu không tìm thấy
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" })
    }

    res.json({ assignment })
  } catch (error) {
    console.error("Get assignment error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy bài tập của giáo viên hiện tại
export const getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findByCreator(req.userId)
    res.json({ assignments })
  } catch (error) {
    console.error("Get my assignments error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Tạo bài tập mới
export const createAssignment = async (req, res) => {
  try {
    let { title, description, total_score, questions } = req.body

    // Nếu questions là chuỗi JSON, parse nó
    if (typeof questions === "string") {
      questions = JSON.parse(questions)
    }

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Xử lý thumbnail nếu có
    const thumbnail = req.file
      ? `/uploads/documents/thumbnails/${req.file.filename}`
      : null

    // Tạo bài tập
    const assignment = await Assignment.create({
      title,
      description,
      thumbnail,
      total_score,
      created_by: req.userId,
    })

    // Tạo câu hỏi và đáp án
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

// Nộp bài tập
export const submitAssignment = async (req, res) => {
  try {
    const user_id = req.userId // lấy từ authMiddleware
    const { assignment_id, answers } = req.body // answers: [{ question_id, answer_id: [...] }]

    // Kiểm tra dữ liệu
    if (!assignment_id || !answers) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Lưu bài nộp
    const attempt = await Assignment.submitAssignment({
      assignment_id,
      user_id,
      answers_json: JSON.stringify(answers)
    })

    // 🔥 Lấy tổng điểm chuẩn từ DB
    const assignment = await Assignment.findById(assignment_id)

    const total_score =
      assignment?.questions?.reduce(
        (sum, q) => sum + Number(q.score || 0),
        0
      ) || 0

    // 🔥 Trả format chuẩn cho FE
    return res.json({
      score: Number(attempt.score || 0),
      total_score,
      submission: attempt,
    })
  } catch (error) {
    console.error("Submit assignment error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy tất cả bài nộp của user hiện tại
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Assignment.getUserSubmissions(req.userId)
    res.json({ submissions })
  } catch (error) {
    console.error("Get submissions error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy tất cả bài nộp cho một bài tập (giáo viên)
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

export const getUserAttemptResult = async (req, res) => {
  try {
    const { id: assignmentId, attemptId } = req.params
    const userId = req.userId

    if (!assignmentId || !attemptId)
      return res.status(400).json({ error: "assignmentId và attemptId là bắt buộc" })

    const attempt = await Assignment.getSingleUserAttempt({
      assignmentId: Number(assignmentId),
      userId: Number(userId),
      attemptId: Number(attemptId),
    })

    if (!attempt) return res.status(404).json({ error: "Attempt không tồn tại" })

    res.json({ attempt })
  } catch (error) {
    console.error("Get user attempt result error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Xoá bài tập
export const deleteAssignment = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const userId = Number(req.userId)
    const userRole = req.userRole

    if (!id) {
      return res.status(400).json({ error: "Invalid assignment id" })
    }

    const assignment = await Assignment.findById(id)
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" })
    }

    // Chỉ admin hoặc người tạo mới được xoá
    if (Number(assignment.created_by) !== userId && userRole !== "admin") {
      return res.status(403).json({ error: "Forbidden" })
    }

    const deletedCount = await Assignment.deleteById(id)

    if (!deletedCount) {
      return res.status(404).json({ error: "Assignment not found" })
    }

    res.json({ message: "Assignment deleted successfully" })
  } catch (error) {
    console.error("Delete assignment error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}





