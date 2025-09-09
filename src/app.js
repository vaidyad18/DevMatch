// src/app.js
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./config/database");

// Routers
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");
const paymentRouter = require("./routes/payment");

const app = express();

/* ------------ CORS (frontend on Vercel + local dev) ------------ */
const allowedOrigins = new Set([
  "https://devmatch-io.vercel.app",
  "http://localhost:5173",
]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(cookieParser());

/* ------------ Ensure DB is ready before handling routes ------------ */
app.use(async (_req, res, next) => {
  try {
    await connectDB(); // cached singleton (see src/config/database.js)
    next();
  } catch (err) {
    console.error("DB connect error:", err?.message || err);
    return res
      .status(503)
      .json({ message: "Database unavailable. Please try again later." });
  }
});

/* ------------------------------- Routes ------------------------------- */
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);

/* ---------------------------- Health / Root --------------------------- */
app.get("/", (_req, res) => res.status(200).send("DevMatch backend OK"));
app.get("/healthz", (_req, res) => res.sendStatus(204));
app.head("/healthz", (_req, res) => res.sendStatus(204));

/* ------------------------ Export for Vercel --------------------------- */
module.exports = app;

/* -------------------- Local dev server (only local) ------------------- */
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 7777;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
