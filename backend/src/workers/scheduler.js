const redis = require("../config/redis");
const Auction = require("../models/Auction");

const POLL_INTERVAL = 5000; // 5 sec

const startScheduler = async (io) => {
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

            if (io) {
                io.to(`auction:${auctionId}`).emit("auction_state", {
                    auctionId: auction.id,
                    status: "active",
                    currentHighest: null,
                    countdown: auction.durationSeconds,
                });
            }
        }

        // --- End Auctions ---
        const toEnd = await redis.zrangebyscore("auction:schedule:ends", 0, now);
        for (const auctionId of toEnd) {
            const auction = await Auction.findByPk(auctionId);
            if (!auction || auction.status !== "active") continue;

            // Move to decision_pending so seller must accept/reject
            auction.status = "decision_pending";
            await auction.save();
            await redis.set(`auction:${auctionId}:status`, "decision_pending");
            await redis.zrem("auction:schedule:ends", auctionId);

            console.log(`Auction ${auctionId} moved to decision_pending`);

            if (io) {
                const highestRaw = await redis.get(`auction:${auctionId}:highest`);
                const highest = highestRaw ? JSON.parse(highestRaw) : null;

                // Broadcast to auction room that auction ended and decision is required
                io.to(`auction:${auctionId}`).emit("auction_ended", {
                    auctionId: auction.id,
                    highestBid: highest,
                    decisionRequired: true,
                });

                // Notify seller directly that their action is required
                if (auction.sellerId && highest) {
                    io.to(`user:${auction.sellerId}`).emit("seller_action_required", {
                        auctionId: auction.id,
                        highestBid: highest,
                    });
                } else if (auction.sellerId) {
                    io.to(`user:${auction.sellerId}`).emit("seller_action_required", {
                        auctionId: auction.id,
                        highestBid: null,
                    });
                }
            }
        }
    }, POLL_INTERVAL);
};

module.exports = { startScheduler };
