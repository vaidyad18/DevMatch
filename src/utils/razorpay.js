const Razorpay = require("razorpay");

if (!process.env.RAZORPAY_KEY_ID ) {
  throw new Error("Razorpay envs missing. Check RAZORPAY_KEY_ID");
}

module.exports = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
