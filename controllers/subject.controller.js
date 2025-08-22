const Subject = require("../models/Subject");

// GET /api/subjects
// ?q=… (search name/code) &creditMin=&creditMax=&page=&limit=&sort=
exports.getAllSubjects = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      q,
      creditMin,
      creditMax,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ name: regex }, { code: regex }];
    }
    if (creditMin !== undefined || creditMax !== undefined) {
      filter.credit = {};
      if (creditMin !== undefined) filter.credit.$gte = Number(creditMin);
      if (creditMax !== undefined) filter.credit.$lte = Number(creditMax);
    }

    const total = await Subject.countDocuments(filter);
    const subjects = await Subject.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: subjects,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/subjects/:id
exports.getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    res.status(200).json(subject);
  } catch (err) {
    next(err);
  }
};

// POST /api/subjects
exports.createSubject = async (req, res, next) => {
  try {
    const payload = (({ name, code, credit }) => ({ name, code, credit }))(
      req.body
    );
    const subject = await Subject.create(payload);
    res.status(201).json(subject);
  } catch (err) {
    // trùng code → 409; validate lỗi khác → 400
    if (err?.code === 11000) res.status(409);
    else res.status(400);
    next(err);
  }
};

// PUT /api/subjects/:id
exports.updateSubject = async (req, res, next) => {
  try {
    const payload = (({ name, code, credit }) => ({ name, code, credit }))(
      req.body
    );
    const subject = await Subject.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    res.status(200).json(subject);
  } catch (err) {
    if (err?.code === 11000) res.status(409);
    else res.status(400);
    next(err);
  }
};

// DELETE /api/subjects/:id
exports.deleteSubject = async (req, res, next) => {
  try {
    // (khuyến nghị) kiểm tra còn score tham chiếu không trước khi xoá – sẽ thêm ở module Scores
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }
    res.status(200).json({ message: "Subject deleted" });
  } catch (err) {
    next(err);
  }
};
