import express from "express"
import { updateProfile, updatePassword } from "../controllers/userController.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { upload } from "../middleware/uploadMiddleware.js";
const router = express.Router()

router.put("/profile", authMiddleware, upload.single("avatar"), updateProfile);
router.put("/password", authMiddleware, updatePassword);

export default router
