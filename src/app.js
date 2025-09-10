require('dotenv').config();
console.log('Has RAZORPAY_KEY_ID?', !!process.env.RAZORPAY_KEY_ID);
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");
const cors = require("cors");


const connectDB = require("./config/database");
const paymentRouter = require("./routes/payment");

app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);
app.use("/",paymentRouter);

connectDB().then(() => {
  console.log("Database connected successfully");
  app.listen(7777, () => {
    console.log("Server is running on port 7777");
  });
});
