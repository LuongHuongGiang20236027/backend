// routes/testRoute.js
import { Router } from "express";
import { pool } from "../config/database.js";

const router = Router();

router.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ status: "ok", serverTime: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
