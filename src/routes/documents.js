import express from "express"
import {
  getAllDocuments,
  getDocumentById,
  getMyDocuments,
  getLikedDocuments,
  createDocument,
  deleteDocument,
  toggleLike,
  downloadDocument,
  searchDocuments,
} from "../controllers/documentController.js"

// Middleware xác thực
import { authMiddleware } from "../middleware/authMiddleware.js"
// Middleware xử lý upload
import { upload } from "../middleware/uploadMiddleware.js"
import { optionalAuth } from "../middleware/optionalAuth.js"

const router = express.Router()
// Lấy tất cả tài liệu
router.get("/", getAllDocuments)
// Lấy tài liệu của giáo viên hiện tại
router.get("/my-documents", authMiddleware, getMyDocuments)
// Lấy tài liệu đã thích của user
router.get("/liked", authMiddleware, getLikedDocuments)
// Tìm kiếm tài liệu
router.get("/search", searchDocuments)
// Lấy tài liệu theo id (có thể không đăng nhập)
router.get("/:id", optionalAuth, getDocumentById)
// Tạo tài liệu mới, chỉ giáo viên mới được tạo
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createDocument
)
// Tải tài liệu, cần đăng nhập
router.get(
  "/:id/download",
  authMiddleware,
  downloadDocument
);
// Xoá tài liệu, chỉ giáo viên mới được xoá
router.delete("/:id", authMiddleware, deleteDocument)
// Thích / bỏ thích tài liệu, cần đăng nhập
router.post("/like", authMiddleware, toggleLike)

export default router
