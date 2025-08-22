const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Subject = require("../models/Subject");

dotenv.config();

const data = [
  { name: "Cấu trúc dữ liệu", code: "CTDL", credit: 3 },
  { name: "Giải thuật", code: "GTLT", credit: 3 },
  { name: "Cơ sở dữ liệu", code: "CSDL", credit: 3 },
  { name: "Lập trình Web", code: "WEB101", credit: 4 },
  { name: "Hệ điều hành", code: "HDH", credit: 3 },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Subject.deleteMany();
    await Subject.insertMany(data);
    console.log("✅ Seed subjects OK");
    process.exit(0);
  } catch (e) {
    console.error("❌ Seed subjects fail:", e);
    process.exit(1);
  }
})();
