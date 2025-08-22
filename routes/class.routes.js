const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ctrl = require("../controllers/class.controller");
const { auth, requireRole } = require("../middlewares/auth");

function validateObjectId(req, res, next) {
  const id = req.params.id;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }
  next();
}

// Đăng nhập là xem được (ai cũng có quyền đọc)
router.get("/", auth, ctrl.getAllClasses);
router.get("/:id", auth, validateObjectId, ctrl.getClassById);

// Chỉ admin CRUD
router.post("/", auth, requireRole("admin"), ctrl.createClass);
router.put(
  "/:id",
  auth,
  requireRole("admin"),
  validateObjectId,
  ctrl.updateClass
);
router.delete(
  "/:id",
  auth,
  requireRole("admin"),
  validateObjectId,
  ctrl.deleteClass
);

// tiện ích: lấy sinh viên thuộc lớp
router.get(
  "/:id/students",
  auth,
  requireRole("admin", "teacher"),
  validateObjectId,
  ctrl.getStudentsInClass
);

module.exports = router;
