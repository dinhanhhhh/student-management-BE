// routes/student.routes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ctrl = require("../controllers/student.controller");
const { auth, requireRole } = require("../middlewares/auth");

// Validate ObjectId cho tham số :id (nếu có)
function validateObjectId(req, res, next) {
  const id = req.params.id;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }
  next();
}

/**
 * RBAC:
 * - admin, teacher: xem danh sách & chi tiết
 * - admin: tạo/sửa/xoá
 * - student: xem hồ sơ của CHÍNH MÌNH qua /me/profile
 */

// Tất cả route bên dưới đều yêu cầu đăng nhập
router.use(auth);

// 🔹 Sinh viên xem hồ sơ của chính mình (ĐẶT TRƯỚC /:id)
router.get("/me/profile", async (req, res, next) => {
  try {
    if (req.user.role !== "student" || !req.user.studentRef) {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.params.id = req.user.studentRef; // tái dùng controller getById
    return ctrl.getStudentById(req, res, next);
  } catch (e) {
    next(e);
  }
});

// Danh sách & chi tiết (admin/teacher)
router.get("/", requireRole("admin", "teacher"), ctrl.getAllStudents);
router.get(
  "/:id",
  requireRole("admin", "teacher"),
  validateObjectId,
  ctrl.getStudentById
);

// Tạo/Sửa/Xoá chỉ admin
router.post("/", requireRole("admin"), ctrl.createStudent);
router.put("/:id", requireRole("admin"), validateObjectId, ctrl.updateStudent);
router.delete(
  "/:id",
  requireRole("admin"),
  validateObjectId,
  ctrl.deleteStudent
);

module.exports = router;
