// seed/scores.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Score = require("../models/Score");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Các học kỳ muốn seed
const TERMS = ["2025-1", "2025-2"];

// (Tuỳ chọn) Danh sách code môn kỳ vọng có sẵn (đã seed từ trước)
// Bạn có thể sửa/đổi/add theo thực tế
const EXPECTED_SUBJECT_CODES = ["CTDL", "GTLT", "CSDL", "WEB101", "HDH"];

/**
 * Chọn ra N môn theo kiểu "xoay vòng" để mỗi sinh viên/term có bộ môn khác nhau
 * @param {Array<ObjectId>} subjectIds
 * @param {number} startIdx
 * @param {number} n
 * @returns {Array<ObjectId>}
 */
function pickSubjects(subjectIds, startIdx, n) {
  const len = subjectIds.length;
  const out = [];
  for (let j = 0; j < n; j++) {
    out.push(subjectIds[(startIdx + j) % len]);
  }
  return out;
}

/**
 * Tạo điểm "ổn định" (deterministic) 6.0..10.0 dựa theo index sinh viên/môn/kỳ
 */
function makeScore(iStudent, jSubject, tIndex) {
  const base = 6 + ((iStudent + jSubject + tIndex) % 5); // 6..10
  const withDecimal = Math.min(10, base + jSubject * 0.25); // thêm 0.0/0.25/0.5
  return Math.round(withDecimal * 10) / 10;
}

(async () => {
  try {
    console.log("⏳ Connecting MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected");

    // Lấy toàn bộ students & subjects
    const [students, subjects] = await Promise.all([
      Student.find().select("_id name studentId").sort({ createdAt: 1 }),
      Subject.find().select("_id name code credit").sort({ code: 1 }),
    ]);

    if (students.length === 0) {
      throw new Error("Chưa có Student nào. Hãy seed students trước.");
    }
    if (subjects.length < 3) {
      throw new Error(
        "Cần ít nhất 3 Subject. Hãy seed subjects trước (vd: CTDL, GTLT, CSDL, WEB101, HDH)."
      );
    }

    // (Tuỳ chọn) Cảnh báo nếu thiếu các subject code kỳ vọng
    const codesInDb = new Set(subjects.map((s) => s.code.toUpperCase()));
    const missing = EXPECTED_SUBJECT_CODES.filter((c) => !codesInDb.has(c));
    if (missing.length) {
      console.warn(
        "⚠️ Thiếu các subject code sau (không bắt buộc, chỉ cảnh báo):",
        missing.join(", ")
      );
    }

    // Xoá điểm cũ để seed lại cho sạch
    await Score.deleteMany({});
    console.log("🧹 Đã xoá toàn bộ scores cũ");

    // Danh sách id môn (ổn định theo sort code)
    const subjectIds = subjects.map((s) => s._id);
    const scoresToInsert = [];

    // Với mỗi sinh viên, mỗi kỳ -> 3 môn (xoay vòng), chấm điểm “đẹp”
    students.forEach((stu, i) => {
      TERMS.forEach((term, tIndex) => {
        const chosen = pickSubjects(
          subjectIds,
          (i + tIndex) % subjectIds.length,
          3
        );
        chosen.forEach((subId, j) => {
          scoresToInsert.push({
            studentId: stu._id,
            subjectId: subId,
            term,
            score: makeScore(i, j, tIndex), // 6.0..10.0
            note: j === 0 ? "Mid+Final" : undefined,
          });
        });
      });
    });

    // Chèn vào DB
    await Score.insertMany(scoresToInsert, { ordered: false });
    console.log(
      `🎉 Seed scores OK! Inserted: ${scoresToInsert.length} bản ghi`
    );
    console.log(
      `📌 Students: ${students.length}, Subjects: ${
        subjects.length
      }, Terms: ${TERMS.join(", ")}`
    );

    process.exit(0);
  } catch (e) {
    console.error("❌ Seed scores FAIL:", e.message || e);
    // Nếu dính unique index do chạy lại mà chưa xoá, nhớ để Score.deleteMany() phía trên
    process.exit(1);
  }
})();
