import express from "express"
import {
  getAllAssignments,
  getAssignmentById,
  getMyAssignments,
  createAssignment,
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  getAssignmentByIdForStudent,
} from "../controllers/assignmentController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/", getAllAssignments)
router.get("/my-assignments", authMiddleware, getMyAssignments)
router.get("/my-submissions", authMiddleware, getMySubmissions)
router.get("/:id", getAssignmentById)
// Lấy bài tập + câu hỏi + đáp án (học sinh) nhưng không show đáp án đúng
router.get("/:id/student", getAssignmentByIdForStudent)

router.get("/:id/submissions", authMiddleware, getAssignmentSubmissions)
import { upload } from "../middleware/uploadMiddleware.js"

router.post(
  "/",
  authMiddleware,
  upload.single("thumbnail"), // 🔥 BẮT BUỘC
  createAssignment
)

router.post("/submit", authMiddleware, submitAssignment)

export default router
