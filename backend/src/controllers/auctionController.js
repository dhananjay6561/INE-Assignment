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

    // Enrich auction payload with computed fields for frontend
    const highestRaw = await redis.get(`auction:${auction.id}:highest`);
    const highest = highestRaw ? JSON.parse(highestRaw) : null;

    // Seller info (if available)
    let seller = null;
    try {
      const { User } = require('../models');
      if (auction.sellerId) {
        seller = await User.findByPk(auction.sellerId, { attributes: ['id', 'name', 'email'] });
      }
    } catch (e) { /* ignore */ }

    // Highest bidder details
    let highestBidder = null;
    if (highest && highest.bidderId) {
      try {
        const { User } = require('../models');
        highestBidder = await User.findByPk(highest.bidderId, { attributes: ['id', 'name', 'email'] });
      } catch (e) { /* ignore */ }
    }

    // Compute end time if goLiveAt + durationSeconds available
    let endTime = null;
    try {
      if (auction.goLiveAt && auction.durationSeconds) {
        const start = new Date(auction.goLiveAt).getTime();
        endTime = new Date(start + (auction.durationSeconds * 1000)).toISOString();
      }
    } catch (e) { /* ignore */ }

    // Bid count
    let bidCount = 0;
    try {
      const { Bid } = require('../models');
      bidCount = await Bid.count({ where: { auctionId: auction.id } });
    } catch (e) { /* ignore */ }

    const payload = {
      id: auction.id,
      sellerId: auction.sellerId,
      seller,
      itemName: auction.itemName,
      description: auction.description,
      startingPrice: auction.startingPrice,
      bidIncrement: auction.bidIncrement,
      goLiveAt: auction.goLiveAt,
      durationSeconds: auction.durationSeconds,
      status: auction.status,
      created_at: auction.created_at,
      updated_at: auction.updated_at,
      currentHighestBid: highest ? highest.amount : null,
      currentHighestBidder: highestBidder || null,
      endTime,
      bidCount,
    };

    res.json({ auction: payload });
  } catch (err) {
    console.error('Failed to fetch auction:', err);
    res.status(500).json({ error: "Failed to fetch auction" });
  }
};

// List auctions by status, always include seller info and endTime
exports.listAuctions = async (req, res) => {
  try {
    const { status } = req.query;
    let where = {};
    if (status) where.status = status;

    const { User } = require('../models');
    // Eager load seller association
    const auctions = await Auction.findAll({
      where,
      order: [["goLiveAt", "ASC"]],
      include: [{ model: User, as: "seller", attributes: ["id", "name", "email"] }],
    });

    // For each auction, compute endTime robustly
    const auctionsWithDetails = auctions.map((auction) => {
      let endTime = null;
      try {
        if (auction.goLiveAt && auction.durationSeconds) {
          const start = new Date(auction.goLiveAt).getTime();
          endTime = new Date(start + (auction.durationSeconds * 1000)).toISOString();
        }
      } catch (e) { /* ignore */ }

      return {
        id: auction.id,
        sellerId: auction.sellerId,
        seller: auction.seller ? {
          id: auction.seller.id,
          name: auction.seller.name,
          email: auction.seller.email
        } : null,
        itemName: auction.itemName,
        description: auction.description,
        startingPrice: auction.startingPrice,
        bidIncrement: auction.bidIncrement,
        goLiveAt: auction.goLiveAt,
        durationSeconds: auction.durationSeconds,
        status: auction.status,
        created_at: auction.created_at,
        updated_at: auction.updated_at,
        endTime,
      };
    });

    res.json({ auctions: auctionsWithDetails });
  } catch (err) {
    res.status(500).json({ error: "Failed to list auctions" });
  }
};
