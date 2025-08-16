const express = require("express");
const { sellerDecision } = require("../controllers/decisionController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/auctions/:auctionId/decision", authMiddleware, sellerDecision);

module.exports = router;
