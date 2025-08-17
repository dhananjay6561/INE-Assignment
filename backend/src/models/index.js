const sequelize = require("../config/database");
const Auction = require("./Auction");
const Bid = require("./Bid");
const User = require("./User");
const Notification = require("./Notification");

// Associations
Auction.hasMany(Bid, { foreignKey: "auctionId", as: "bids" });
Bid.belongsTo(Auction, { foreignKey: "auctionId", as: "auction" });

User.hasMany(Bid, { foreignKey: "bidderId", as: "userbids" });
Bid.belongsTo(User, { foreignKey: "bidderId", as: "bidder" });

// Add seller association for auction
Auction.belongsTo(User, { foreignKey: "sellerId", as: "seller" });

module.exports = { sequelize, Auction, Bid, User, Notification };
