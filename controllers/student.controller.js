const Student = require("../models/Student");

// @desc Lấy danh sách sinh viên (có tìm kiếm, lọc, phân trang, sort)
exports.getAllStudents = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      q,
      classId,
      gender,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { studentId: new RegExp(q, "i") },
      ];
    }
    if (classId) filter.classId = classId;
    if (gender) filter.gender = gender;

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate("classId", "name department year")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Lấy sinh viên theo ID
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate("classId");
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    res.status(200).json(student);
  } catch (err) {
    next(err);
  }
};

// @desc Tạo mới sinh viên
exports.createStudent = async (req, res, next) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400);
    next(err);
  }
};

// @desc Cập nhật sinh viên
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    res.status(200).json(student);
  } catch (err) {
    res.status(400);
    next(err);
  }
};

// @desc Xoá sinh viên
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      res.status(404);
      throw new Error("Student not found");
    }
    await student.deleteOne();
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
