const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const { MONGO_URI } = process.env;

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);

    // Xoá mọi tài khoản tên "admin" (bất kể hoa/thường) để tránh trùng
    await User.deleteMany({ username: { $regex: /^admin$/i } });

    // KHÔNG tự hash ở đây! pre('save') trong User model sẽ hash.
    const admin = await User.create({
      username: "admin",
      password: "Admin@123",
      role: "admin",
    });

    console.log("✅ Seed admin OK:", {
      id: admin._id,
      username: admin.username,
      role: admin.role,
    });
  } catch (err) {
    console.error("❌ Seed admin FAIL:", err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
