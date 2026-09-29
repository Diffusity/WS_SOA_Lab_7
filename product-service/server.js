require("dotenv").config();
const { connectDB } = require("./config/db");
const createApp = require("./app");

const PORT = process.env.PRODUCT_SERVICE_PORT || process.env.PORT || 3002;

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Product Service listening on port ${PORT}`);
    console.log("Connected to MongoDB - data persists across restarts");
  });
}

main().catch((err) => {
  console.error("Failed to start Product Service:", err.message);
  process.exit(1);
});
