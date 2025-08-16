const Auction = require("../models/Auction");
const redis = require("../config/redis");

// Place a bid
exports.placeBid = async (req, res) => {
  const { auctionId } = req.params;
  const { amount } = req.body;
  const userId = req.user.id;

  if (!amount) return res.status(400).json({ error: "Amount required" });

  const lockKey = `auction:${auctionId}:lock`;
  const highestKey = `auction:${auctionId}:highest`;

  try {
    // Acquire simple lock (SETNX)
    const lock = await redis.set(lockKey, "1", "NX", "PX", 3000);
    if (!lock) return res.status(429).json({ error: "Try again" });

    // Fetch current highest from Redis
    let highest = await redis.get(highestKey);
    highest = highest ? JSON.parse(highest) : null;

    const auction = await Auction.findByPk(auctionId);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    if (auction.status !== "active") return res.status(400).json({ error: "Auction not active" });
    if (userId === auction.sellerId) return res.status(400).json({ error: "Seller cannot bid" });

    const minBid = highest ? highest.amount + auction.bidIncrement : auction.startingPrice;
    if (amount < minBid) return res.status(400).json({ error: `Minimum bid is ${minBid}` });

    // Tentatively update Redis
    await redis.set(highestKey, JSON.stringify({ amount, bidderId: userId }));

    // Persist bid to DB
    await auction.createBid({ bidderId: userId, amount });

    // Broadcast via Socket.IO
    const { io } = require("../app");
    io.to(`auction:${auctionId}`).emit("new_bid", { bidderId: userId, amount, time: new Date() });

    // Release lock
    await redis.del(lockKey);

    res.json({ message: "Bid placed", amount });
  } catch (err) {
    await redis.del(lockKey);
    console.error(err);
    res.status(500).json({ error: "Failed to place bid" });
  }
};
