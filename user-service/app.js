const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const usersRouter = require("./routes/users");

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
  app.use(express.json());

  const swaggerDocument = YAML.load(path.join(__dirname, "openapi.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get("/", (_req, res) => {
    res.status(200).json({
      message: "User Service",
      endpoints: {
        list: "GET /users",
        getOne: "GET /users/:id",
        create: "POST /users",
        update: "PUT /users/:id",
        remove: "DELETE /users/:id",
        docs: "GET /api-docs"
      }
    });
  });

  app.use("/users", usersRouter);

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
