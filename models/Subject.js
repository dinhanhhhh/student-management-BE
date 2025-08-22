const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true }, // VD: CTDL, INT101
    credit: { type: Number, default: 3, min: 0 },
  },
  { timestamps: true }
);

// (tuỳ chọn) Chuẩn hoá code: viết hoa, bỏ khoảng trắng
subjectSchema.pre("save", function (next) {
  if (this.code) this.code = this.code.toUpperCase().replace(/\s+/g, "");
  next();
});
subjectSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update?.code) update.code = update.code.toUpperCase().replace(/\s+/g, "");
  next();
});

module.exports = mongoose.model("Subject", subjectSchema);
