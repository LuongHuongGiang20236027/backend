import express from "express"
import {
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPasswordByToken
} from "../controllers/userController.js";

import { authMiddleware } from "../middleware/authMiddleware.js"
import { upload } from "../middleware/uploadMiddleware.js";
const router = express.Router()
// Cập nhật thông tin cá nhân
router.put("/profile", authMiddleware, upload.single("avatar"), updateProfile);
// Đổi mật khẩu
router.put("/password", authMiddleware, updatePassword);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordByToken);

export default router
