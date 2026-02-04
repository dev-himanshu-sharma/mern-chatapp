import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../server.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        const unseenMessages = {};
        const promises = filteredUsers.map(async (user) => {
            const count = await Message.countDocuments({
                senderId: user._id,
                receiverId: userId,
                seen: false // Matches your Schema
            });
            if (count > 0) unseenMessages[user._id] = count;
        });

        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



// --- Updated getMessages ---
export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        // Update DB
        await Message.updateMany(
            { senderId: userToChatId, receiverId: myId, seen: false },
            { seen: true }
        );

        // ✅ FIX: Chat kholte hi sender ko notify karo
        const senderSocketId = getReceiverSocketId(userToChatId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesMarkedAsSeen", { 
                senderId: myId 
            });
        }

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



// Example Node.js Controller
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id: userToChatId } = req.params; // The person who sent the messages
    const myId = req.user._id;               // You (the person who viewed them)

    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, seen: false },
      { $set: { seen: true } }
    );

    // 🔥 CRITICAL: Notify the sender that you saw their messages
    const senderSocketId = getReceiverSocketId(userToChatId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesMarkedAsSeen", { 
        senderId: myId // Telling the sender: "User [myId] has seen your stuff"
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
};


export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            seen: false // Default to unseen
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
