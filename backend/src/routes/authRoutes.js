const express = require("express");
const { signup, login } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// Protected test route
router.get("/me", authMiddleware, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

module.exports = router;
