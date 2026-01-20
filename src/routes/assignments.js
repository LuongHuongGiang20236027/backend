// backend/src/routes/assignments.js
import express from "express"
import {
  getAllAssignments,
  getAssignmentById,
  getMyAssignments,
  createAssignment,
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  getUserAttemptResult,
  deleteAssignment,

} from "../controllers/assignmentController.js"
// Middleware xác thực
import { authMiddleware } from "../middleware/authMiddleware.js"
// Middleware xử lý upload
import { upload } from "../middleware/uploadMiddleware.js"

const router = express.Router()
// Lấy tất cả bài tập
router.get("/", getAllAssignments)
// Lấy bài tập của giáo viên hiện tại
router.get("/my-assignments", authMiddleware, getMyAssignments)
// Lấy tất cả bài nộp của học sinh
router.get("/my-submissions", authMiddleware, getMySubmissions)
// Lấy bài tập theo id
router.get("/:id", getAssignmentById)
// Lấy tất cả bài nộp cho một bài tập (giáo viên)
router.get("/:id/submissions", authMiddleware, getAssignmentSubmissions)
// Tạo bài tập mới
router.post(
  "/",
  authMiddleware,
  upload.single("thumbnail"), // xử lý thumbnail
  createAssignment
)
// Nộp bài tập
router.post("/submit", authMiddleware, submitAssignment)
router.get("/:id/result/:attemptId", authMiddleware, getUserAttemptResult)
// Xoá bài tập (chỉ giáo viên / người tạo)
router.delete("/:id", authMiddleware, deleteAssignment)
export default router
