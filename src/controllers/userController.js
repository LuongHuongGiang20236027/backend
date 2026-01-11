import User from "../models/User.js";
import bcrypt from "bcrypt";

export const updateProfile = async (req, res) => {
  try {
    const { name, gender, birth_date } = req.body

    const avatar = req.file
      ? `http://localhost:5000/uploads/avatars/${req.file.filename}`
      : undefined

    const updatedUser = await User.update(req.userId, {
      name,
      avatar,
      gender,
      birth_date,
    })

    return res.json({ user: updatedUser })
  } catch (error) {
    console.error("Update profile error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}


export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await User.findByIdWithPassword(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValid = await bcrypt.compare(
      currentPassword.trim(),
      user.password
    );

    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.userId, newHash);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
