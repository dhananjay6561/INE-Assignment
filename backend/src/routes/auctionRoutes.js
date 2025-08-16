const express = require("express");
const { createAuction, getAuction, listAuctions } = require("../controllers/auctionController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Create auction (seller only)
router.post("/", authMiddleware, createAuction);

// Get auction details
router.get("/:id", getAuction);

// List auctions (optionally filter by status)
router.get("/", listAuctions);

module.exports = router;
