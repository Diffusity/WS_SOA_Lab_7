require("dotenv").config();
const { connectDB } = require("./config/db");
const createApp = require("./app");

const PORT = process.env.ORDER_SERVICE_PORT || process.env.PORT || 3003;

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Order Service listening on port ${PORT}`);
    console.log("Connected to MongoDB - data persists across restarts");
  });
}

main().catch((err) => {
  console.error("Failed to start Order Service:", err.message);
  process.exit(1);
});
