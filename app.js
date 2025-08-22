const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FE_ORIGIN,
    credentials: true, // để FE gửi nhận cookie
  })
);
app.use(express.json());
app.use(cookieParser());
const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20, // tối đa 20 lần/10p/IP
  standardHeaders: true,
});
app.use("/api/auth/login", loginLimiter);
// routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/classes", require("./routes/class.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/scores", require("./routes/score.routes"));

require("./docs/swagger")(app);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
