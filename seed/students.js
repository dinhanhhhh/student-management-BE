const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Student = require("../models/Student");
const Class = require("../models/Class");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const rawStudents = [
  {
    name: "Nguyễn Văn A",
    studentId: "SV001",
    email: "vana@example.com",
    gender: "Male",
    dateOfBirth: "2002-01-01",
    className: "CTK42",
  },
  {
    name: "Trần Thị B",
    studentId: "SV002",
    email: "tranb@example.com",
    gender: "Female",
    dateOfBirth: "2002-03-15",
    className: "CTK43",
  },
  {
    name: "Lê Văn C",
    studentId: "SV003",
    email: "lec@example.com",
    gender: "Male",
    dateOfBirth: "2001-12-10",
    className: "CTK42",
  },
  {
    name: "Phạm Thùy D",
    studentId: "SV004",
    email: "thuyd@example.com",
    gender: "Female",
    dateOfBirth: "2003-07-22",
    className: "CTK44",
  },
  {
    name: "Hoàng Minh E",
    studentId: "SV005",
    email: "minhe@example.com",
    gender: "Male",
    dateOfBirth: "2002-05-09",
    className: "CTK43",
  },
  {
    name: "Đặng Quốc F",
    studentId: "SV006",
    email: "quocf@example.com",
    gender: "Male",
    dateOfBirth: "2001-11-30",
    className: "CTK42",
  },
  {
    name: "Võ Mỹ G",
    studentId: "SV007",
    email: "myg@example.com",
    gender: "Female",
    dateOfBirth: "2003-02-18",
    className: "CTK44",
  },
  {
    name: "Bùi Gia H",
    studentId: "SV008",
    email: "giah@example.com",
    gender: "Male",
    dateOfBirth: "2002-09-01",
    className: "CTK45",
  },
  {
    name: "Ngô Thu I",
    studentId: "SV009",
    email: "thui@example.com",
    gender: "Female",
    dateOfBirth: "2001-06-14",
    className: "CTK43",
  },
  {
    name: "Trịnh An K",
    studentId: "SV010",
    email: "ank@example.com",
    gender: "Other",
    dateOfBirth: "2002-12-05",
    className: "CTK45",
  },
];

const seedStudents = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const classList = await Class.find();
    if (classList.length === 0) {
      throw new Error("❌ Chưa có dữ liệu Class. Vui lòng seed Class trước.");
    }

    // Xóa toàn bộ sinh viên cũ
    await Student.deleteMany();

    // Gắn đúng classId dựa trên tên lớp
    const studentsWithClassId = rawStudents.map((student) => {
      const matchedClass = classList.find(
        (cls) => cls.name === student.className
      );
      if (!matchedClass) {
        throw new Error(`Không tìm thấy className "${student.className}"`);
      }

      return {
        ...student,
        classId: matchedClass._id,
      };
    });

    // Insert vào database
    await Student.insertMany(studentsWithClassId);
    console.log("🎉 Seed students thành công!");
    process.exit();
  } catch (err) {
    console.error("❌ Lỗi khi seed students:", err.message);
    process.exit(1);
  }
};

seedStudents();
