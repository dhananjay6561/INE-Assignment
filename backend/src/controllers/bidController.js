const Auction = require("../models/Auction");
const redis = require("../config/redis");

let ioInstance; // Will hold Socket.IO instance

// Setter to inject io from app.js
exports.setIo = (io) => {
  ioInstance = io;
};

// Place a bid
exports.placeBid = async (req, res) => {
  const { auctionId } = req.params;
  const { amount } = req.body;
  const userId = req.user.id;

  if (!amount) return res.status(400).json({ error: "Amount required" });

  const lockKey = `auction:${auctionId}:lock`;
  const highestKey = `auction:${auctionId}:highest`;

  try {
    // Acquire Redis lock (3 seconds)
    const lock = await redis.set(lockKey, "1", "NX", "PX", 3000);
    if (!lock) return res.status(429).json({ error: "Please try again shortly" });

    // Fetch current highest bid from Redis
    let highest = await redis.get(highestKey);
    highest = highest ? JSON.parse(highest) : null;

    // Fetch auction from DB
    const auction = await Auction.findByPk(auctionId);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    if (auction.status !== "active") return res.status(400).json({ error: "Auction not active" });
    if (userId === auction.sellerId) return res.status(400).json({ error: "Seller cannot bid" });

    // Minimum bid check
    const minBid = highest ? highest.amount + auction.bidIncrement : auction.startingPrice;
    if (amount < minBid) return res.status(400).json({ error: `Minimum bid is ${minBid}` });

    // Update Redis with new highest bid
    await redis.set(highestKey, JSON.stringify({ amount, bidderId: userId }));

    // Persist bid to DB
    await auction.createBid({ bidderId: userId, amount });

    // Broadcast new bid to auction room
    if (ioInstance) {
      ioInstance.to(`auction:${auctionId}`).emit("new_bid", { bidderId: userId, amount, time: new Date() });

      // Notify previous highest bidder (if exists)
      if (highest && highest.bidderId !== userId) {
        ioInstance.to(`user:${highest.bidderId}`).emit("outbid", {
          auctionId,
          newHighest: { bidderId: userId, amount },
        });
      }
    }

    // Release lock
    await redis.del(lockKey);

    res.json({ message: "Bid placed successfully", amount });
  } catch (err) {
    // Ensure lock release
    await redis.del(lockKey);
    console.error(err);
    res.status(500).json({ error: "Failed to place bid" });
  }
};
