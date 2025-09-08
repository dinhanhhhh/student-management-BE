// app.js (CommonJS) – Final & Secure Version
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
// ĐÃ HOẠT ĐỘNG TỐT - Giữ nguyên
app.set("trust proxy", 1);
console.log("trust proxy =", app.get("trust proxy")); // debug: phải in 'true'

// 3) Security & parsers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const FE_ORIGIN = process.env.FE_ORIGIN || "*";
app.use(
  cors({
    origin: FE_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// 4) Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// 5) Rate limit riêng cho login (PHIÊN BẢN ĐÚNG)
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20,
  standardHeaders: true, // Gửi header RateLimit-*
  legacyHeaders: false, // Tắt header X-RateLimit-* cũ
  // KHÔNG CẦN keyGenerator hay validate ở đây nữa
  // Vì 'trust proxy' đã được bật, thư viện sẽ tự động và an toàn
  // xác định IP của người dùng (kể cả IPv4 và IPv6).
});
app.use("/api/auth/login", loginLimiter);

// 6) Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/classes", require("./routes/class.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/scores", require("./routes/score.routes"));

// Route gốc
app.get("/", (req, res) => {
  res.json({
    message: "Student Management API is running",
    docs: "/docs",
    health: "/health",
  });
});

// 7) Swagger
require("./docs/swagger")(app);

// 8) 404
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// 9) Error handler
app.use(errorHandler);

// 10) Start server
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
