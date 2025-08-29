const express = require("express");
const requestRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");

requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
      const toUserId = req.params.toUserId;
      const fromUserId = req.user._id;
      const status = req.params.status;

      const ALLOWED_STATUSES = ["interested", "ignored"];
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await User.findById(toUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingRequest) {
        return res.status(400).json({ message: "Connection request already exists" });
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      await connectionRequest.save();
      res.status(200).json({
        message: "Connection request sent successfully",
        data: connectionRequest,
      });
    } catch (error) {
      res.status(500).json({message:error.message});
    }
  }
);

requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
    try {
        const loggedInUser=req.user;
        const requestId=req.params.requestId;
        const status=req.params.status;
        const ALLOWED_STATUSES = ["accepted", "rejected"];
        if (!ALLOWED_STATUSES.includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        const connectionRequest=await ConnectionRequest.findOne({_id:requestId, toUserId:loggedInUser, status:"interested"});
        if(!connectionRequest){
            return res.status(404).json({message:"Connection request not found"});
        }
        connectionRequest.status=status;
        await connectionRequest.save();
        res.status(200).json({message:"Connection request "+status, data:connectionRequest});

    } catch (error) {
      res.status(500).json({message:error.message});
    }
});

module.exports = requestRouter;
