const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

function isValidId(id) {
  return typeof id === "string" && mongoose.isValidObjectId(id);
}

router.get("/", async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ _id: 1 });
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Bad Request", message: "id path parameter must be a valid Product id" });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Not Found", message: `Product with id ${id} does not exist` });
    }
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Bad Request", message: "id path parameter must be a valid Product id" });
    }
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      context: "query"
    });
    if (!product) {
      return res.status(404).json({ error: "Not Found", message: `Product with id ${id} does not exist` });
    }
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Bad Request", message: "id path parameter must be a valid Product id" });
    }
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ error: "Not Found", message: `Product with id ${id} does not exist` });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
