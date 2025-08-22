const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    term: { type: String, required: true, trim: true }, // ví dụ: "2025-1"
    score: { type: Number, min: 0, max: 10, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

// Mỗi (student, subject, term) chỉ có 1 bản ghi
scoreSchema.index({ studentId: 1, subjectId: 1, term: 1 }, { unique: true });

module.exports = mongoose.model("Score", scoreSchema);
