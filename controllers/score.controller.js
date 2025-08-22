const Score = require("../models/Score");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

// GET /api/scores
// ?studentId=&subjectId=&term=&page=&limit=&sort=
exports.getAllScores = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      studentId,
      subjectId,
      term,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (subjectId) filter.subjectId = subjectId;
    if (term) filter.term = term;

    const total = await Score.countDocuments(filter);
    const scores = await Score.find(filter)
      .populate("studentId", "name studentId email")
      .populate("subjectId", "name code credit")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: scores,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/scores/:id
exports.getScoreById = async (req, res, next) => {
  try {
    const sc = await Score.findById(req.params.id)
      .populate("studentId", "name studentId")
      .populate("subjectId", "name code credit");
    if (!sc) {
      res.status(404);
      throw new Error("Score not found");
    }
    res.status(200).json(sc);
  } catch (err) {
    next(err);
  }
};

// POST /api/scores
// body: { studentId, subjectId, term, score, note? }
exports.createScore = async (req, res, next) => {
  try {
    const { studentId, subjectId, term, score, note } = req.body;

    // Kiểm tra tồn tại để tránh "mồ côi"
    const [stu, sub] = await Promise.all([
      Student.findById(studentId).select("_id"),
      Subject.findById(subjectId).select("_id credit"),
    ]);
    if (!stu) {
      res.status(400);
      throw new Error("Invalid studentId");
    }
    if (!sub) {
      res.status(400);
      throw new Error("Invalid subjectId");
    }

    const doc = await Score.create({ studentId, subjectId, term, score, note });
    res.status(201).json(doc);
  } catch (err) {
    // duplicate (studentId, subjectId, term)
    if (err?.code === 11000) res.status(409);
    else res.status(400);
    next(err);
  }
};

// PUT /api/scores/:id
exports.updateScore = async (req, res, next) => {
  try {
    // whitelist các field được phép sửa
    const { studentId, subjectId, term, score, note } = req.body;
    if (studentId && !(await Student.exists({ _id: studentId }))) {
      res.status(400);
      throw new Error("Invalid studentId");
    }
    if (subjectId && !(await Subject.exists({ _id: subjectId }))) {
      res.status(400);
      throw new Error("Invalid subjectId");
    }

    const updated = await Score.findByIdAndUpdate(
      req.params.id,
      { studentId, subjectId, term, score, note },
      { new: true, runValidators: true }
    );
    if (!updated) {
      res.status(404);
      throw new Error("Score not found");
    }
    res.status(200).json(updated);
  } catch (err) {
    if (err?.code === 11000) res.status(409);
    else res.status(400);
    next(err);
  }
};

// DELETE /api/scores/:id
exports.deleteScore = async (req, res, next) => {
  try {
    const deleted = await Score.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404);
      throw new Error("Score not found");
    }
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/scores/student/:studentId/term/:term
// Bảng điểm 1 kỳ (populate môn)
exports.getScoresOfStudentByTerm = async (req, res, next) => {
  try {
    const { studentId, term } = req.params;
    const data = await Score.find({ studentId, term })
      .populate("subjectId", "name code credit")
      .sort("subjectId.code");
    res.status(200).json({ data, count: data.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/scores/student/:studentId/gpa?term=2025-1 (term optional)
// GPA có trọng số theo tín chỉ
exports.getGPA = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { term } = req.query;

    const pipeline = [
      {
        $match: {
          studentId: new (require("mongoose").Types.ObjectId)(studentId),
          ...(term ? { term } : {}),
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $addFields: { weighted: { $multiply: ["$score", "$subject.credit"] } },
      },
      {
        $group: {
          _id: null,
          totalWeighted: { $sum: "$weighted" },
          totalCredits: { $sum: "$subject.credit" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalWeighted: 1,
          totalCredits: 1,
          count: 1,
          gpa: {
            $cond: [
              { $gt: ["$totalCredits", 0] },
              { $divide: ["$totalWeighted", "$totalCredits"] },
              null,
            ],
          },
        },
      },
    ];

    const [result] = await Score.aggregate(pipeline);
    if (!result || !result.totalCredits) {
      return res
        .status(200)
        .json({ gpa: null, totalCredits: 0, count: 0, term: term || "ALL" });
    }
    // Làm tròn 2 chữ số cho đẹp
    const gpa = Math.round(result.gpa * 100) / 100;
    res
      .status(200)
      .json({
        gpa,
        totalCredits: result.totalCredits,
        count: result.count,
        term: term || "ALL",
      });
  } catch (err) {
    next(err);
  }
};
