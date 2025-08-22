const User = require("../models/User");
const mongoose = require("mongoose");
const { signAccess, signRefresh, verifyRefresh } = require("../utils/tokens");

// cookie options chung
const isProd = process.env.NODE_ENV === "production";
const cookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

const ACCESS_MS = (() => {
  // ưu tiên env (vd: 15m) -> fallback 15 phút
  const env = process.env.ACCESS_TOKEN_EXPIRES || "15m";
  // đơn giản: nếu là số+m => đổi ra ms; còn không cứ để 15m mặc định
  if (/^\d+m$/.test(env)) return parseInt(env) * 60 * 1000;
  return 15 * 60 * 1000;
})();
const REFRESH_MS = (() => {
  const env = process.env.REFRESH_TOKEN_EXPIRES || "7d";
  if (/^\d+d$/.test(env)) return parseInt(env) * 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
})();

exports.register = async (req, res, next) => {
  try {
    let { username, password, role, studentRef } = req.body;

    // validate cơ bản
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username & password are required" });
    }
    username = String(username).trim().toLowerCase();
    if (role && !["admin", "teacher", "student"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (studentRef && !mongoose.Types.ObjectId.isValid(studentRef)) {
      return res.status(400).json({ message: "Invalid studentRef" });
    }

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(409).json({ message: "Username already exists" });

    const user = await User.create({ username, password, role, studentRef });
    res
      .status(201)
      .json({ id: user._id, username: user.username, role: user.role });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const usernameNorm = String(req.body.username || "")
      .trim()
      .toLowerCase();
    const { password } = req.body;
    if (!usernameNorm || !password) {
      return res
        .status(400)
        .json({ message: "username & password are required" });
    }

    const user = await User.findOne({ username: usernameNorm });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      uid: user._id.toString(),
      role: user.role,
      username: user.username,
      studentRef: user.studentRef ? user.studentRef.toString() : null, // giữ để self-check
    };
    const at = signAccess(payload);
    const rt = signRefresh(payload);

    res
      .cookie(process.env.COOKIE_NAME_AT, at, {
        ...cookieBase,
        maxAge: ACCESS_MS,
      }) // ví dụ 15m
      .cookie(process.env.COOKIE_NAME_RT, rt, {
        ...cookieBase,
        maxAge: REFRESH_MS,
      }) // ví dụ 7d
      .status(200)
      .json({
        user: { id: user._id, username: user.username, role: user.role },
      });
  } catch (e) {
    next(e);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const rt = req.cookies?.[process.env.COOKIE_NAME_RT];
    if (!rt) return res.status(401).json({ message: "Unauthorized" });

    const decoded = verifyRefresh(rt);
    // ⚠️ giữ nguyên các field quan trọng, nhất là studentRef
    const payload = {
      uid: decoded.uid,
      role: decoded.role,
      username: decoded.username,
      studentRef: decoded.studentRef ?? null,
    };

    const at = signAccess(payload);
    res
      .cookie(process.env.COOKIE_NAME_AT, at, {
        ...cookieBase,
        maxAge: ACCESS_MS,
      })
      .status(200)
      .json({ message: "refreshed" });
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

exports.me = async (req, res) => {
  // req.user được gán ở middleware auth
  res.status(200).json({ user: req.user });
};

exports.logout = async (req, res) => {
  res
    .clearCookie(process.env.COOKIE_NAME_AT, { ...cookieBase })
    .clearCookie(process.env.COOKIE_NAME_RT, { ...cookieBase })
    .status(200)
    .json({ message: "Logged out" });
};
