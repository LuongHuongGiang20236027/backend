import jwt from "jsonwebtoken"

export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (authHeader?.startsWith("Bearer ")) {
        try {
            const token = authHeader.split(" ")[1]
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.userId = decoded.id
        } catch (e) {
            // token sai thì coi như chưa đăng nhập
        }
    }

    next()
}
