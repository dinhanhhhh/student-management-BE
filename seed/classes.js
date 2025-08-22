const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ClassModel = require("../models/Class");

dotenv.config();

const data = [
  { name: "CTK42", year: 2022, department: "CNTT" },
  { name: "CTK43", year: 2023, department: "CNTT" },
  { name: "CTK44", year: 2024, department: "CNTT" },
  { name: "CTK45", year: 2025, department: "CNTT" },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await ClassModel.deleteMany();
    await ClassModel.insertMany(data);
    console.log("✅ Seed classes OK");
    process.exit(0);
  } catch (e) {
    console.error("❌ Seed classes fail:", e);
    process.exit(1);
  }
})();
