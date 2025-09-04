const express = require("express");
const userRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
const { userAuth } = require("../middlewares/auth");
const { connect } = require("mongoose");
const User = require("../models/user");

const USER_DATA=[
      "firstName",
      "lastName",
      "skills",
      "age",
      "photoURL",
      "gender",
      "description",
      "emailId",
      "mobile",
      
    ];

userRouter.get("/user/requests/recieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const requestsRecieved = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", USER_DATA);
    res.status(200).json({ message: "Success", data: requestsRecieved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

userRouter.get('/user/connections', userAuth, async (req, res) => {
    try{
        const loggedInUser = req.user;
        const connections = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id, status: 'accepted' },
                { toUserId: loggedInUser._id, status: 'accepted' }
            ]
        }).populate('fromUserId', USER_DATA).populate('toUserId', USER_DATA);

        const data = connections.map(connection => {
            if(connection.fromUserId._id.toString() === loggedInUser._id.toString()){
                return connection.toUserId;
            }
            return connection.fromUserId;
        })
        res.status(200).json({ message: 'Success', data: data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

userRouter.get("/user/feed", userAuth, async (req, res) => {
    try{
        const loggedInUser = req.user;
        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 20 ? 20 : limit;
        const skip = (page - 1) * limit;

        const connectionRequets=await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ]
        }).select('fromUserId toUserId');

        const hideUsers = new Set();
        connectionRequets.forEach(request => {
            hideUsers.add(request.fromUserId.toString());
            hideUsers.add(request.toUserId.toString());
        });

        const feed = await User.find({
            $and: [{ _id: { $nin: Array.from(hideUsers) }},
                    { _id: { $ne: loggedInUser._id } }
                ]
        }).select(USER_DATA).skip(skip).limit(limit);

        res.json({message:"Success", data:feed});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = userRouter;
