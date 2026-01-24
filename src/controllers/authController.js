import User from "../models/User.js";
import bcrypt from "bcrypt";
import { signToken } from "../config/jwt.js";

//Đăng Ký
export const register = async (req, res) => {
  try {
    const { email, password, confirmPassword, name, role, gender, birth_date } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role: role || "student",
      gender,
      birth_date,
    });

    // Tạo JWT
    const token = signToken({
      userId: newUser.id,
      role: newUser.role,
      email: newUser.email,
    });


    // Không trả password
    const { password: _pass, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: "Register success",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Đăng Nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });


    const { password: _pass, ...userWithoutPassword } = user;

    res.json({
      message: "Login success",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Lấy thông tin user hiện tại
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _pass, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Đăng xuất (chỉ client xóa token)
export const logout = (req, res) => {
  res.json({ success: true, message: "Logged out (client should delete token)" });
};
