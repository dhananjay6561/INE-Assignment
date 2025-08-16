const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/database");
require("dotenv").config();

const User = require("./models/User");
const Auction = require("./models/Auction");

const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const bidRoutes = require("./routes/bidRoutes");

// Scheduler placeholder
const { startScheduler } = require("./workers/scheduler");

const app = express();
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/auctions", auctionRoutes);
app.use("/bids", bidRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Auction platform backend running" });
});

const PORT = process.env.PORT || 5000;

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_auction", (auctionId) => {
    socket.join(`auction:${auctionId}`);
    console.log(`Socket ${socket.id} joined auction:${auctionId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Initialize DB + start scheduler
(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    await sequelize.sync();
    console.log("Models synced");

    // Start scheduler after DB is ready
    startScheduler();

    // Start server
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("DB connection failed:", error);
  }
})();

module.exports = { app, io };
