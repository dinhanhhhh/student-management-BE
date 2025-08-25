// app.js (CommonJS) – Express 5 & Render safe
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

// 1) ENV
dotenv.config();

const app = express();

// 2) Proxy (Render/nginx...)
app.set("trust proxy", 1); // cần cho IP thật & rate-limit khi sau proxy

// 3) Security & parsers
app.use(
  helmet({
    crossOriginResourcePolicy: false, // tránh chặn Swagger/UI hoặc asset cross-origin
  })
);

// CORS: 1 origin (ENV) hoặc mở * khi test
const FE_ORIGIN = process.env.FE_ORIGIN || "*";
app.use(
  cors({
    origin: FE_ORIGIN,
    credentials: true,
  })
);

// KHÔNG cần app.options("*", ...) — cors middleware sẽ tự handle OPTIONS
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// 4) Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// 5) Rate limit riêng cho login
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20,
  standardHeaders: true,
});
app.use("/api/auth/login", loginLimiter);

// 6) Routes (CHỈ base path tĩnh, không dùng *, (.*), (v1)? ...)
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/classes", require("./routes/class.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/scores", require("./routes/score.routes"));

// (tuỳ chọn) route gốc để khỏi 404 khi vào domain
app.get("/", (req, res) => {
  res.json({
    message: "Student Management API is running",
    docs: "/docs",
    health: "/health",
  });
});

// 7) Swagger (đảm bảo ./docs/swagger mount vào '/docs' — KHÔNG phải '/')
require("./docs/swagger")(app);

// 8) 404 (không truyền path — tránh wildcard '*')
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// 9) Error handler cuối
app.use(errorHandler);

// 10) Start: chỉ listen khi DB đã sẵn sàng
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server on ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect DB:", err);
    process.exit(1);
  }
})();
