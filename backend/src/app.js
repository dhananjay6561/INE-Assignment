const express = require("express");
const sequelize = require("./config/database");
require("dotenv").config();

const User = require("./models/User");
const Auction = require("./models/Auction");

const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");

// Scheduler placeholder
const { startScheduler } = require("./workers/scheduler");

const app = express();
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/auctions", auctionRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Auction platform backend running 🚀" });
});

// Initialize DB + start scheduler
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");
    await sequelize.sync();
    console.log("Models synced");

    // Start scheduler after DB is ready
    startScheduler();

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("DB connection failed:", error);
  }
})();

module.exports = app; // export for future testing / socket integration
