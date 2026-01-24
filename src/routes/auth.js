import express from "express";
import { register, login, getCurrentUser, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
// Đăng ký
router.post("/register", register);
// Đăng nhập
router.post("/login", login);
// Lấy thông tin user hiện tại
router.get("/me", authMiddleware, getCurrentUser);
// Đăng xuất
router.post("/logout", logout);

export default router;
