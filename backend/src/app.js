const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/database");
require("dotenv").config();

const User = require("./models/User");
const Auction = require("./models/Auction");
const Bid = require("./models/Bid");

const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const bidRoutes = require("./routes/bidRoutes");
const decisionRoutes = require("./routes/decisionRoutes");

// Scheduler
const { startScheduler } = require("./workers/scheduler");

// BidController to inject io
const bidController = require("./controllers/bidController");

const app = express();
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/auctions", auctionRoutes);
app.use("/", bidRoutes);
app.use("/", decisionRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Auction platform backend running" });
});

const PORT = process.env.PORT || 5000;

// HTTP server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Inject io into bidController
bidController.setIo(io);

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

// DB init + scheduler
(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    // Uncomment in dev to drop & recreate tables
    // await sequelize.sync({ force: true }); 
    // console.log("All models synced & tables recreated");

    // Start scheduler with Socket.IO reference
    startScheduler(io);

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("DB connection failed:", error);
  }
})();

module.exports = { app, io };
