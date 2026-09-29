const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");

const router = express.Router();

function isValidId(id) {
  return typeof id === "string" && mongoose.isValidObjectId(id);
}

router.get("/", async (_req, res, next) => {
  try {
    const users = await User.find().sort({ _id: 1 });
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Bad Request", message: "id path parameter must be a valid User id" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: `User with id ${id} does not exist` });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Bad Request", message: "id path parameter must be a valid User id" });
    }
    const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      context: "query"
    });
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: `User with id ${id} does not exist` });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Bad Request", message: "id path parameter must be a valid User id" });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: "Not Found", message: `User with id ${id} does not exist` });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
