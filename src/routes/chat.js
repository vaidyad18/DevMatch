const express = require("express");
const chatRouter = express.Router();
const Chat = require("../models/chat");
const { userAuth } = require("../middlewares/auth");

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;
  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    })
      .populate({
        path: "messages.senderId",
        select: "firstName lastName photoURL",
      })
      .populate({
        path: "participants",
        select: "firstName lastName photoURL",
      });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();

      chat = await Chat.findById(chat._id).populate({
        path: "participants",
        select: "firstName lastName photoURL",
      });
    }
    res.json({ chat });
  } catch (err) {
    res.status(400).send("Error fetching chat history: " + err.message);
  }
});

module.exports = chatRouter;
