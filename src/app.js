// src/app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");

// Routers (your existing files)
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");
const paymentRouter = require("./routes/payment");

const app = express();

/**
 * -------- CORS (frontend on Vercel + local dev) --------
 * We set headers manually so OPTIONS preflight gets the right values,
 * or you can comment this block and use the cors() line right after it.
 */
const allowedOrigins = new Set([
  "https://devmatch-io.vercel.app",
  "http://localhost:5173",
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin"); // caching correctness
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  if (req.method === "OPTIONS") {
    // Important for preflight to succeed
    return res.sendStatus(204);
  }
  next();
});

// If you prefer the package middleware instead of manual headers above,
// uncomment this and remove the manual block:
// app.use(cors({ origin: (origin, cb) => cb(null, allowedOrigins.has(origin) ? origin : false), credentials: true }));

app.use(express.json());
app.use(cookieParser());

// --------- Routes ----------
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);

// --------- Basic root/health routes ----------
app.get("/", (req, res) => {
  res.status(200).send("DevMatch backend OK");
});
app.get("/healthz", (req, res) => res.sendStatus(204));
app.head("/healthz", (req, res) => res.sendStatus(204));

// --------- DB connection (reuse across invocations) ----------
let dbReady = null;
function ensureDB() {
  if (!dbReady) {
    dbReady = connectDB()
      .then(() => console.log("Database connected successfully"))
      .catch((err) => {
        console.error("Database connection error:", err);
        // let requests still get a 500 instead of crashing the process
      });
  }
  return dbReady;
}
// Kick it off at cold start:
ensureDB();

// Export the app for Vercel serverless
module.exports = app;

// Local development: run a real server only when not on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 7777;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
