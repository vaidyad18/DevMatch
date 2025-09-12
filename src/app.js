require('dotenv').config();
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

app.use("/api/",authRouter);
app.use("/api/",profileRouter);
app.use("/api/",requestRouter);
app.use("/api/",userRouter);
app.use("/api/",paymentRouter);

connectDB().then(() => {
  console.log("Database connected successfully");
  app.listen(7777, () => {
    console.log("Server is running on port 7777");
  });
});
