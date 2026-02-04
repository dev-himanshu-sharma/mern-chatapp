import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import http from 'http'
import { connectDB } from "./lib/database.js"
import userRouter from './routes/userRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import { Server } from 'socket.io'

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
    cors: { origin: '*' }
})

export const userSocketMap = {}; // {userId: socketId}

// --- FIX: Receiver ID nikalne ke liye function ---
export const getReceiverSocketId = (userId) => {
    return userSocketMap[userId];
}

io.on('connection', socket => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
        console.log("User Connected:", userId);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on('disconnect', () => {
        console.log("User Disconnected:", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

app.use(express.json({ limit: '4mb' }));
app.use(cors());

app.use('/api/auth', userRouter);
app.use('/api/messages', messageRouter);

const PORT = process.env.PORT || 5000;

// DB Connect hone ke baad server start karein
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.log("Server error:", error);
    }
}

startServer();