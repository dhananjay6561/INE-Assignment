const { Auction, Bid, User } = require("../models");
const redis = require("../config/redis");
const PDFDocument = require("pdfkit");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY, {sandbox:false});

const VERIFIED_SENDER = "dhananjayaggarwal6561@gmail.com"; // must be verified in SendGrid

exports.sellerDecision = async (req, res) => {
  const { auctionId } = req.params;
  const { action } = req.body;
  const userId = req.user.id;

  try {
    console.log(`[INFO] sellerDecision called for auctionId=${auctionId} by userId=${userId}`);

    const auction = await Auction.findByPk(auctionId, { include: ["bids"] });
    if (!auction) {
      console.log(`[ERROR] Auction not found: ${auctionId}`);
      return res.status(404).json({ error: "Auction not found" });
    }

    if (userId !== auction.sellerId) {
      console.log(`[ERROR] User ${userId} not authorized to decide on auction ${auctionId}`);
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!["accept","reject"].includes(action)) {
      console.log(`[ERROR] Invalid action: ${action}`);
      return res.status(400).json({ error: "Invalid action" });
    }

    let highestRaw = await redis.get(`auction:${auctionId}:highest`);
    const highest = highestRaw ? JSON.parse(highestRaw) : null;

    if (!highest) {
      auction.status = "closed_no_winner";
      await auction.save();
      console.log(`[INFO] No bids placed. Auction ${auctionId} closed.`);
      return res.json({ message: "No bids placed. Auction closed." });
    }

    if (action === "accept") {
      auction.status = "accepted";
      await auction.save();
      // persist status to Redis and cleanup highest bid
      try { await redis.set(`auction:${auctionId}:status`, auction.status); } catch (e) { console.error('Failed to set redis status', e); }
      try { await redis.del(`auction:${auctionId}:highest`); } catch (e) { /* non-fatal */ }
      console.log(`[INFO] Auction ${auctionId} accepted. Generating invoice for bidder ${highest.bidderId} at amount ${highest.amount}.`);

      const doc = new PDFDocument();
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);
        console.log(`[INFO] PDF invoice generated for auction ${auctionId}`);

        try {
          // Find buyer using highest.bidderId
          const buyer = await User.findByPk(highest.bidderId);
          const buyerEmail = buyer?.email;
          const sellerEmail = req.user.email;

          if (!buyerEmail) {
            console.error(`[ERROR] Buyer email not found for bidderId=${highest.bidderId}`);
          } else {
            console.log(`[INFO] Sending email to buyer: ${buyerEmail} and seller: ${sellerEmail}`);

            const attachment = { content: pdfData.toString("base64"), filename: "invoice.pdf", type: "application/pdf", disposition: "attachment" };

            const msgBuyer = {
              to: buyerEmail,
              from: VERIFIED_SENDER,
              subject: `Auction Accepted: ${auction.itemName}`,
              text: `Congratulations! You won the auction.`,
              attachments: [attachment],
            };

            const msgSeller = {
              to: sellerEmail,
              from: VERIFIED_SENDER,
              subject: `Auction Accepted: ${auction.itemName}`,
              text: `You accepted the bid.`,
              attachments: [attachment],
            };

            await sgMail.send(msgBuyer);
            console.log(`[SUCCESS] Email sent to buyer: ${buyerEmail}`);
            await sgMail.send(msgSeller);
            console.log(`[SUCCESS] Email sent to seller: ${sellerEmail}`);
          }

            // Notify winner via socket
          try {
            const { io } = require("../app");
            io.to(`user:${highest.bidderId}`).emit("seller_decision", { auctionId, decision: "accepted", amount: highest.amount });
            // Broadcast final result to auction room
            io.to(`auction:${auctionId}`).emit("auction_result", { auctionId, result: "accepted", highest });
          } catch (err) {
            console.error("Failed to emit seller_decision to winner or auction_result:", err);
          }

            // Persist notifications for buyer and seller
            try {
              const { Notification } = require('../models');
              await Notification.create({ userId: highest.bidderId, type: 'accepted', message: `Your bid of ${highest.amount} on auction ${auctionId} was accepted`, meta: { auctionId, amount: highest.amount } });
              await Notification.create({ userId: auction.sellerId, type: 'accepted_sent', message: `You accepted the bid of ${highest.amount} on auction ${auctionId}`, meta: { auctionId, amount: highest.amount } });
            } catch (e) { console.error('Failed to persist accept notifications', e); }

        } catch (err) {
          console.error(`[ERROR] SendGrid or notification error for auction ${auctionId}:`, err.response?.body || err);
        }
      });

      doc.text(`Invoice for Auction: ${auction.itemName}`);
      doc.text(`Final Price: ${highest.amount}`);
      doc.text(`Buyer: ${highest.bidderId}`);
      doc.text(`Seller: ${auction.sellerId}`);
      doc.text(`Auction ID: ${auction.id}`);
      doc.end();

    } else if (action === "reject") {
      auction.status = "rejected";
      await auction.save();
      // persist status and cleanup
      try { await redis.set(`auction:${auctionId}:status`, auction.status); } catch (e) { console.error('Failed to set redis status', e); }
      try { await redis.del(`auction:${auctionId}:highest`); } catch (e) { /* non-fatal */ }

      console.log(`[INFO] Auction ${auctionId} rejected`);

      const { io } = require("../app");
      try {
        io.to(`user:${highest.bidderId}`).emit("seller_decision", { auctionId, decision: "rejected" });
        io.to(`auction:${auctionId}`).emit("auction_result", { auctionId, result: "rejected", highest });
      } catch (err) {
        console.error("Failed to emit seller_decision to bidder or auction_result:", err);
      }

      // Persist notifications for rejection
      try {
        const { Notification } = require('../models');
        await Notification.create({ userId: highest.bidderId, type: 'rejected', message: `Your bid of ${highest.amount} on auction ${auctionId} was rejected`, meta: { auctionId, amount: highest.amount } });
        await Notification.create({ userId: auction.sellerId, type: 'rejected_sent', message: `You rejected the highest bid of ${highest.amount} on auction ${auctionId}`, meta: { auctionId, amount: highest.amount } });
      } catch (e) { console.error('Failed to persist reject notifications', e); }
    }

    res.json({ message: `Auction ${action}ed successfully` });

  } catch (err) {
    console.error(`[ERROR] Failed to process decision for auction ${auctionId}:`, err);
    res.status(500).json({ error: "Failed to process decision" });
  }
};
