import express from "express"
import { updateProfile, updatePassword } from "../controllers/userController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { upload } from "../middleware/uploadMiddleware.js";
const router = express.Router()
// Cập nhật thông tin cá nhân
router.put("/profile", authMiddleware, upload.single("avatar"), updateProfile);
// Đổi mật khẩu
router.put("/password", authMiddleware, updatePassword);

export default router
