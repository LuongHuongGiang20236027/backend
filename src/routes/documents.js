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
} from "../controllers/documentController.js"

import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware.js"
import { upload } from "../middleware/uploadMiddleware.js"

const router = express.Router()

router.get("/", getAllDocuments)
router.get("/my-documents", authMiddleware, getMyDocuments)
router.get("/liked", authMiddleware, getLikedDocuments)
router.get("/:id", optionalAuthMiddleware, getDocumentById)

/**
 * ✅ CHỈ GIÁO VIÊN ĐƯỢC TẠO
 * file: PDF
 * thumbnail: image
 */
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createDocument
)

// GET /api/documents/:id/download
router.get(
  "/:id/download",
  authMiddleware, // chỉ người đã login mới tải
  downloadDocument
);


router.delete("/:id", authMiddleware, deleteDocument)
router.post("/like", authMiddleware, toggleLike)

export default router
