const express = require("express");
const User = require("../models/user");
const { validateSignupData } = require("../utils/validate");
const authRouter = express.Router();
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password } = req.body;

    validateSignupData(req);

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashPassword,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();
    res.cookie("token", token, { expires: new Date(Date.now() + 86400000) });
    res.send(user);
    res.json({message:"Success", data: savedUser});
  } catch (err) {
    res.status(400).send("Error registering user: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid login credentials");
    }

    const isPassordValid = await user.validatePassword(password);
    if (isPassordValid) {
      const token = await user.getJWT();
      res.cookie("token", token, { expires: new Date(Date.now() + 86400000)});
      res.send(user);
    } else {
      throw new Error("Invalid login credentials");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("User logged out successfully");
});

module.exports = authRouter;
