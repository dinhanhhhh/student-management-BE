const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/auth.controller");
const { auth, requireRole } = require("../middlewares/auth");

router.post("/register", auth, requireRole("admin"), ctrl.register); // chỉ admin tạo user
router.post("/login", ctrl.login);
router.post("/refresh", ctrl.refresh);
router.get("/me", auth, ctrl.me);
router.post("/logout", auth, ctrl.logout);

module.exports = router;
