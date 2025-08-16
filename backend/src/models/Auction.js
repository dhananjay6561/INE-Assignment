const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Auction = sequelize.define("Auction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sellerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  startingPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  bidIncrement: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1,
  },
  goLiveAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      "scheduled",
      "active",
      "ended",
      "decision_pending",
      "accepted",
      "rejected",
      "closed_no_winner"
    ),
    defaultValue: "scheduled",
  },
}, {
  tableName: "auctions",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

module.exports = Auction;
