const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  try {
    const token = req.cookies?.[process.env.COOKIE_NAME_AT];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { uid, role, username }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
exports.requireSelfStudentParam =
  (paramName = "studentId") =>
  (req, res, next) => {
    // admin/teacher đi qua luôn
    if (["admin", "teacher"].includes(req.user?.role)) return next();

    // student phải có studentRef và phải trùng với :studentId
    const wanted =
      req.params[paramName] || req.query[paramName] || req.body[paramName];
    if (!req.user?.studentRef || !wanted)
      return res.status(403).json({ message: "Forbidden" });
    if (String(req.user.studentRef) !== String(wanted))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
exports.requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
