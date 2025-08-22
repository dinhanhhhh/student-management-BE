// routes/score.routes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ctrl = require("../controllers/score.controller");
const {
  auth,
  requireRole,
  requireSelfStudentParam,
} = require("../middlewares/auth");

// ✅ Validate ObjectId cho params, query, và body (POST/PUT)
function validateObjectId(req, res, next) {
  const ids = [];
  // params
  if (req.params.id) ids.push(req.params.id);
  if (req.params.studentId) ids.push(req.params.studentId);
  if (req.params.subjectId) ids.push(req.params.subjectId);
  // query
  if (req.query.studentId) ids.push(req.query.studentId);
  if (req.query.subjectId) ids.push(req.query.subjectId);
  // body (create/update)
  if (req.body?.studentId) ids.push(req.body.studentId);
  if (req.body?.subjectId) ids.push(req.body.subjectId);

  for (const id of ids) {
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
  }
  next();
}

/**
 * ⚠️ Thứ tự route rất quan trọng:
 * Đặt /student/... TRƯỚC "/:id" để tránh bị "/:id" match chữ 'student'
 */

// -------- Utilities (xem bảng điểm & GPA) --------
// admin/teacher xem bất kỳ; student chỉ xem CHÍNH MÌNH (so với req.user.studentRef)
router.get(
  "/student/:studentId/term/:term",
  auth,
  validateObjectId,
  requireSelfStudentParam("studentId"),
  ctrl.getScoresOfStudentByTerm
);

router.get(
  "/student/:studentId/gpa",
  auth,
  validateObjectId,
  requireSelfStudentParam("studentId"),
  ctrl.getGPA
);

// -------- Danh sách/Chi tiết --------
// Chỉ admin/teacher mới xem toàn bộ hệ thống
router.get(
  "/",
  auth,
  requireRole("admin", "teacher"),
  validateObjectId,
  ctrl.getAllScores
);

router.get(
  "/:id",
  auth,
  requireRole("admin", "teacher"),
  validateObjectId,
  ctrl.getScoreById
);

// -------- Tạo/Sửa/Xoá điểm --------
router.post(
  "/",
  auth,
  requireRole("teacher", "admin"),
  validateObjectId,
  ctrl.createScore
);

router.put(
  "/:id",
  auth,
  requireRole("teacher", "admin"),
  validateObjectId,
  ctrl.updateScore
);

router.delete(
  "/:id",
  auth,
  requireRole("admin"),
  validateObjectId,
  ctrl.deleteScore
);

module.exports = router;
