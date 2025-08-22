const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Student = require("../models/Student");
dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Xoá mẫu cũ
    await User.deleteMany({ username: { $in: ["teacher01", "sv001"] } });

    // Tạo teacher
    await User.create({
      username: "teacher01",
      password: "Secret@123",
      role: "teacher",
    });

    // Lấy 1 student bất kỳ để link
    const aStudent = await Student.findOne().select("_id name");
    if (!aStudent) throw new Error("Chưa có Student nào để gán studentRef!");

    // Tạo user student map hồ sơ
    await User.create({
      username: "sv001",
      password: "Sv@123",
      role: "student",
      studentRef: aStudent._id,
    });

    console.log("✅ Seed users OK:", {
      teacher: "teacher01",
      student: "sv001 → " + aStudent._id,
    });
  } catch (e) {
    console.error("❌ Seed users FAIL:", e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
