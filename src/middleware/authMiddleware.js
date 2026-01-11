import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.auth_token

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" })
  }
}

export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.auth_token
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.userId = decoded.userId
    }
    next()
  } catch (error) {
    next()
  }
}
