const express = require("express");
const app = express();
const User = require("./models/user");

const connectDB = require("./config/database");

app.use(express.json());

app.get("/user", async (req, res) => {
  try {
    const user = await User.findOne({ emailId: req.body.emailId });
    if (!user) {
      res.status(404).send("User not found");
    } else {
      res.send(user);
    }
  } catch (err) {
    res.status(400).send("Error registering user: " + err.message);
  }
});

app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    if (users.length === 0) {
      res.status(404).send("User not found");
    } else {
      res.send(users);
    }
  } catch (err) {
    res.status(400).send("Error registering user: " + err.message);
  }
});

app.post("/signup", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    res.send("User registered successfully");
  } catch (err) {
    res.status(400).send("Error registering user: " + err.message);
  }
});

app.delete("/user", async (req, res) => {
  try {
    const userId= req.body.userId;
    const user = await User.findByIdAndDelete(userId);
    res.send("User deleted successfully");
  } catch (err) {
    res.status(400).send("Error deleting user: " + err.message);
  }
});

app.patch("/user",async (req,res)=>{
  try{
    const email= req.body.email;
    const data= req.body;
    const user= await User.findOneAndUpdate({emailId:email},data,{runValidators:true});
    res.send("User updated successfully");
  }catch(err){
    res.status(400).send("Error updating user: " + err.message);
  }
});

connectDB().then(() => {
  console.log("Database connected successfully");
  app.listen(7777, () => {
    console.log("Server is running on port 7777");
  });
});
