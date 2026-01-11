import User from "../models/User.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export const register = async (req, res) => {
  try {
    const { email, password, confirmPassword, name, role, gender, birth_date } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword, // dùng key "password"
      name,                     // dùng key "name"
      role: role || "student",
      gender,
      birth_date,
    })

    // Generate token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" })

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({ user: newUser })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" })
    }

    // Find user
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" })

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    const { password: _pass, ...userWithoutPassword } = user
    res.json({ user: userWithoutPassword })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    res.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const logout = (req, res) => {
  res.clearCookie("auth_token")
  res.json({ success: true })
}
