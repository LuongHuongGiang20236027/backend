import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path"

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("❌ Missing JWT_SECRET in .env");
  process.exit(1);
}


import { testConnection } from "./src/config/database.js";

import authRoutes from "./src/routes/auth.js";
import assignmentRoutes from "./src/routes/assignments.js";
import documentRoutes from "./src/routes/documents.js";
import userRoutes from "./src/routes/user.js";
import testRoutes from "./src/routes/test.js";

const app = express();
const PORT = process.env.PORT || 8000;

// -------------------------
// Middleware
// -------------------------
app.use(cors({
  origin: [
    "http://localhost:3000",
    process.env.FRONTEND_URL
  ],
  credentials: true
}));



app.use(morgan("dev"));
app.use(express.json());

// -------------------------
// Routes
// -------------------------
app.get("/", (req, res) => {
  res.json({ message: "Backend OK!" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/test", testRoutes);




// -------------------------
// Start server
// -------------------------
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});
