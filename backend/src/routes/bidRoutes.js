const express = require("express");
const { placeBid } = require("../controllers/bidController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Place bid on auction
router.post("/:auctionId/bids", authMiddleware, placeBid);

module.exports = router;
  