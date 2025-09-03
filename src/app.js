const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");
const cors = require("cors");

const connectDB = require("./config/database");

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);

connectDB().then(() => {
  console.log("Database connected successfully");
  app.listen(7777, () => {
    console.log("Server is running on port 7777");
  });
});
