const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    }, // VD: CTK42
    year: { type: Number, min: 1990, max: 2100 },
    department: { type: String, trim: true }, // VD: CNTT
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
