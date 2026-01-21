import User from "../models/User.js";
// Thư viện mã hóa mật khẩu
import bcrypt from "bcrypt";


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
