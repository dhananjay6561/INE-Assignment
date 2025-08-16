const express = require("express");
const { createAuction, getAuction, listAuctions } = require("../controllers/auctionController");
const { placeBid } = require("../controllers/bidController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Auction endpoints
router.post("/", authMiddleware, createAuction);
router.get("/:id", getAuction);
router.get("/", listAuctions);

// Bid endpoint (nested)
router.post("/:auctionId/bids", authMiddleware, placeBid);

module.exports = router;
