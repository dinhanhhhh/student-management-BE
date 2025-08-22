// app.js (CommonJS)
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

// ─────────────────────────────────────────────────────────────
// 1) Load ENV trước khi dùng
// ─────────────────────────────────────────────────────────────
dotenv.config();

// ─────────────────────────────────────────────────────────────
// 2) App & proxy (Render/nginx/ngrok đều là proxy → cần trust)
// ─────────────────────────────────────────────────────────────
const app = express();
app.set("trust proxy", 1); // để Express hiểu đúng IP client, cookie secure...

// ─────────────────────────────────────────────────────────────
// 3) Security & perf middlewares
// ─────────────────────────────────────────────────────────────
app.use(
  helmet({
    // nếu API trả ảnh/file tĩnh cross-origin, bật false để tránh chặn
    crossOriginResourcePolicy: false,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────
// 4) CORS (đa origin, đọc từ ENV, fallback an toàn)
//    FE_ORIGIN có thể là 1 hoặc nhiều origin, cách nhau dấu phẩy
//    Ví dụ: FE_ORIGIN=https://abc.vercel.app,https://xyz.onrender.com
// ─────────────────────────────────────────────────────────────
const rawOrigins = process.env.FE_ORIGIN || "*";
const allowedOrigins = rawOrigins.split(",").map((s) => s.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // request không có Origin (curl, Postman) → cho qua
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // cho phép gửi cookie
};
app.use(cors(corsOptions));

// (tuỳ chọn) xử lý preflight cho mọi route
app.options("*", cors(corsOptions));

// ─────────────────────────────────────────────────────────────
// 5) Rate limit cho login
// ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20, // 20 lần / 10 phút / IP
  standardHeaders: true,
});
app.use("/api/auth/login", loginLimiter);

// ─────────────────────────────────────────────────────────────
// 6) Health check (Render/monitor cần điểm kiểm tra)
// ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────
// 7) Routes chính
// ─────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/classes", require("./routes/class.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/scores", require("./routes/score.routes"));

// Swagger nên đặt SAU khi đã có app
require("./docs/swagger")(app);

// 404 fallback (nên có, trước error handler)
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler cuối cùng
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// 8) Kết nối DB rồi mới lắng nghe PORT (tránh server up khi DB fail)
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect DB:", err);
    process.exit(1);
  }
})();
