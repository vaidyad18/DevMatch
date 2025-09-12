const express = require("express");
const paymentRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const { membershipAmounts } = require("../utils/constants");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { type } = req.body;
    const { firstName, lastName, emailId } = req.user;

    if (!membershipAmounts[type]) {
      return res.status(400).json({ error: "Invalid membership type" });
    }

    const order = await razorpayInstance.orders.create({
      amount: membershipAmounts[type] * 100, // paise
      currency: "INR",
      receipt: "receipt#1",
      notes: { firstName, lastName, emailId, membershipType: type },
    });

    const savedPayment = await new Payment({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      notes: order.notes,
      userId: req.user._id,
      status: order.status,     // "created"
      receipt: order.receipt,
    }).save();

    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(400).send("Error creating payment: " + err.message);
  }
});

// ❗ No express.json() here; app-level raw middleware is already attached for this path
paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const sig = req.get("X-Razorpay-Signature");
    // req.body is a Buffer because of app.use('/payment/webhook', express.raw(...))
    const rawBodyStr = req.body.toString("utf8");

    const isValid = validateWebhookSignature(
      rawBodyStr,
      sig,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );
    if (!isValid) return res.status(400).send("Invalid webhook signature");

    const payload = JSON.parse(rawBodyStr);
    const p = payload.payload.payment.entity; // payment obj from webhook

    const payment = await Payment.findOne({ orderId: p.order_id });
    if (!payment) {
      // ACK to stop retries, but log for investigation
      console.warn("Webhook for unknown orderId:", p.order_id);
      return res.status(200).json({ msg: "No matching orderId; acked" });
    }

    // If your account is manual-capture, first event will be "authorized".
    // Optional: auto-capture here (see section #2 below).
    payment.status = p.status; // "captured" when success (if auto-capture)
    await payment.save();

    const user = await User.findById(payment.userId);
    if (user) {
      user.isPremium = p.status === "captured";
      user.membershipType = payment.notes?.membershipType;
      await user.save();
    }

    return res.status(200).json({ msg: "Webhook received successfully" });
  } catch (err) {
    console.error("Webhook error:", err);
    // ACK to prevent Razorpay from disabling the webhook due to repeated 5xx
    return res.status(200).json({ msg: "Received" });
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  try {
    res.json({ isPremium: !!req.user.isPremium });
  } catch (err) {
    res.status(400).send("Error verifying payment: " + err.message);
  }
});

module.exports = paymentRouter;
