// Minimal skeleton: will poll Redis ZSETs later
const redis = require("redis");
const client = redis.createClient({ url: process.env.REDIS_URL });

client.connect().then(() => console.log("Redis connected for scheduler"));

const startScheduler = () => {
  console.log("Scheduler started (placeholder)");
};

module.exports = { startScheduler };
