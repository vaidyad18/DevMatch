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
  const where = "/payment/webhook";
  try {
    // 0) Prove we are receiving a Buffer
    const isBuffer = Buffer.isBuffer(req.body);
    console.log(`[WEBHOOK] hit ${where}, isBuffer=${isBuffer}, len=${isBuffer ? req.body.length : 'n/a'}`);

    // 1) Read headers & env
    const sig = req.get("X-Razorpay-Signature");
    const secretSet = !!process.env.RAZORPAY_WEBHOOK_SECRET;
    console.log(`[WEBHOOK] signature present=${!!sig}, secretSet=${secretSet}`);

    // 2) Validate signature on exact raw bytes
    const rawBodyStr = isBuffer ? req.body.toString("utf8") : JSON.stringify(req.body || {});
    let isValid = false;
    try {
      isValid = validateWebhookSignature(rawBodyStr, sig, process.env.RAZORPAY_WEBHOOK_SECRET);
    } catch (e) {
      console.error("[WEBHOOK] validateWebhookSignature threw:", e.message);
    }
    console.log(`[WEBHOOK] signature valid=${isValid}`);

    if (!isValid) {
      // Respond 400 so Razorpay dash shows you the failure clearly
      return res.status(400).send("Invalid webhook signature");
    }

    // 3) Parse JSON
    let payload;
    try {
      payload = JSON.parse(rawBodyStr);
    } catch (e) {
      console.error("[WEBHOOK] JSON.parse failed:", e.message);
      return res.status(400).send("Invalid JSON");
    }

    const event = payload.event;
    const p = payload?.payload?.payment?.entity;
    console.log(`[WEBHOOK] event=${event}, paymentId=${p?.id}, orderId=${p?.order_id}, status=${p?.status}, amount=${p?.amount}, currency=${p?.currency}`);

    if (!p?.order_id) {
      console.warn("[WEBHOOK] Missing order_id on payload");
      return res.status(200).json({ msg: "Received (no order_id)" });
    }

    // 4) Load your Payment row
    const payment = await Payment.findOne({ orderId: p.order_id });
    if (!payment) {
      console.warn("[WEBHOOK] No Payment row for order_id", p.order_id);
      return res.status(200).json({ msg: "No matching orderId; acked" });
    }

    // 5) If you are in MANUAL CAPTURE mode, you’ll first see 'authorized'
    // (Optional) auto-capture here to convert to 'captured'
    if (p.status === "authorized") {
      console.log("[WEBHOOK] Payment is authorized; attempting capture...");
      try {
        await razorpayInstance.payments.capture(p.id, p.amount, p.currency); // amount in paise
        console.log("[WEBHOOK] Capture API called successfully. Waiting for payment.captured webhook.");
      } catch (e) {
        console.error("[WEBHOOK] Capture API failed:", e.message);
      }
      // Do not mark captured yet; Razorpay will send payment.captured next.
    }

    // 6) Persist latest status from webhook
    payment.status = p.status; // created/authorized/captured/failed/refunded
    await payment.save();
    console.log(`[WEBHOOK] DB updated: orderId=${payment.orderId}, newStatus=${payment.status}`);

    // 7) Update user premium flag ONLY when truly captured
    if (p.status === "captured") {
      const user = await User.findById(payment.userId);
      if (user) {
        user.isPremium = true;
        user.membershipType = payment.notes?.membershipType;
        await user.save();
        console.log(`[WEBHOOK] User upgraded: userId=${user._id}, membership=${user.membershipType}`);
      } else {
        console.warn("[WEBHOOK] Payment has userId but user not found", payment.userId);
      }
    }

    return res.status(200).json({ msg: "Webhook processed" });
  } catch (err) {
    console.error("[WEBHOOK] Unhandled error:", err);
    // Still ACK to avoid disable, but log
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
