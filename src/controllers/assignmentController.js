import Assignment from "../models/Assignment.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";

// =============================
// LẤY TẤT CẢ BÀI TẬP
// =============================
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findAll();
    res.json({ assignments });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =============================
// LẤY BÀI TẬP THEO ID
// =============================
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ assignment });
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =============================
// LẤY BÀI TẬP CỦA GIÁO VIÊN
// =============================
export const getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findByCreator(req.userId);
    res.json({ assignments });
  } catch (error) {
    console.error("Get my assignments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =============================
// TẠO BÀI TẬP MỚI
// =============================
export const createAssignment = async (req, res) => {
  try {
    let {
      title,
      description,
      total_score,
      questions,
      start_time,
      end_time,
      time_limit,
      max_attempts,
    } = req.body;

    if (typeof questions === "string") {
      questions = JSON.parse(questions);
    }

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let thumbnail = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "assignments/thumbnails",
        "image"
      );
      thumbnail = result.secure_url;
    }

    const assignment = await Assignment.create({
      title,
      description,
      thumbnail,
      total_score,
      created_by: req.userId,
      start_time: start_time ? new Date(start_time) : null,
      end_time: end_time ? new Date(end_time) : null,
      time_limit: time_limit ? Number(time_limit) : null,
      max_attempts: max_attempts ? Number(max_attempts) : 1,
    });

    for (let q of questions) {
      await Assignment.createQuestionWithAnswers({
        assignment_id: assignment.id,
        content: q.content,
        type: q.type,
        score: q.score,
        answers: q.answers,
      });
    }

    res.status(201).json({ assignment });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// =============================
// BẮT ĐẦU LÀM BÀI
// =============================
export const startAssignment = async (req, res) => {
  try {
    const user_id = req.userId;
    const { assignment_id } = req.body;

    if (!assignment_id) {
      return res
        .status(400)
        .json({ error: "assignment_id là bắt buộc" });
    }

    const attempt = await Assignment.startAttempt({
      assignment_id: Number(assignment_id),
      user_id: Number(user_id),
    });

    res.json({ attempt });
  } catch (error) {
    console.error("Start assignment error:", error);
    res.status(400).json({ error: error.message });
  }
};

// =============================
// NỘP BÀI
// =============================
export const submitAssignment = async (req, res) => {
  try {
    const user_id = req.userId;
    const { assignment_id, answers } = req.body;

    if (!assignment_id || !answers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const attempt = await Assignment.submitAssignment({
      assignment_id: Number(assignment_id),
      user_id: Number(user_id),
      answers_json: JSON.stringify(answers),
    });

    return res.json({
      submission: attempt,
      score: attempt.score,
      total_questions: answers.length,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);

    // Lỗi nghiệp vụ (hết giờ, hết hạn, quá lượt)
    return res.status(400).json({
      error: error.message || "Submit failed",
    });
  }
};

// =============================
// LẤY BÀI ĐÃ NỘP CỦA USER
// =============================
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Assignment.getUserSubmissions(req.userId);
    res.json({ submissions });
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =============================
// LẤY TẤT CẢ BÀI NỘP CỦA 1 BÀI
// =============================
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const submissions = await Assignment.getSubmissionsByAssignment(id);
    res.json({ submissions });
  } catch (error) {
    console.error("Get assignment submissions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =============================
// LẤY KẾT QUẢ 1 ATTEMPT
// =============================
export const getUserAttemptResult = async (req, res) => {
  try {
    const { id: assignmentId, attemptId } = req.params;
    const userId = req.userId;

    if (!assignmentId || !attemptId) {
      return res
        .status(400)
        .json({ error: "assignmentId và attemptId là bắt buộc" });
    }

    const attempt = await Assignment.getSingleUserAttempt({
      assignmentId: Number(assignmentId),
      userId: Number(userId),
      attemptId: Number(attemptId),
    });

    if (!attempt) {
      return res.status(404).json({ error: "Attempt không tồn tại" });
    }

    res.json({ attempt });
  } catch (error) {
    console.error("Get user attempt result error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =============================
// XOÁ BÀI TẬP
// =============================
export const deleteAssignment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.userId);
    const userRole = req.userRole;

    if (!id) {
      return res.status(400).json({ error: "Invalid assignment id" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (
      Number(assignment.created_by) !== userId &&
      userRole !== "admin"
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const deletedCount = await Assignment.deleteById(id);

    if (!deletedCount) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
