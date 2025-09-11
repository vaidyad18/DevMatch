const express = require('express');
const paymentRouter = express.Router();
const {userAuth} = require('../middlewares/auth');
const razorpayInstance = require('../utils/razorpay');
const Payment = require('../models/payment');
const {membershipAmounts}  = require('../utils/constants');

paymentRouter.post('/payment/create', userAuth, async (req, res) => {
    try{
        const { type } = req.body;
        const { firstName, lastName, emailId } = req.user;

        const order = await razorpayInstance.orders.create({
            "amount":membershipAmounts[type]*100,   //paisa , not in rupees 
            "currency":"INR",
            "receipt":"receipt#1",
            "notes": {
                firstName,
                lastName,
                emailId,
                membershipType: type,
            }
        });

        const payment = new Payment({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            notes: order.notes,
            userId: req.user._id,
            status: order.status,
            receipt: order.receipt,
        });

        const savedPayment = await payment.save();

        res.json({ savedPayment , keyId:process.env.RAZORPAY_KEY_ID });
    }catch(err){
        res.status(400).send('Error creating payment: ' + err.message);
    }
})

paymentRouter.post('/payment/webhook', async (req, res) => {
    try{
        const webhookSignature = req.headers("X-Razorpay-Signature");
        const isWebhookValid = validateWebhookSignature(
            JSON.stringify(req.body),
            webhookSignature,
            process.env.RAZORPAY_WEBHOOK_SECRET
        );

        if(!isWebhookValid){
            res.status(400).send('Invalid webhook signature');
        }

        const paymentDetails =req.body.payload.payment.entity;

        const payment = await Payment.findOne({orderId: paymentDetails.order_id});
        payment.status = paymentDetails.status;
        await payment.save();

        const user = await User.finbyId(payment.userId);
        user.isPremium = true;
        user.membershipType = payment.notes.membershipType;
        await user.save();
    }catch(err){
        res.status(400).send('Error processing webhook: '+ err.message);    
    }
})

paymentRouter.get('/premium/verify', userAuth, async (req, res) => {
    try{
        const user = req.user;
        if(user.isPremium){
            return res.json({ isPremium: true });
        }else{
            return res.json({ isPremium: false });
        }
    }catch(err){
        res.status(400).send('Error verifying payment: '+ err.message);
    }
})

module.exports = paymentRouter;