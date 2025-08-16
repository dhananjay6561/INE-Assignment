const Auction = require("../models/Auction");
const { Op } = require("sequelize");
const redis = require("../config/redis"); // Redis client

// Create auction
exports.createAuction = async (req, res) => {
  try {
    const { itemName, description, startingPrice, bidIncrement, goLiveAt, durationSeconds } = req.body;
    if (!itemName || !startingPrice || !bidIncrement || !goLiveAt || !durationSeconds) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create auction in DB
    const auction = await Auction.create({
      sellerId: req.user.id,
      itemName,
      description,
      startingPrice,
      bidIncrement,
      goLiveAt,
      durationSeconds,
    });

    // --- Redis scheduling ---
    const startTimestamp = Math.floor(new Date(goLiveAt).getTime() / 1000);
    const endTimestamp = startTimestamp + durationSeconds;

    await redis.zadd("auction:schedule:starts", Math.floor(new Date(goLiveAt).getTime() / 1000), auction.id);
    await redis.zadd("auction:schedule:ends", Math.floor(new Date(goLiveAt).getTime() / 1000) + durationSeconds, auction.id);

    await redis.set(`auction:${auction.id}:status`, "scheduled");
    // ------------------------

    res.status(201).json({ message: "Auction created", auction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create auction" });
  }
};

// Get auction details
exports.getAuction = async (req, res) => {
  try {
    const auction = await Auction.findByPk(req.params.id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });

    res.json({ auction });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch auction" });
  }
};

// List auctions by status
exports.listAuctions = async (req, res) => {
  try {
    const { status } = req.query;
    let where = {};
    if (status) where.status = status;

    const auctions = await Auction.findAll({ where, order: [["goLiveAt", "ASC"]] });
    res.json({ auctions });
  } catch (err) {
    res.status(500).json({ error: "Failed to list auctions" });
  }
};
