const errorHandler = (err, req, res, next) => {
  console.error("🔥 Lỗi:", err);
  // Nếu controller chưa set status → 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  // Gợi ý: map 1 số lỗi hay gặp
  if (err.name === "CastError") {
    res.status(400);
  }
  if (err.code === 11000) {
    // duplicate key
    res.status(409);
  }

  res.status(res.statusCode).json({
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? "💥" : err.stack,
  });
};
module.exports = errorHandler;
