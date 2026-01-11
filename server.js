// backend/server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config(); // Load env trước

import { testConnection } from "./src/config/database.js";

// Import routes
import authRoutes from "./src/routes/auth.js";
import assignmentRoutes from "./src/routes/assignments.js";
import documentRoutes from "./src/routes/documents.js";
import userRoutes from "./src/routes/user.js";
import testRoutes from "./src/routes/test.js";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- MIDDLEWARE -------------------- */
// CORS chuẩn, hỗ trợ localhost + Vercel
const allowedOrigins = [
  "http://localhost:3000",          // local
  "https://smartedu.vercel.app",    // deploy
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman / server
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS policy blocks this origin"), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

/* ---------------------- ROUTES ----------------------- */
app.get("/", (req, res) => {
  res.json({ message: "Backend OK!" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// API groups
app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/test", testRoutes);

// Static uploads
app.use("/uploads", express.static("uploads"));

/* ------------------- START SERVER -------------------- */
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Kiểm tra DB
  await testConnection();
});
