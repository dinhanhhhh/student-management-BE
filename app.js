// app.js (CommonJS) – Stable for Express 5 & Render
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
app.set("trust proxy", 1);

// 3) Security & parsers
app.use(
  helmet({
    // Swagger/UI hoặc asset cross-origin sẽ ổn hơn khi tắt policy này
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.FE_ORIGIN || "*", // có thể để * khi test
    credentials: true, // cho cookie qua lại
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// 4) Health check (hữu ích cho kiểm tra & monitor)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// 5) Rate limit riêng cho login
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20,
  standardHeaders: true,
});
app.use("/api/auth/login", loginLimiter);

// 6) Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/classes", require("./routes/class.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/scores", require("./routes/score.routes"));

// 7) Swagger (đặt sau khi có app)
require("./docs/swagger")(app);

// 8) 404 (đặt trước error handler)
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// 9) Error handler cuối
app.use(errorHandler);

// 10) Start: chỉ listen khi DB đã sẵn sàng
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB(); // chờ MongoDB OK rồi mới start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server on ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect DB:", err);
    process.exit(1);
  }
})();
