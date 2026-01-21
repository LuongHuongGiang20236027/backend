import User from "../models/User.js";
// Thư viện mã hóa mật khẩu
import bcrypt from "bcrypt";

import crypto from "crypto";
import PasswordReset from "../models/PasswordReset.js";
import { sendResetMail } from "../utils/mailer.js";

// Cập nhật thông tin cá nhân
export const updateProfile = async (req, res) => {
  try {
    const { name, gender, birth_date } = req.body
    // Xử lý avatar nếu có
    const avatar = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`
      : undefined

    // Cập nhật thông tin user
    const updatedUser = await User.update(req.userId, {
      name,
      avatar,
      gender,
      birth_date,
    })
    // Trả về thông tin user đã cập nhật
    return res.json({ user: updatedUser })
  } catch (error) {
    console.error("Update profile error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Đổi mật khẩu
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // Kiểm tra dữ liệu đầu vào
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Lấy user từ DB
    const user = await User.findByIdWithPassword(req.userId);
    // Kiểm tra user tồn tại
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Kiểm tra mật khẩu hiện tại
    const isValid = await bcrypt.compare(
      currentPassword.trim(),// tránh lỗi khoảng trắng
      user.password
    );
    // Nếu mật khẩu không đúng
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    // Mã hóa mật khẩu mới và cập nhật
    const newHash = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.userId, newHash);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findByEmail(email)

    // Không tiết lộ email có tồn tại hay không
    if (!user) {
      return res.json({ success: true })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 15 * 60 * 1000)

    await PasswordReset.create(user.id, token, expires)

    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    await sendResetMail(user.email, link)

    res.json({
      success: true,
      message: "Email reset đã được gửi"
    })
  } catch (err) {
    console.error("Forgot password error:", err)
    res.status(500).json({ error: "Server error" })
  }
}


export const resetPasswordByToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const reset = await PasswordReset.findValidToken(token);
    if (!reset) {
      return res.status(400).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await User.updatePassword(reset.user_id, hash);
    await PasswordReset.markUsed(reset.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
