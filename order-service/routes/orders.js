const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");

const router = express.Router();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

function isValidId(id) {
  return typeof id === "string" && mongoose.isValidObjectId(id);
}

router.get("/", async (_req, res, next) => {
  try {
    const orders = await Order.find().sort({ _id: 1 });
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Bad Request", message: "id path parameter must be a valid Order id" });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Not Found", message: `Order with id ${id} does not exist` });
    }
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { userId, productId, quantity } = req.body;

    // Validate with User Service
    try {
      const userRes = await fetch(`${USER_SERVICE_URL}/users/${userId}`);
      if (!userRes.ok) {
        if (userRes.status === 404) {
          return res.status(404).json({ error: "Not Found", message: "User not found" });
        }
        throw new Error("User service returned error");
      }
    } catch (err) {
      return res.status(503).json({ error: "Service Unavailable", message: "User service is unavailable" });
    }

    // Validate with Product Service
    try {
      const productRes = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}`);
      if (!productRes.ok) {
        if (productRes.status === 404) {
          return res.status(404).json({ error: "Not Found", message: "Product not found" });
        }
        throw new Error("Product service returned error");
      }
    } catch (err) {
      return res.status(503).json({ error: "Service Unavailable", message: "Product service is unavailable" });
    }

    const order = await Order.create({ userId, productId, quantity });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
