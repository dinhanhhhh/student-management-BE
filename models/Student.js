const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, unique: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dateOfBirth: Date,
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
