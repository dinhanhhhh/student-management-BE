const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const ctrl = require("../controllers/subject.controller");
const { auth, requireRole } = require("../middlewares/auth");

function validateObjectId(req, res, next) {
  const id = req.params.id;
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }
  next();
}

// Đăng nhập là xem được (ai cũng có quyền đọc)
router.get("/", auth, ctrl.getAllSubjects);
router.get("/:id", auth, validateObjectId, ctrl.getSubjectById);

// Chỉ admin CRUD
router.post("/", auth, requireRole("admin"), ctrl.createSubject);
router.put(
  "/:id",
  auth,
  requireRole("admin"),
  validateObjectId,
  ctrl.updateSubject
);
router.delete(
  "/:id",
  auth,
  requireRole("admin"),
  validateObjectId,
  ctrl.deleteSubject
);

module.exports = router;
