const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Student = require("../models/Student");
const ClassModel = require("../models/Class");

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Lấy danh sách lớp (map theo name)
    const classes = await ClassModel.find({});
    const map = new Map(classes.map((c) => [c.name, c._id]));

    const cursor = Student.find({
      classId: { $exists: false },
      class: { $exists: true },
    }).cursor();

    let updated = 0,
      skipped = 0;
    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      const className = doc.class;
      const clsId = map.get(className);
      if (clsId) {
        doc.classId = clsId;
        doc.class = undefined; // bỏ field cũ
        await doc.save();
        updated++;
      } else {
        skipped++;
        console.warn(
          `⚠️ Class not found for student ${doc.studentId} (${className})`
        );
      }
    }

    console.log(`✅ Migrated: ${updated}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (e) {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  }
})();
