const ClassModel = require("../models/Class");
const Student = require("../models/Student");

// GET /api/classes
exports.getAllClasses = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      q,
      department,
      year,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};
    if (q) filter.name = new RegExp(q, "i");
    if (department) filter.department = new RegExp(department, "i");
    if (year) filter.year = Number(year);

    const total = await ClassModel.countDocuments(filter);
    const classes = await ClassModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: classes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/classes/:id
exports.getClassById = async (req, res, next) => {
  try {
    const cls = await ClassModel.findById(req.params.id);
    if (!cls) {
      res.status(404);
      throw new Error("Class not found");
    }
    res.status(200).json(cls);
  } catch (err) {
    next(err);
  }
};

// POST /api/classes
exports.createClass = async (req, res, next) => {
  try {
    const payload = (({ name, year, department }) => ({
      name,
      year,
      department,
    }))(req.body);
    const cls = await ClassModel.create(payload);
    res.status(201).json(cls);
  } catch (err) {
    // unique name trùng → 409
    if (err?.code === 11000) res.status(409);
    else res.status(400);
    next(err);
  }
};

// PUT /api/classes/:id
exports.updateClass = async (req, res, next) => {
  try {
    const payload = (({ name, year, department }) => ({
      name,
      year,
      department,
    }))(req.body);
    const cls = await ClassModel.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!cls) {
      res.status(404);
      throw new Error("Class not found");
    }
    res.status(200).json(cls);
  } catch (err) {
    if (err?.code === 11000) res.status(409);
    else res.status(400);
    next(err);
  }
};

// DELETE /api/classes/:id
exports.deleteClass = async (req, res, next) => {
  try {
    const cls = await ClassModel.findById(req.params.id);
    if (!cls) {
      res.status(404);
      throw new Error("Class not found");
    }

    // Ngăn xóa khi còn sinh viên thuộc lớp này
    const inUse = await Student.countDocuments({ classId: cls._id });
    if (inUse > 0) {
      res.status(409);
      throw new Error(
        `Class is in use by ${inUse} student(s). Remove or move them first.`
      );
    }

    await cls.deleteOne();
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/classes/:id/students
exports.getStudentsInClass = async (req, res, next) => {
  try {
    let { page = 1, limit = 10, sort = "-createdAt" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const clsId = req.params.id;
    const total = await Student.countDocuments({ classId: clsId });
    const students = await Student.find({ classId: clsId })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: students,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};
