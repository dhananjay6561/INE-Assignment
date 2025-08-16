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

    let highest = await redis.get(`auction:${auctionId}:highest`);
    highest = highest ? JSON.parse(highest) : null;

    if (!highest) {
      auction.status = "closed_no_winner";
      await auction.save();
      console.log(`[INFO] No bids placed. Auction ${auctionId} closed.`);
      return res.json({ message: "No bids placed. Auction closed." });
    }

    if (action === "accept") {
      auction.status = "accepted";
      await auction.save();
      console.log(`[INFO] Auction ${auctionId} accepted. Generating invoice.`);

      const doc = new PDFDocument();
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);
        console.log(`[INFO] PDF invoice generated for auction ${auctionId}`);

        try {
          const winnerBid = auction.bids[auction.bids.length-1];
          const buyer = await User.findByPk(winnerBid.bidderId);
          const buyerEmail = buyer.email;
          const sellerEmail = req.user.email;

          console.log(`[INFO] Sending email to buyer: ${buyerEmail} and seller: ${sellerEmail}`);

          const msgBuyer = {
            to: buyerEmail,
            from: VERIFIED_SENDER,
            subject: `Auction Accepted: ${auction.itemName}`,
            text: `Congratulations! You won the auction.`,
            attachments: [{ content: pdfData.toString("base64"), filename: "invoice.pdf", type: "application/pdf", disposition: "attachment" }],
          };

          const msgSeller = {
            to: sellerEmail,
            from: VERIFIED_SENDER,
            subject: `Auction Accepted: ${auction.itemName}`,
            text: `You accepted the bid.`,
            attachments: [{ content: pdfData.toString("base64"), filename: "invoice.pdf", type: "application/pdf", disposition: "attachment" }],
          };

          await sgMail.send(msgBuyer);
          console.log(`[SUCCESS] Email sent to buyer: ${buyerEmail}`);
          await sgMail.send(msgSeller);
          console.log(`[SUCCESS] Email sent to seller: ${sellerEmail}`);

        } catch (err) {
          console.error(`[ERROR] SendGrid error for auction ${auctionId}:`, err.response?.body || err);
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
      console.log(`[INFO] Auction ${auctionId} rejected`);

      const { io } = require("../app");
      io.to(`user:${highest.bidderId}`).emit("seller_decision", { auctionId, decision: "rejected" });
    }

    res.json({ message: `Auction ${action}ed successfully` });

  } catch (err) {
    console.error(`[ERROR] Failed to process decision for auction ${auctionId}:`, err);
    res.status(500).json({ error: "Failed to process decision" });
  }
};
