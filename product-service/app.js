const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const productsRouter = require("./routes/products");

function createApp() {
  const app = express();

  const promBundle = require('express-prom-bundle');
  const metricsMiddleware = promBundle({ includeMethod: true, includePath: true, excludeRoutes: ['/health'] });
  app.use(metricsMiddleware);

  app.get('/health', (req, res) => {
      res.status(200).json({ status: 'UP', message: 'Product Service is running' });
  });
  app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
  app.use(express.json());

  const swaggerDocument = YAML.load(path.join(__dirname, "openapi.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get("/", (_req, res) => {
    res.status(200).json({
      message: "Product Service",
      endpoints: {
        list: "GET /products",
        getOne: "GET /products/:id",
        create: "POST /products",
        update: "PUT /products/:id",
        remove: "DELETE /products/:id",
        docs: "GET /api-docs"
      }
    });
  });

  app.use("/products", productsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", message: `Route ${req.method} ${req.originalUrl} does not exist` });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Bad Request", message: "Request body contains invalid JSON" });
    }
    if (err.name === "MongoServerError" && err.code === 11000) {
      const email = err.keyValue && err.keyValue.email ? err.keyValue.email : "unknown";
      return res.status(400).json({ error: "Bad Request", message: `Email '${email}' is already in use` });
    }
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "An unexpected server-side failure occurred" });
  });

  return app;
}

module.exports = createApp;
