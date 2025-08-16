const redis = require("../config/redis");
const Auction = require("../models/Auction");
const { io } = require("../app"); // import io from app.js

const POLL_INTERVAL = 5000; // 5 sec

const startScheduler = async () => {
    console.log("Scheduler started");

    setInterval(async () => {
        const now = Math.floor(Date.now() / 1000);

        // --- Start Auctions ---
        const toStart = await redis.zrangebyscore("auction:schedule:starts", 0, now);
        for (const auctionId of toStart) {
            const auction = await Auction.findByPk(auctionId);
            if (!auction || auction.status !== "scheduled") continue;

            auction.status = "active";
            await auction.save();

            await redis.set(`auction:${auctionId}:status`, "active");
            await redis.zrem("auction:schedule:starts", auctionId);

            console.log(`Auction ${auctionId} started`);

            // Socket event: notify all clients in room
            io.to(`auction:${auctionId}`).emit("auction_state", {
                auctionId: auction.id,
                status: "active",
                currentHighest: null, // will populate later with Redis
                countdown: auction.durationSeconds,
            });
        }

        // --- End Auctions ---
        const toEnd = await redis.zrangebyscore("auction:schedule:ends", 0, now);
        for (const auctionId of toEnd) {
            const auction = await Auction.findByPk(auctionId);
            if (!auction || auction.status !== "active") continue;

            auction.status = "ended";
            await auction.save();

            await redis.set(`auction:${auctionId}:status`, "ended");
            await redis.zrem("auction:schedule:ends", auctionId);

            console.log(`Auction ${auctionId} ended`);

            // Socket event: notify all clients in room
            const highest = await redis.get(`auction:${auctionId}:highest`);
            io.to(`auction:${auctionId}`).emit("auction_ended", {
                auctionId: auction.id,
                highestBid: highest ? JSON.parse(highest) : null,
            });
        }

    }, POLL_INTERVAL);
};

module.exports = { startScheduler };
